// Note: This component was previously called Product but now displays exercise/unit content
// Keeping the component name for backend API compatibility
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import QuickExerciseTracker from './QuickWorkoutTracker';

// Utility function to truncate text with link syntax safely
const truncateDescription = (description, maxLength = 60) => {
    if (!description) return '';

    // Regular expression to match [text](url) pattern
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    // First, check if we need to truncate at all
    if (description.length <= maxLength) {
        return description;
    }

    // If we need to truncate, cut without breaking links if possible
    const linkMatches = [...description.matchAll(linkRegex)];

    // If there are no links or all links appear after our truncation point
    if (linkMatches.length === 0 || linkMatches[0].index >= maxLength) {
        return `${description.substring(0, maxLength)}...`;
    }

    // If a link would be cut in the middle, truncate before the link
    const firstLinkStart = linkMatches[0].index;
    if (firstLinkStart < maxLength) {
        if (firstLinkStart === 0) {
            // If the description starts with a link, include the full link
            const fullLink = linkMatches[0][0];
            if (fullLink.length >= maxLength) {
                return fullLink;
            } else {
                const remainingLength = maxLength - fullLink.length;
                return `${fullLink}${description.substring(fullLink.length, fullLink.length + remainingLength)}...`;
            }
        } else {
            // Truncate before the link
            return `${description.substring(0, firstLinkStart)}...`;
        }
    }

    // Default fallback
    return `${description.substring(0, maxLength)}...`;
};

const Product = ({ product }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    // Get collection ID from URL if in a collection view
    const collectionId = window.location.pathname.includes('/collections/')
        ? window.location.pathname.split('/collections/')[1]?.split('/')[0]
        : null;

    // Track dark mode changes for styling
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Truncate description safely
    const truncatedDescription = truncateDescription(product.description);

    return (
        <Card className='my-3 p-3 rounded unit-card'>
            <Link to={`/product/${product._id}`}>
                <Card.Img
                    src={product.image}
                    variant='top'
                    style={{
                        height: '180px',
                        objectFit: 'contain',
                        transition: 'transform 0.3s ease'
                    }}
                />
            </Link>

            <Card.Body>
                <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                    <Card.Title as='div' className='unit-title'>
                        <strong>{product.name}</strong>
                    </Card.Title>
                </Link>
                <Card.Text as='div' className="text-muted mt-2">
                    {truncatedDescription}
                </Card.Text>

                {/* Show exercise tracker for all units to ensure visibility during testing */}
                <QuickExerciseTracker
                    productId={product._id}
                    collectionId={collectionId || product?.collections?.[0]?._id}
                />
            </Card.Body>
        </Card>
    );
};

export default Product;
