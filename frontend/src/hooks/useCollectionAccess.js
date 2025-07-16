import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useUpdateAccessedCollectionsMutation } from '../slices/usersApiSlice';

const useCollectionAccess = (collection, isLoading, error) => {
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const [updateAccessedCollections] = useUpdateAccessedCollectionsMutation();

  useEffect(() => {
    const collectionId = collection?._id;

    // If still loading, maintain checking state
    if (isLoading) {
      setCheckingAccess(true);
      return;
    }

    // If there's an error or no collection, deny access but don't force authentication
    if (error || !collection) {
      setAccessGranted(false);
      setCheckingAccess(false);
      setShowCodeModal(false);
      return;
    }

    // IMPORTANT: Check if user is still authenticated before doing anything
    // This prevents unnecessary logout triggers
    if (!userInfo) {
      setAccessGranted(false);
      setCheckingAccess(false);
      setShowCodeModal(false);
      return;
    }

    // Admin users always have access
    if (userInfo?.isAdmin) {
      setAccessGranted(true);
      setCheckingAccess(false);
      setShowCodeModal(false);
      return;
    }
    
    // Collections assigned to user
    if (collection?.isAssignedToUser) {
      setAccessGranted(true);
      setShowCodeModal(false);
      setCheckingAccess(false);
      return;
    }

    // Collections that don't require codes
    if (!collection?.requiresCode) {
      setAccessGranted(true);
      setShowCodeModal(false);
      setCheckingAccess(false);
      return;
    }

    // Check localStorage for access codes
    const accessData = localStorage.getItem(`collection_access_${collectionId}`);
    if (accessData) {
      try {
        const { granted, timestamp } = JSON.parse(accessData);
        const storedTimestamp = new Date(timestamp).getTime();
        const codeUpdatedTimestamp = collection.codeUpdatedAt
          ? new Date(collection.codeUpdatedAt).getTime()
          : 0;

        if (
          granted === true &&
          (!collection.codeUpdatedAt || storedTimestamp >= codeUpdatedTimestamp)
        ) {
          setAccessGranted(true);
          setShowCodeModal(false);
          setCheckingAccess(false);
          return;
        } else {
          // Code expired, remove from localStorage
          localStorage.removeItem(`collection_access_${collectionId}`);
        }
      } catch (error) {
        // Invalid access data, remove from localStorage
        localStorage.removeItem(`collection_access_${collectionId}`);
      }
    }

    // Need to show access code modal
    setAccessGranted(false);
    setShowCodeModal(true);
    setCheckingAccess(false);
  }, [collection, userInfo, isLoading, error]);

  const grantAccess = async () => {
    const collectionId = collection?._id;
    if (!collectionId) return;
    
    setAccessGranted(true);
    setShowCodeModal(false);

    const accessData = {
      granted: true,
      timestamp: new Date().toISOString(),
      collectionId: collection._id,
      collectionName: collection.name,
      codeVersion: collection.codeUpdatedAt,
    };
    localStorage.setItem(
      `collection_access_${collectionId}`,
      JSON.stringify(accessData)
    );

    // Only update backend if user is authenticated
    // This prevents unnecessary API calls that might trigger auth issues
    if (userInfo && userInfo._id) {
      try {
        await updateAccessedCollections({
          collectionId,
          name: collection.name,
          accessedWithCode: true,
        }).unwrap();
      } catch (error) {
        console.error('Failed to update accessed collections:', error);
        // Don't re-throw or show error - this is just for tracking
      }
    }
  };

  return { accessGranted, checkingAccess, showCodeModal, grantAccess };
};

export default useCollectionAccess; 