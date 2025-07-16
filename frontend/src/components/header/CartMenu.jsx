import { Nav, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';

const CartMenu = ({ styles, cartItemCount = 0 }) => {
    return (
        <Nav.Link as={Link} to="/cart" style={styles.cart.container}>
            <div style={styles.cart.iconWrapper}>
                <FaShoppingCart style={styles.cart.icon} />
                {cartItemCount > 0 && (
                    <Badge pill bg="danger" style={styles.cart.badge}>
                        {cartItemCount}
                    </Badge>
                )}
            </div>
        </Nav.Link>
    );
};

export default CartMenu; 