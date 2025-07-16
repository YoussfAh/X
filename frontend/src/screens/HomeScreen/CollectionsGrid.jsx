import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaGlobe, FaKey } from 'react-icons/fa';
import CollectionCard from '../../components/CollectionCard';

const CollectionsGrid = memo(({ collections, onCollectionClick }) => {
  // Simple theme detection without observer
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Static window width - simplified
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Restored complex layout pattern for beautiful varied grid
  const layoutPattern = useMemo(() => {
    if (!collections || collections.length === 0) return [];

    const layouts = [];
    let currentIndex = 0;

    // Medium screen size patterns (768px-991px)
    if (windowWidth >= 768 && windowWidth < 992) {
      while (currentIndex < collections.length) {
        const remainingItems = collections.length - currentIndex;

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
      while (currentIndex < collections.length) {
        const remainingItems = collections.length - currentIndex;

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
        } else if (remainingItems >= 4 && windowWidth >= 1200) {
          // Four equal columns for extra large screens
          layouts.push({
            index: currentIndex,
            colSize: 3,
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
            isEndOfRow: false,
          });
          layouts.push({
            index: currentIndex + 3,
            colSize: 3,
            isStartOfRow: false,
            isEndOfRow: true,
          });
          currentIndex += 4;
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
      collections.forEach((_, index) => {
        layouts.push({
          index,
          colSize: 12,
          isStartOfRow: true,
          isEndOfRow: true,
        });
      });
    }

    return layouts;
  }, [collections?.length, windowWidth]);

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

    checkTheme();
    const interval = setInterval(checkTheme, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simple resize handler
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

  // Early return if no collections
  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: 'transparent',
        minHeight: '40vh',
        position: 'relative',
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
          className='text-center'
          style={{
            padding: '2rem 2rem',
            margin: '0 auto',
            maxWidth: '1200px',
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
            Explore Collections
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
            Discover our curated collections designed to help you achieve your
            goals
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
            const collection = collections[layout.index];

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

export default CollectionsGrid;
