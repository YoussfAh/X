import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// This component will handle public routes like landing page, login, and register
// If user is already logged in, redirect to home page
const PublicRoute = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const location = useLocation();

    // If user is already logged in, redirect to home page
    return userInfo
        ? <Navigate to="/home" replace />
        : <Outlet />;
};

export default PublicRoute;
