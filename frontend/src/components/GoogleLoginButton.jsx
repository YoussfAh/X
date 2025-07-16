import React, { useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { FaGoogle } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGoogleLoginMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { showErrorToast, showSuccessToast } from '../utils/toastConfig';

const GoogleLoginButton = ({ redirect = '/home', className = '', disabled = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [googleLogin, { isLoading }] = useGoogleLoginMutation();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (isInitializedRef.current) return;
      
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        console.error('Google Client ID not found in environment variables');
        showErrorToast('Google login is not configured properly');
        return;
      }

      // Load Google Identity Services
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: () => {}, // We'll handle the callback manually
        });
        isInitializedRef.current = true;
        console.log('Google Identity Services initialized');
      } else {
        console.error('Google Identity Services not loaded');
      }
    };

    // Wait for Google script to load
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Poll for Google script to load
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogleSignIn();
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!isInitializedRef.current) {
          console.error('Google script failed to load');
        }
      }, 10000);
    }
  }, []);

  const handleGoogleLogin = () => {
    try {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        showErrorToast('Google login is not configured. Please check environment variables.');
        return;
      }

      if (!window.google) {
        showErrorToast('Google services are not available. Please refresh the page.');
        return;
      }

      // Use Google Identity Services OAuth popup
      window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error) {
            console.error('Google OAuth error:', response);
            if (response.error === 'popup_closed_by_user') {
              showErrorToast('Google login was cancelled');
            } else {
              showErrorToast('Google login failed: ' + response.error);
            }
            return;
          }

          try {
            // Get user info with the access token
            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
            const userInfo = await userInfoResponse.json();

            // Create a mock ID token for our backend (we'll improve this)
            const mockIdToken = btoa(JSON.stringify({
              sub: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
              email_verified: userInfo.verified_email,
              picture: userInfo.picture,
              iss: 'accounts.google.com',
              aud: clientId,
              exp: Date.now() + 3600000, // 1 hour
              iat: Date.now()
            }));

            // Get device ID from localStorage or generate a new one
            const deviceId = localStorage.getItem('deviceId') ||
              Math.random().toString(36).substring(2, 15) +
              Math.random().toString(36).substring(2, 15);

            // Store device ID if it's new
            if (!localStorage.getItem('deviceId')) {
              localStorage.setItem('deviceId', deviceId);
            }

            // Send the user info to our backend
            const result = await googleLogin({
              idToken: mockIdToken,
              userInfo: userInfo, // Send raw user info as backup
            }).unwrap();

            // Set credentials in Redux store
            dispatch(setCredentials(result));
            
            // Show success message
            showSuccessToast(`Welcome back, ${result.name}!`);
            
            // Navigate to the redirect URL
            navigate(redirect);
            
          } catch (error) {
            console.error('Backend login error:', error);
            const message = error?.data?.message || error?.message || 'Login failed';
            showErrorToast(message);
          }
        },
      }).requestAccessToken();

    } catch (error) {
      console.error('Google login initialization error:', error);
      showErrorToast('Failed to initialize Google login');
    }
  };

  return (
    <Button
      variant="outline-danger"
      className={`w-100 py-2 d-flex align-items-center justify-content-center ${className}`}
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading}
    >
      <FaGoogle className="me-2" />
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};

export default GoogleLoginButton; 