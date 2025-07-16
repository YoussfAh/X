import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLayerGroup, FaStar } from 'react-icons/fa';
import CollectionCard from '../../components/CollectionCard';

const AssignedCollections = memo(({ userInfo, onCollectionClick }) => {
  // Simple theme detection without observer
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Static window width - simplified
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Simplified collections processing - direct dependency with null safety
  const assignedCollectionsArray = useMemo(() => {
    if (
      !userInfo ||
      !Array.isArray(userInfo?.assignedCollections) ||
      userInfo.assignedCollections.length === 0
    ) {
      return [];
    }

    return userInfo.assignedCollections
      .filter(collection => (
        collection &&
        collection.collectionId &&
        collection.name &&
        collection.status === 'active' // Only show active collections
      ))
      .map((collection) => ({
        _id: collection.collectionId,
        name: collection.name,
        description: collection.description || 'No description available',
        assignedAt: collection.assignedAt || new Date(),
        lastAccessedAt: collection.lastAccessedAt,
        accessCount: collection.accessCount || 0,
        status: collection.status || 'active',
        isPublic: collection.isPublic || false,
        image: collection.image || '/images/sample.jpg',
        displayOrder: collection.displayOrder || Number.MAX_SAFE_INTEGER,
        tags: collection.tags || [],
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [userInfo?.assignedCollections]); // Safe optional chaining

  // Restored complex layout pattern for beautiful varied grid
  const layoutPattern = useMemo(() => {
    if (assignedCollectionsArray.length === 0) return [];

    const layouts = [];
    let currentIndex = 0;

    // Medium screen size patterns (768px-991px)
    if (windowWidth >= 768 && windowWidth < 992) {
      while (currentIndex < assignedCollectionsArray.length) {
        const remainingItems = assignedCollectionsArray.length - currentIndex;

        // Pattern for medium screens: alternate between 1 full-width and 2 half-width
        if (currentIndex === 0 || currentIndex % 3 === 0) {
          // Full-width item
          layouts.push({
            index: currentIndex,
            colSize: 12,
            isStartOfRow: true,
            isEndOfRow: true,
          });
          currentIndex++;
        } else if (remainingItems >= 2) {
          // Two half-width items
          layouts.push({
            index: currentIndex,
            colSize: 6,
            isStartOfRow: true,
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 1,
            colSize: 6,
            isStartOfRow: false,
            isEndOfRow: true,
          });
          currentIndex += 2;
        } else {
          // One remaining item - full width
          layouts.push({
            index: currentIndex,
            colSize: 12,
            isStartOfRow: true,
            isEndOfRow: true,
          });
          currentIndex++;
        }
      }
    }
    // Large screens and above
    else if (windowWidth >= 992) {
      while (currentIndex < assignedCollectionsArray.length) {
        const remainingItems = assignedCollectionsArray.length - currentIndex;

        if (currentIndex === 0) {
          // First row - always one full-width item for featured collection
          layouts.push({
            index: currentIndex,
            colSize: 12,
            isStartOfRow: true,
            isEndOfRow: true,
          });
          currentIndex++;
        } else if (
          remainingItems >= 3 &&
          (currentIndex % 8 === 1 || currentIndex % 7 === 3)
        ) {
          // Three equal columns
          layouts.push({
            index: currentIndex,
            colSize: 4,
            isStartOfRow: true,
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 1,
            colSize: 4,
            isStartOfRow: false,
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 2,
            colSize: 4,
            isStartOfRow: false,
            isEndOfRow: true,
          });
          currentIndex += 3;
        } else if (remainingItems >= 3 && currentIndex % 5 === 1) {
          // One wider with two smaller
          layouts.push({
            index: currentIndex,
            colSize: 6,
            isStartOfRow: true,
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 1,
            colSize: 3,
            isStartOfRow: false,
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 2,
            colSize: 3,
            isStartOfRow: false,
            isEndOfRow: true,
          });
          currentIndex += 3;
        } else if (remainingItems >= 2 && currentIndex % 3 === 0) {
          // Two items, one wider
          layouts.push({
            index: currentIndex,
            colSize: 8,
            isStartOfRow: true,
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 1,
            colSize: 4,
            isStartOfRow: false,
            isEndOfRow: true,
          });
          currentIndex += 2;
        } else if (remainingItems >= 2) {
          // Two equal-width items
          layouts.push({
            index: currentIndex,
            colSize: 6,
            isStartOfRow: true,
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 1,
            colSize: 6,
            isStartOfRow: false,
            isEndOfRow: true,
          });
          currentIndex += 2;
        } else {
          // Single full-width item for the last item if it's alone
          layouts.push({
            index: currentIndex,
            colSize: 12,
            isStartOfRow: true,
            isEndOfRow: true,
          });
          currentIndex++;
        }
      }
    }
    // Small screens - all full width
    else {
      assignedCollectionsArray.forEach((_, index) => {
        layouts.push({
          index,
          colSize: 12,
          isStartOfRow: true,
          isEndOfRow: true,
        });
      });
    }

    return layouts;
  }, [assignedCollectionsArray.length, windowWidth]);

  // Simplified click handler
  const handleCollectionClick = useCallback(
    (collectionId) => {
      if (onCollectionClick) {
        onCollectionClick(collectionId);
      }
    },
    [onCollectionClick]
  );

  // Simple theme detection
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(
        document.documentElement.getAttribute('data-theme') === 'dark'
      );
    };

    // Check theme on mount and set up a simple interval check
    checkTheme();
    const interval = setInterval(checkTheme, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simple resize handler with debounce
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
        setIsMobile(window.innerWidth < 768);
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Early return after all hooks
  if (
    !userInfo?.assignedCollections ||
    Object.keys(userInfo.assignedCollections).length === 0
  ) {
    return null;
  }

  return (
    <div
      style={{
        background: 'transparent',
        padding: '2rem 0',
        minHeight: '40vh',
      }}
    >
      <Container
        className={isMobile ? 'px-2' : 'px-md-4 px-2'}
        style={{
          maxWidth: '100%',
          padding: '0',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: '800',
              marginBottom: '0.5rem',
              color: '#8B5CF6',
              display: 'flex',
              justifyContent: 'center',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {userInfo?.name
              ? `${userInfo.name.split(' ')[0]}'s Collections`
              : 'Your Collections'}
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem',
            }}
          >
            Collections specifically assigned to you for your fitness journey
          </p>
        </div>

        <Row
          className='g-2'
          style={{
            '--bs-gutter-y': window.innerWidth <= 768 ? '1.5rem' : '0.5rem',
            '--bs-gutter-x': window.innerWidth <= 768 ? '0' : '0.5rem',
          }}
        >
          {layoutPattern.map((layout) => {
            const collection = assignedCollectionsArray[layout.index];

            return (
              <Col
                key={collection._id}
                xs={12}
                md={layout.colSize}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                }}
              >
                <div style={{ width: '100%' }}>
                  <Link
                    to={`/collections/${collection._id}`}
                    onClick={() => handleCollectionClick(collection._id)}
                    className='text-decoration-none'
                    style={{ display: 'block', height: '100%' }}
                  >
                    <CollectionCard
                      collection={collection}
                      isDarkMode={isDarkMode}
                      isFullWidth={layout.colSize === 12}
                    />
                  </Link>
                </div>
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>
  );
});

export default AssignedCollections;
