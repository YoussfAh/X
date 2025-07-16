import { Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaSearch, FaUser, FaShoppingCart, FaHeart, FaSignOutAlt } from 'react-icons/fa';

const MobileMenu = ({ styles, isAuthenticated, user, onLogout }) => {
    return (
        <Navbar.Collapse id="basic-navbar-nav" style={styles.mobile.container}>
            <Nav className="me-auto" style={styles.mobile.nav}>
                <Nav.Link as={Link} to="/" style={styles.mobile.link}>
                    <FaHome /> Home
                </Nav.Link>
                <Nav.Link as={Link} to="/products" style={styles.mobile.link}>
                    <FaSearch /> Units
                </Nav.Link>
                {isAuthenticated ? (
                    <>
                        <Nav.Link as={Link} to="/profile" style={styles.mobile.link}>
                            <FaUser /> Profile
                        </Nav.Link>
                        <Nav.Link as={Link} to="/orders" style={styles.mobile.link}>
                            <FaShoppingCart /> Orders
                        </Nav.Link>
                        <Nav.Link as={Link} to="/wishlist" style={styles.mobile.link}>
                            <FaHeart /> Wishlist
                        </Nav.Link>
                        <Nav.Link onClick={onLogout} style={styles.mobile.link}>
                            <FaSignOutAlt /> Logout
                        </Nav.Link>
                    </>
                ) : (
                    <Nav.Link as={Link} to="/login" style={styles.mobile.link}>
                        <FaUser /> Login
                    </Nav.Link>
                )}
            </Nav>
        </Navbar.Collapse>
    );
};

export default MobileMenu; 