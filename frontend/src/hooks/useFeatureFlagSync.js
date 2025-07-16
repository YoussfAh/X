// Feature Flag Synchronization Hook
// This provides a mechanism to keep feature flags in sync between admin updates and user experience

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRefreshUserDataQuery } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';

const useFeatureFlagSync = (options = {}) => {
  const { 
    autoRefresh = true, 
    onFlagsUpdated = null,
    checkInterval = 30000 // 30 seconds
  } = options;
  
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  
  // RTK Query to refresh user data
  const {
    data: refreshedUserData,
    isLoading: isRefreshing,
    error: refreshError,
    refetch: refreshUserData
  } = useRefreshUserDataQuery(undefined, {
    skip: !userInfo,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  // Manual refresh function
  const refreshFlags = useCallback(async () => {
    if (!userInfo) return null;
    
    try {
      const result = await refreshUserData();
      return result.data;
    } catch (error) {
      console.error('Failed to refresh feature flags:', error);
      return null;
    }
  }, [refreshUserData, userInfo]);

  // Update Redux state when refreshed data is available
  useEffect(() => {
    if (refreshedUserData && userInfo) {
      const oldFlags = userInfo.featureFlags || {};
      const newFlags = refreshedUserData.featureFlags || {};
      
      // Check if flags have changed
      const flagsChanged = JSON.stringify(oldFlags) !== JSON.stringify(newFlags);
      
      if (flagsChanged) {
        console.log('🚩 Feature flags updated:');
        console.log('  Old flags:', oldFlags);
        console.log('  New flags:', newFlags);
        
        // Update Redux state
        dispatch(setCredentials(refreshedUserData));
        
        // Call callback if provided
        if (onFlagsUpdated) {
          onFlagsUpdated(newFlags, oldFlags);
        }
      }
    }
  }, [refreshedUserData, userInfo, dispatch, onFlagsUpdated]);

  // Auto-refresh interval (optional)
  useEffect(() => {
    if (!autoRefresh || !userInfo) return;
    
    const interval = setInterval(() => {
      refreshFlags();
    }, checkInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, userInfo, checkInterval, refreshFlags]);

  return {
    refreshFlags,
    isRefreshing,
    refreshError,
    currentFlags: userInfo?.featureFlags || {}
  };
};

export default useFeatureFlagSync;
