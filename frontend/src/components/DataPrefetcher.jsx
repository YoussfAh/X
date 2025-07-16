import React, { useEffect } from 'react';
import { collectionsApiSlice } from '../slices/collectionsApiSlice';
import { usersApiSlice } from '../slices/usersApiSlice';
import { useDispatch, useSelector } from 'react-redux';
import store from '../store'; // Corrected to use the default export

/**
 * Component to prefetch common data needed across the app
 * This loads data silently in the background to make screens load instantly
 */
const DataPrefetcher = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    // AGGRESSIVE prefetching for phone app-like performance
    // Always prefetch collections data in the background
    dispatch(collectionsApiSlice.endpoints.getCollections.initiate(undefined, {
      // Force prefetch but use cache if available
      forceRefetch: false,
    }));

    // If user is logged in, prefetch user data too
    if (userInfo) {
      dispatch(usersApiSlice.endpoints.refreshUserData.initiate(undefined, {
        forceRefetch: false,
      }));
    }
  }, [dispatch]); // Run only once on mount for maximum cache benefits

  useEffect(() => {
    // Setup a very infrequent refresh for collections (every 10 minutes)
    // This maintains freshness while keeping cache benefits
    const refreshInterval = setInterval(() => {
      const currentState = store.getState();
      const isLoading = currentState?.collectionsApi?.queries?.['getCollections(undefined)']?.status === 'pending';
      
      if (!isLoading) {
        dispatch(collectionsApiSlice.endpoints.getCollections.initiate(undefined, { forceRefetch: true }));
        
        // Also refresh user data if logged in, but less frequently
        if (store.getState().auth.userInfo) {
          dispatch(usersApiSlice.endpoints.refreshUserData.initiate(undefined, { forceRefetch: true }));
        }
      }
    }, 600000); // 10 minutes for phone app-like caching
    
    return () => clearInterval(refreshInterval);
  }, [dispatch]);

  // This component doesn't render anything visible
  return null;
};

export default DataPrefetcher;