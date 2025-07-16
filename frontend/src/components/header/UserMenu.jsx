import { Nav, NavDropdown } from 'react-bootstrap';
import { FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

const UserMenu = ({ styles, isAuthenticated, handleLogout }) => {
    if (!isAuthenticated) return null;

    return (
        <NavDropdown
            title={
                <div style={styles.userMenu.avatar}>
                    <FaUser />
                </div>
            }
            id="user-dropdown"
            style={styles.userMenu.container}
        >
            <NavDropdown.Item href="/profile" style={styles.userMenu.item}>
                <FaUser className="me-2" />
                Profile
            </NavDropdown.Item>
            <NavDropdown.Item href="/settings" style={styles.userMenu.item}>
                <FaCog className="me-2" />
                Settings
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout} style={styles.userMenu.item}>
                <FaSignOutAlt className="me-2" />
                Logout
            </NavDropdown.Item>
        </NavDropdown>
    );
};

export default UserMenu; 