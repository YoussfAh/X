import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout, updateSessionId } from '../slices/authSlice';
import Loader from './Loader';
import { showWarningToast } from '../utils/toastConfig';

// This component will wrap all routes that require authentication
const AuthWrapper = () => {
    const { userInfo, deviceId, sessionId } = useSelector((state) => state.auth);
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Session validation
    useEffect(() => {
        let sessionCheckInterval;
        
        // Only set up interval if we have a logged-in user
        if (userInfo) {
            // Function to validate the current session
            const validateSession = async () => {
                try {
                    // Simple ping to check authentication status
                    const response = await fetch(`${window.location.origin}/api/users/validate-session`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': userInfo._id,
                            'x-device-id': deviceId || localStorage.getItem('deviceId'),
                            'x-session-id': sessionId || localStorage.getItem('sessionId'),
                        },
                        credentials: 'include'
                    });
                    
                    // If response is not ok, user has been logged out by another session
                    if (!response.ok) {
                        const data = await response.json();
                        
                        // Check if this is a session invalidation
                        if (data.message && data.message.includes('Another device has logged in')) {
                            showWarningToast('You have been logged out because your account was accessed from another device');
                            localStorage.removeItem('userInfo');
                            localStorage.removeItem('sessionId');
                            // Keep deviceId for tracking
                            dispatch(logout());
                            navigate('/login');
                        }
                    } else {
                        // If the response included a new session ID, update it
                        const data = await response.json();
                        if (data.sessionId && data.sessionId !== sessionId) {
                            dispatch(updateSessionId(data.sessionId));
                        }
                    }
                } catch (error) {
                    // Network errors should not log the user out
                    console.error('Session validation error:', error);
                }
            };
            
            // Check session immediately and then every 30 seconds
            validateSession();
            sessionCheckInterval = setInterval(validateSession, 30000);
        }
        
        return () => {
            // Clean up interval when component unmounts
            if (sessionCheckInterval) {
                clearInterval(sessionCheckInterval);
            }
        };
    }, [userInfo, navigate, dispatch, deviceId, sessionId]);

    // Enhanced authentication check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // First check if we have userInfo in redux state
                if (userInfo) {
                    setLoading(false);
                    return;
                }
                
                // If not in redux, try to get from localStorage
                const storedUserInfo = localStorage.getItem('userInfo');
                const storedSessionId = localStorage.getItem('sessionId');
                
                if (storedUserInfo) {
                    // Restore from localStorage to redux state
                    const parsedUserInfo = JSON.parse(storedUserInfo);
                    dispatch(setCredentials({
                        ...parsedUserInfo,
                        sessionId: storedSessionId
                    }));
                    setLoading(false);
                    return;
                }

                // No authentication found
                setLoading(false);
            } catch (error) {
                console.error('Auth check failed:', error);
                setLoading(false);
            }
        };

        checkAuth();
    }, [dispatch, userInfo]);

    // Show loader while checking authentication
    if (loading) {
        return <Loader />;
    }

    // If user is not logged in, redirect to login page with return url
    return userInfo 
        ? <Outlet /> 
        : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

export default AuthWrapper;
