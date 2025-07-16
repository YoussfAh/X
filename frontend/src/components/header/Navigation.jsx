import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaHome,
    FaChartLine,
    FaCalendarAlt,
    FaBookmark,
    FaLayerGroup,
} from 'react-icons/fa';

const Navigation = ({ styles, isAuthenticated }) => {
    return (
        <Nav className="me-auto" style={styles.nav.container}>
            <Nav.Link
                as={Link}
                to="/"
                style={styles.nav.link}
            >
                <FaHome />
                <span>Home</span>
            </Nav.Link>
            <Nav.Link
                as={Link}
                to="/collections"
                style={styles.nav.link}
            >
                <FaLayerGroup />
                <span>Collections</span>
            </Nav.Link>
            <Nav.Link
                as={Link}
                to="/analytics"
                style={styles.nav.link}
            >
                <FaChartLine />
                <span>Analytics</span>
            </Nav.Link>
            <Nav.Link
                as={Link}
                to="/calendar"
                style={styles.nav.link}
            >
                <FaCalendarAlt />
                <span>Calendar</span>
            </Nav.Link>
            <Nav.Link
                as={Link}
                to="/bookmarks"
                style={styles.nav.link}
            >
                <FaBookmark />
                <span>Bookmarks</span>
            </Nav.Link>
            {isAuthenticated && (
                <>
                    <Nav.Link
                        as={Link}
                        to="/orders"
                        style={styles.nav.link}
                    >
                        Orders
                    </Nav.Link>
                    <Nav.Link
                        as={Link}
                        to="/wishlist"
                        style={styles.nav.link}
                    >
                        Wishlist
                    </Nav.Link>
                </>
            )}
        </Nav>
    );
};

export default Navigation; 