import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '../constants';
import { logout } from './authSlice'; // Import the logout action
import { showWarningToast } from '../utils/toastConfig'; // Import toast notification

// Enhanced base query with retry logic for network errors
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',  // Always include credentials
  timeout: 15000, // 15 second timeout
  prepareHeaders: (headers, { getState }) => {
    // Ensure all necessary CORS headers are set for cross-domain requests
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Content-Type', 'application/json');

    // Add userInfo from localStorage as a backup authentication method
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const { _id } = JSON.parse(userInfo);
        if (_id) {
          headers.set('x-user-id', _id);
        }
      } catch (e) {
        console.warn('Failed to parse userInfo from localStorage');
      }
    }

    // Add device ID for session tracking
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      headers.set('x-device-id', deviceId);
    }

    return headers;
  },
});

// Enhanced base query with retry logic and better error handling
async function baseQueryWithAuth(args, api, extra) {
  let result = await baseQuery(args, api, extra);

  // Handle network errors with retry logic
  if (result.error && (
    result.error.status === 'FETCH_ERROR' || 
    result.error.status === 'TIMEOUT_ERROR' ||
    result.error.name === 'TypeError' ||
    (result.error.message && result.error.message.includes('Failed to fetch'))
  )) {
    console.warn('Network error detected, attempting retry...', result.error);
    
    // Wait 1 second and retry once
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await baseQuery(args, api, extra);
    
    if (result.error) {
      console.error('Retry failed, network connectivity issue:', result.error);
      // Don't logout for network errors
      return result;
    }
  }

  // Handle 401 errors more carefully to prevent unnecessary logouts
  if (result.error && result.error.status === 401) {
    // Check if this is specifically a session invalidation error
    const isSessionInvalidated = result.error.data?.message?.includes('Another device has logged in') ||
                                 result.error.data?.message?.includes('Session expired') ||
                                 result.error.data?.message?.includes('Invalid session');

    // For session invalidation, log out immediately without retry
    if (isSessionInvalidated) {
      // Show a toast notification to inform the user why they're being logged out
      showWarningToast('You have been logged out because your account was accessed from another device or your session expired');

      // Clear local storage and dispatch logout action
      localStorage.removeItem('userInfo');
      localStorage.removeItem('sessionId');
      // Keep deviceId for tracking purposes
      api.dispatch(logout());
      return result;
    }

    // For other 401 errors, try the retry logic only once
    const userInfo = localStorage.getItem('userInfo');
    const sessionId = localStorage.getItem('sessionId');

    // If we have userInfo and sessionId but get a 401, try the request once more
    // This helps when cookies might not be transmitted properly
    if (userInfo && sessionId && !args.headers?.['x-retry']) {
      const retryArgs = {
        ...args,
        headers: {
          ...args.headers,
          'x-retry': 'true',
          'x-session-id': sessionId
        }
      };

      // Try the request again
      const retryResult = await baseQuery(retryArgs, api, extra);
      if (!retryResult.error) {
        return retryResult;
      }
      
      // If retry also failed with 401, only then logout
      if (retryResult.error && retryResult.error.status === 401) {
        console.warn('Authentication failed after retry, logging out user');
        api.dispatch(logout());
      }
      
      return retryResult;
    }

    // If we don't have authentication info, just return the error without logging out
    // This prevents unnecessary logouts when user is already logged out
    if (!userInfo || !sessionId) {
      return result;
    }

    // If retry failed or we had issues, logout only as last resort
    console.warn('Authentication failed, logging out user');
    api.dispatch(logout());
  }

  return result;
}

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth, // Use the customized baseQuery
  tagTypes: [
    'Product',
    'Order',
    'User',
    'Collections',
    'WorkoutEntries',
    'UserWorkoutEntries',
    'AllWorkoutEntries',
    'OneTimeCodes',
    'AssignedCollections',
    'ProgressImages'
  ],
  endpoints: (builder) => ({}),
});
