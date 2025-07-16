import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert, Container, Button } from 'react-bootstrap';
import { FaCrown, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SuperAdminRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  // If user is not logged in, redirect to login
  if (!userInfo) {
    return <Navigate to='/login' replace />;
  }
  
  // If user is logged in but not a super admin, show error message
  if (!userInfo.isSuperAdmin) {
    return (
      <Container className="mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <Alert variant="danger" className="text-center shadow-sm">
              <div className="mb-3">
                <FaLock size={64} className="text-danger" />
              </div>
              <h3 className="mb-3">Access Denied</h3>
              <h5 className="mb-4">You are not a Super Admin!</h5>
              <p className="mb-4">
                This area is restricted to Super Administrators only. 
                Super Admin privileges are required to manage tenants and access system-wide settings.
              </p>
              <hr />
              <p className="text-muted mb-3">
                <strong>Current User:</strong> {userInfo.email}
                <br />
                <strong>Admin Status:</strong> {userInfo.isAdmin ? 'Yes' : 'No'}
                <br />
                <strong>Super Admin Status:</strong> No
              </p>
              <hr />
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <Button as={Link} to="/home" variant="primary">
                  Go to Dashboard
                </Button>
                <Button as={Link} to="/profile" variant="outline-secondary">
                  View Profile
                </Button>
              </div>
              <div className="mt-4">
                <small className="text-muted">
                  If you believe you should have Super Admin access, please contact your system administrator.
                </small>
              </div>
            </Alert>
          </div>
        </div>
      </Container>
    );
  }
  
  // User is a super admin, allow access
  return <Outlet />;
};

export default SuperAdminRoute; 
 
 
 
 
 