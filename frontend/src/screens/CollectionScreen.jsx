import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import {
  useGetCollectionDetailsQuery,
  useGetSubCollectionsQuery,
} from '../slices/collectionsApiSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import { AnimatedScreenWrapper } from '../components/animations';
import '../assets/styles/animations.css';
import useCollectionAccess from '../hooks/useCollectionAccess';
import AccessCodeModal from '../components/collection/AccessCodeModal';
import CollectionHeader from '../components/collection/CollectionHeader';
import CollectionHero from '../components/collection/CollectionHero';
import ProductList from '../components/collection/ProductList';
import SubCollectionList from '../components/collection/SubCollectionList';

// Memoize theme colors to prevent recreation on each render
const themeColors = {
  dark: {
    background: '#000000',
    cardBg: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#cbd5e1',
    accentColor: '#4CAF50', // Green color for exercise/fitness tracking theme
    border: 'rgba(51, 65, 85, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.25)',
    modalBackground: 'radial-gradient(circle, #000000 40%, rgba(26, 35, 66, 0.85) 100%)', // Pure black center fading to semi-transparent blue
    modalBody: '#111111',
    sectionBg: 'rgba(30, 41, 59, 0.4)',
  },
  light: {
    background: '#F8F9FC',
    cardBg: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    accentColor: '#4CAF50', // Green color for exercise/fitness tracking theme
    border: 'rgba(226, 232, 240, 0.8)',
    shadow: 'rgba(148, 163, 184, 0.1)',
    modalBackground: 'radial-gradient(circle, #d9ebff 35%, #e6f2ff 100%)', // Fitness tracking style with darker middle (light theme)
    modalBody: '#F8FAFC',
    sectionBg: 'rgba(241, 245, 249, 0.7)',
  },
};

const CollectionScreen = () => {
  const { id: collectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ALWAYS scroll to top immediately when collection changes - no exceptions
  React.useLayoutEffect(() => {
    // Immediate scroll to top - no delays, no conditions
    window.scrollTo(0, 0);
    // Also reset any potential scroll restoration
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, [collectionId]);

  // Robust data fetching with enhanced caching
  const {
    data: collection,
    isLoading,
    error,
    refetch,
  } = useGetCollectionDetailsQuery(collectionId, {
    // Enhanced caching to prevent unnecessary reloads
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    // Keep data for 10 minutes to avoid skeleton reloads
    keepUnusedDataFor: 600,
  });

  const { accessGranted, checkingAccess, showCodeModal, grantAccess } =
    useCollectionAccess(collection, isLoading, error);

  const { data: subcollections, isLoading: isLoadingSubcollections } =
    useGetSubCollectionsQuery(collectionId, {
      skip: !accessGranted,
      // Enhanced caching for subcollections too
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      keepUnusedDataFor: 600,
    });

  // Debounced resize handler
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
        setIsMobile(window.innerWidth < 768);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoize theme observer
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Remove automatic refetch on access granted to prevent unnecessary reloads
  // Only refetch if we explicitly need fresh data
  useEffect(() => {
    if (accessGranted && !collection && !isLoading) {
      refetch();
    }
  }, [accessGranted, collection, isLoading, refetch]);

  const handleBackClick = useCallback(() => {
    if (collection?.parentCollection) {
      navigate(`/collections/${collection.parentCollection._id}`);
    } else {
      navigate('/home', { state: { fromCollection: true } });
    }
  }, [collection?.parentCollection?._id, navigate]);

  const handleSubCollectionClick = useCallback(
    (e, subCollection) => {
      if (subCollection && !subCollection.requiresCode) {
        localStorage.setItem(
          `collection_access_${subCollection._id}`,
          JSON.stringify({
            granted: true,
            timestamp: new Date().toISOString(),
          })
        );
      }
      navigate(`/collections/${subCollection._id}`);
    },
    [navigate]
  );

  const needsAccessCode = useCallback((subCollection) => {
    if (!subCollection || !subCollection.requiresCode) return false;
    const accessData = localStorage.getItem(
      `collection_access_${subCollection._id}`
    );
    if (!accessData) return true;
    try {
      const { granted, timestamp } = JSON.parse(accessData);
      const storedTimestamp = new Date(timestamp).getTime();
      const codeUpdatedTimestamp = subCollection.codeUpdatedAt
        ? new Date(subCollection.codeUpdatedAt).getTime()
        : 0;
      return !(
        granted === true &&
        (!subCollection.codeUpdatedAt ||
          storedTimestamp >= codeUpdatedTimestamp)
      );
    } catch {
      return true;
    }
  }, []);

  const containerStyle = useMemo(
    () => ({
      padding: windowWidth <= 576 ? '0 0 3rem 0' : '0 0 3rem 0', // No horizontal padding
      maxWidth: '100%',
      background: isDarkMode
        ? 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)'
        : 'linear-gradient(180deg, rgba(245,247,250,1) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '24px',
    }),
    [windowWidth, isDarkMode]
  );

  const contentWrapperStyle = useMemo(
    () => ({
      maxWidth: '100%', // Changed from 95% to 100% to remove horizontal gaps
      margin: '0 auto',
      width: '100%',
    }),
    []
  );

  // Memoize modal props
  const modalProps = useMemo(
    () => ({
      show: showCodeModal,
      onHide: () => {},
      collectionId,
      onAccessGranted: grantAccess,
      isDarkMode,
      themeColors,
    }),
    [showCodeModal, collectionId, grantAccess, isDarkMode]
  );

  // Memoize header props to prevent unnecessary re-renders
  const headerProps = useMemo(
    () => ({
      collection: collection || null,
      handleBackClick,
      isDarkMode,
      themeColors,
    }),
    [collection, handleBackClick, isDarkMode, themeColors]
  );

  // Memoize hero props
  const heroProps = useMemo(
    () => ({
      collection: collection || null,
      isDarkMode,
      windowWidth,
    }),
    [collection, isDarkMode, windowWidth]
  );

  const errorMessage = error
    ? error.data?.message || error.error || 'An error occurred'
    : null;

  // Intelligent loading state - only show skeleton if we truly don't have data
  const shouldShowSkeleton = (isLoading || checkingAccess) && !collection;
  const shouldShowContent = collection && accessGranted;

  // Never show skeleton if we have cached data - prevents reload appearance
  if (shouldShowSkeleton) {
    return (
      <Container
        fluid
        className={`${
          isDarkMode ? 'bg-dark text-light min-vh-100' : 'min-vh-100'
        }`}
        style={containerStyle}
      >
        <div style={contentWrapperStyle}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader />
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        fluid
        className={`${
          isDarkMode ? 'bg-dark text-light min-vh-100' : 'min-vh-100'
        }`}
        style={containerStyle}
      >
        <div style={contentWrapperStyle}>
          <Message variant='danger'>
            {error.data?.message || error.error || 'An error occurred'}
          </Message>
        </div>
      </Container>
    );
  }

  if (!collection) {
    return (
      <Container
        fluid
        className={`${
          isDarkMode ? 'bg-dark text-light min-vh-100' : 'min-vh-100'
        }`}
        style={containerStyle}
      >
        <div style={contentWrapperStyle}>
          <Message variant='danger'>Collection not found</Message>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Meta title={collection.name} description={collection.description} />

      <Container
        fluid
        className={`${
          isDarkMode ? 'bg-dark text-light min-vh-100' : 'min-vh-100'
        }`}
        style={containerStyle}
      >
        <div style={contentWrapperStyle}>
          <CollectionHeader {...headerProps} />
          <CollectionHero {...heroProps} />

          {subcollections && subcollections.length > 0 && (
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <SubCollectionList
                subcollections={subcollections}
                isDarkMode={isDarkMode}
                themeColors={themeColors} // Ensure themeColors is passed
                handleSubCollectionClick={handleSubCollectionClick}
                needsAccessCode={needsAccessCode}
                isMobile={isMobile} // Pass isMobile prop
              />
            </div>
          )}

          {collection.products && collection.products.length > 0 && (
            <div style={{ width: '100%', padding: 0 }}> {/* Ensure no margins or padding */}
              <ProductList
                collection={collection}
                isDarkMode={isDarkMode}
                themeColors={themeColors}
              />
            </div>
          )}
        </div>
      </Container>

      <AccessCodeModal {...modalProps} />
    </>
  );
};

export default React.memo(CollectionScreen);
