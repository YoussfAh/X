import React from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { globalToastConfig } from '../utils/toastConfig';

const LandingLayout = () => {
    return (
        <>
            <ToastContainer
                position={globalToastConfig.position}
                autoClose={globalToastConfig.autoClose}
                hideProgressBar={globalToastConfig.hideProgressBar}
                closeOnClick={globalToastConfig.closeOnClick}
                pauseOnHover={globalToastConfig.pauseOnHover}
                draggable={globalToastConfig.draggable}
                pauseOnFocusLoss={globalToastConfig.pauseOnFocusLoss}
                theme="colored"
                limit={globalToastConfig.limit}
                closeButton={globalToastConfig.closeButton}
                className={globalToastConfig.className}
                bodyClassName={globalToastConfig.bodyClassName}
                style={globalToastConfig.style}
                icon={globalToastConfig.icon}
            />
            <Outlet />
        </>
    );
};

export default LandingLayout;
