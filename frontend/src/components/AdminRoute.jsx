import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TenantProvider } from '../contexts/TenantContext';
import TenantLinkButton from './TenantLinkButton';
import { Container } from 'react-bootstrap';

const AdminRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Persist admin status in localStorage for client-side checks
    if (userInfo && userInfo.isAdmin) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      setIsAdmin(true);
    } else {
      localStorage.removeItem('userInfo');
      setIsAdmin(false);
    }
  }, [userInfo]);
  
  if (!userInfo || !userInfo.isAdmin) {
    return <Navigate to='/login' replace />;
  }

  return (
    <TenantProvider>
      {isAdmin && (
        <Container className="my-3 d-flex justify-content-end">
          <TenantLinkButton />
        </Container>
      )}
      <Outlet />
    </TenantProvider>
  );
};

export default AdminRoute;
