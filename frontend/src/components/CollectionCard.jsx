import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { FaLock, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CollectionCard = ({ collection, index, hideAssignedBadge = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const [isHovered, setIsHovered] = useState(false);
  const [imageSrc, setImageSrc] = useState(collection?.image || '/images/sample.jpg');
  const navigate = useNavigate();

  // Theme observer
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

  // Determine if the collection is assigned to the user
  const isAssigned = collection?.isAssignedToUser || false;

  // Determine if the collection is private
  const isPrivate = collection?.isPublic === false;

  // Determine if the collection is protected by a code
  const isCodeProtected = collection?.requiresCode || collection?.isCodeProtected || false;

  // Get the collection name and description with null checks
  const name = collection?.name || 'Unnamed Collection';
  const description = collection?.description || 'No description available';

  // Sanitize and truncate description - Only if description exists and is a string
  const truncatedDescription = typeof description === 'string' ?
    (description.length > 60 ? `${description.substring(0, 60)}...` : description)
    : 'No description available';

  // Animation delay based on index
  const animationDelay = index ? `0.${index % 10}s` : '0s';

  // Handle image error
  const handleImageError = () => {
    setImageSrc('/images/sample2.jpg');
  };

  // Check if the user has access to the code-protected collection
  const hasAccessToCollection = () => {
    if (!isCodeProtected) return true;

    // Check localStorage for access data
    const accessData = localStorage.getItem(`collection_access_${collection._id}`);
    if (!accessData) return false;

    try {
      const { granted, timestamp } = JSON.parse(accessData);
      const storedTimestamp = new Date(timestamp).getTime();
      const codeUpdatedTimestamp = collection.codeUpdatedAt
        ? new Date(collection.codeUpdatedAt).getTime()
        : 0;

      return (granted === true &&
        (!collection.codeUpdatedAt || storedTimestamp >= codeUpdatedTimestamp));
    } catch (error) {
      console.error('Error checking collection access:', error);
      return false;
    }
  };

  // Handle card click
  const handleCardClick = (e) => {
    e.preventDefault();

    // If collection is code protected, check access before navigating
    if (isCodeProtected && !isAssigned && !hasAccessToCollection()) {
      // Navigate with state that indicates we need to show code modal
      navigate(`/collections/${collection._id}`, {
        state: { showCodeModal: true }
      });
    } else {
      // No code required or has access, just navigate
      navigate(`/collections/${collection._id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`text-decoration-none fade-in-up`}
      style={{
        animationDelay,
        cursor: 'pointer'
      }}
    >
      <Card
        className={`h-100 collection-card card-hover ${isAssigned ? 'assigned-collection' : ''}`}
        style={{
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'transparent',
          backdropFilter: 'none',
          border: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.05)'
            : '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: isAssigned
            ? isDarkMode
              ? isHovered
                ? '0 8px 25px rgba(255, 215, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1)'
                : '0 5px 20px rgba(255, 215, 0, 0.1)'
              : isHovered
                ? '0 8px 20px rgba(234, 179, 8, 0.15), 0 5px 8px rgba(0, 0, 0, 0.03)'
                : '0 5px 15px rgba(234, 179, 8, 0.08)'
            : isDarkMode
              ? isHovered
                ? '0 8px 25px rgba(0, 0, 0, 0.25), 0 4px 10px rgba(0, 0, 0, 0.15)'
                : '0 5px 20px rgba(0, 0, 0, 0.15)'
              : isHovered
                ? '0 8px 20px rgba(148, 163, 184, 0.15), 0 4px 8px rgba(148, 163, 184, 0.1)'
                : '0 4px 12px rgba(148, 163, 184, 0.08)',
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          minWidth: '200px',
          margin: '0 auto',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collection Image */}
        <div
          style={{
            height: '350px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Card.Img
            variant="top"
            src={imageSrc}
            onError={handleImageError}
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            }}
          />

          {/* Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isAssigned
                ? isDarkMode
                  ? 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7))'
                  : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.5))'
                : isDarkMode
                  ? 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.7))'
                  : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.5))',
              zIndex: 1,
              transition: 'opacity 0.3s ease',
              opacity: isHovered ? 0.9 : 1,
            }}
          />

          {/* Collection Name Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px',
              zIndex: 2,
              color: '#fff', // Always white
              textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.6)', // Stronger shadow in light mode
              transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
              transition: 'transform 0.3s ease',
            }}
          >
            <h3
              style={{
                fontSize: '1.8rem',
                fontWeight: '600',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff', // Pure white for title
              }}
            >
              {name}
            </h3>
            <p
              style={{
                fontSize: '1rem',
                opacity: isDarkMode ? 0.9 : 0.95, // Slightly higher opacity in light mode
                marginBottom: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'left',
                color: '#f8fafc', // Slight off-white for description
                transition: 'opacity 0.3s ease',
                opacity: isHovered ? 1 : 0.9,
              }}
            >
              {truncatedDescription}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 5
          }}
        >
          {/* Code Protection Badge - Styled like Assigned badge */}
          {isCodeProtected && (
            <div style={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)',
              color: isDarkMode ? '#fff' : '#1E293B',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(4px)',
              border: isDarkMode ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
              transform: isHovered ? 'translateY(0)' : 'translateY(0)',
              opacity: isHovered ? 1 : 0.95,
              transition: 'all 0.3s ease'
            }}>
              <FaLock style={{ color: isDarkMode ? '#fbbf24' : '#92400e' }} />
              <span>Protected</span>
            </div>
          )}

          {isAssigned && !hideAssignedBadge && (
            <div style={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)',
              color: isDarkMode ? '#fff' : '#1E293B',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isDarkMode
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(4px)',
              border: isDarkMode ? 'none' : '1px solid rgba(226, 232, 240, 0.8)'
            }}>
              <FaStar style={{ color: '#ffd700' }} />
              <span>Assigned</span>
            </div>
          )}
        </div>

        {/* Hover Effect with Pulsing Glow */}
        <div
          className="collection-card-hover"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isAssigned
              ? 'radial-gradient(circle at center, rgba(255, 215, 0, 0.15), transparent 70%)'
              : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.08), transparent 70%)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 2,
            pointerEvents: 'none',
            animation: isHovered ? 'pulseGlow 2s infinite' : 'none',
          }}
        />

        {/* Additional CSS for animation */}
        <style jsx="true">{`
          @keyframes pulseGlow {
            0% {
              opacity: 0.2;
            }
            50% {
              opacity: 0.4;
            }
            100% {
              opacity: 0.2;
            }
          }

          .assigned-collection {
            position: relative;
          }
          
          .assigned-collection::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, 
              rgba(255, 215, 0, 0.2), 
              rgba(255, 215, 0, 0), 
              rgba(255, 215, 0, 0.2), 
              rgba(255, 215, 0, 0));
            border-radius: 26px;
            z-index: -1;
            animation: borderGlow 3s linear infinite;
            opacity: ${isHovered ? 1 : 0.5};
            transition: opacity 0.3s ease;
          }
          
          @keyframes borderGlow {
            0% {
              background-position: 0% 0%;
            }
            100% {
              background-position: 300% 0%;
            }
          }
        `}</style>
      </Card>
    </div>
  );
};

export default CollectionCard;
