import React, { useState, useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Table,
  Button,
  Row,
  Col,
  Form,
  Modal,
  Badge,
  Tabs,
  Tab,
  Card,
  InputGroup,
} from 'react-bootstrap';
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaEye,
  FaChevronRight,
  FaLock,
  FaArrowUp,
  FaArrowDown,
  FaImage,
  FaSearch,
  FaFilter,
  FaLayerGroup,
  FaBoxOpen,
  FaListUl,
  FaShieldAlt,
  FaUnlock,
  FaGlobe,
  FaUserShield,
  FaSort,
  FaCopy,
} from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import CollectionPaginate from '../../components/CollectionPaginate';
import CollectionImageUploader from '../../components/CollectionImageUploader';
import {
  useGetAdminCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useGetAdminSubCollectionsQuery,
  useMoveCollectionUpMutation,
  useMoveCollectionDownMutation,
  useUpdateCollectionOrderMutation,
  useDuplicateCollectionMutation,
} from '../../slices/collectionsApiSlice';
import '../../assets/styles/admin.css';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';

// Import animation components
import AnimatedScreenWrapper from '../../components/animations/AnimatedScreenWrapper';
import FadeIn from '../../components/animations/FadeIn';
import StaggeredList from '../../components/animations/StaggeredList';

const CollectionListScreen = () => {
  const { pageNumber = 1 } = useParams();

  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // For collection filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublic, setFilterPublic] = useState('all');

  // Debounce search to prevent API calls on every keystroke
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Detect theme changes
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

  // Add effect to set page as loaded after initial render
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetAdminCollectionsQuery({
    pageNumber: Number(pageNumber),
    keyword: debouncedSearchTerm,
    visibility: filterPublic,
  });

  // Get rootCollections from the page data
  const rootCollections = data?.collections;

  // Debug: Log the data to see what we're receiving
  useEffect(() => {
    if (rootCollections && rootCollections.length > 0) {
      console.log('Root collections data:', rootCollections);
      rootCollections.forEach(collection => {
        console.log(`Collection "${collection.name}":`, {
          hasSubCollections: !!collection.subCollections,
          isArray: Array.isArray(collection.subCollections),
          length: collection.subCollections?.length || 0,
          subCollections: collection.subCollections
        });
      });
    }
  }, [rootCollections]);

  const [createCollection, { isLoading: isCreating }] =
    useCreateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] =
    useDeleteCollectionMutation();
  const [moveCollectionUp, { isLoading: isMovingUp }] =
    useMoveCollectionUpMutation();
  const [moveCollectionDown, { isLoading: isMovingDown }] =
    useMoveCollectionDownMutation();
  const [updateCollectionOrder, { isLoading: isUpdatingOrder }] =
    useUpdateCollectionOrderMutation();
  const [duplicateCollection, { isLoading: isDuplicating }] =
    useDuplicateCollectionMutation();

  // For create collection modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [parentCollectionId, setParentCollectionId] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionAdminDescription, setCollectionAdminDescription] = useState('');
  const [collectionImage, setCollectionImage] = useState('/images/sample.jpg');
  const [collectionIsPublic, setCollectionIsPublic] = useState(true);
  const [orderNumber, setOrderNumber] = useState('');
  const [requiresCode, setRequiresCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  
  // For order editing
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderValue, setEditingOrderValue] = useState('');

  // Handle modal open/close
  const handleModalOpen = () => {
    // If in subcollection view, set the parent collection ID automatically
    if (activeTab === 'sub' && selectedRootCollection) {
      setParentCollectionId(selectedRootCollection);
    }
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setParentCollectionId('');
    resetFormFields();
  };

  // Cleanup function to ensure scroll is always restored
  useEffect(() => {
    const cleanup = () => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
    };
    return cleanup;
  }, []);

  // For viewing collections
  const [selectedRootCollection, setSelectedRootCollection] = useState(null);
  const [activeTab, setActiveTab] = useState('root');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect screen size with more breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);

      // Add CSS custom properties for responsive design
      document.documentElement.style.setProperty('--screen-width', `${width}px`);
      document.documentElement.style.setProperty('--is-mobile', width <= 768 ? '1' : '0');
      document.documentElement.style.setProperty('--is-tablet', width > 768 && width <= 1024 ? '1' : '0');
      document.documentElement.style.setProperty('--is-desktop', width > 1024 ? '1' : '0');
    };

    handleResize(); // Set initial values
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch subcollections if a root collection is selected
  const { data: subCollections, isLoading: isLoadingSubCollections } =
    useGetAdminSubCollectionsQuery(selectedRootCollection, {
      skip: !selectedRootCollection,
    });

  // Debug: Log subcollections data to understand the structure
  useEffect(() => {
    if (subCollections && subCollections.length > 0) {
      console.log('Sub-collections data:', subCollections);
      subCollections.forEach(collection => {
        console.log(`Sub-collection "${collection.name}":`, {
          hasProducts: !!collection.products,
          isProductsArray: Array.isArray(collection.products),
          productsLength: collection.products?.length || 0,
          products: collection.products,
          hasWorkouts: !!collection.workouts,
          isWorkoutsArray: Array.isArray(collection.workouts),
          workoutsLength: collection.workouts?.length || 0,
          workouts: collection.workouts,
          allFields: Object.keys(collection)
        });
      });
    }
  }, [subCollections]);

  // Helper function to get correct product count for collections
  const getProductCount = (collection) => {
    // Check for products field first
    if (Array.isArray(collection.products)) {
      return collection.products.length;
    }

    // Check for workouts field as alternative
    if (Array.isArray(collection.workouts)) {
      return collection.workouts.length;
    }

    // Check for items field as another alternative
    if (Array.isArray(collection.items)) {
      return collection.items.length;
    }

    // If products exists but is not an array, log it for debugging
    if (collection.products !== undefined && collection.products !== null) {
      console.log('Products field exists but is not an array:', collection.products);
    }

    return 0;
  };

  // Reset selected collection when tab changes
  useEffect(() => {
    if (activeTab === 'root') {
      setSelectedRootCollection(null);
    }
  }, [activeTab]);

  // Reset form fields when modal is closed
  useEffect(() => {
    if (!showCreateModal) {
      resetFormFields();
    }
  }, [showCreateModal]);

  const resetFormFields = () => {
    setCollectionName('');
    setCollectionDescription('');
    setCollectionAdminDescription('');
    setCollectionImage('/images/sample.jpg');
    setCollectionIsPublic(true);
    setOrderNumber('');
    setRequiresCode(false);
    setAccessCode('');
  };

  const handleImageUploaded = (imageUrl) => {
    setCollectionImage(imageUrl);
    showSuccessToast('Image uploaded successfully');
  };

  const filteredRootCollections = rootCollections || [];

  const createCollectionHandler = async () => {
    try {
      const result = await createCollection({
        parentCollectionId: parentCollectionId || null,
        name: collectionName,
        description: collectionDescription,
        adminDescription: collectionAdminDescription,
        image: collectionImage,
        isPublic: collectionIsPublic,
        requiresCode,
        accessCode: requiresCode ? accessCode : '',
        orderNumber: orderNumber || null,
      }).unwrap();
      
      // Orders are automatically handled by the backend
      refetch();
      showSuccessToast('Collection created successfully');
      handleModalClose();
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  const deleteCollectionHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await deleteCollection(id).unwrap();
        refetch();
        showSuccessToast('Collection deleted successfully');
        // If deleted collection was the selected one, reset selection
        if (id === selectedRootCollection) {
          setSelectedRootCollection(null);
          setActiveTab('root');
        }
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  const selectRootCollection = (id) => {
    setSelectedRootCollection(id);
    setActiveTab('sub');
  };

  // Collection ordering handlers with instant feedback
  const moveUpHandler = async (id) => {
    try {
      const result = await moveCollectionUp(id).unwrap();
      refetch();
      showSuccessToast(result.message || 'Collection moved up');
      
      // Show order number update if provided
      if (result.newOrderNumber) {
        showSuccessToast(`Order updated to: ${result.newOrderNumber}`);
      }
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  const moveDownHandler = async (id) => {
    try {
      const result = await moveCollectionDown(id).unwrap();
      refetch();
      showSuccessToast(result.message || 'Collection moved down');
      
      // Show order number update if provided
      if (result.newOrderNumber) {
        showSuccessToast(`Order updated to: ${result.newOrderNumber}`);
      }
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Order editing handlers
  const startEditingOrder = (collection) => {
    setEditingOrderId(collection._id);
    setEditingOrderValue(collection.orderNumber || '');
  };

  const cancelEditingOrder = () => {
    setEditingOrderId(null);
    setEditingOrderValue('');
  };

  const saveOrderNumber = async (collectionId) => {
    try {
      await updateCollectionOrder({
        collectionId,
        orderNumber: editingOrderValue,
      }).unwrap();
      
      // Auto-fix orders after manual update to ensure proper sequencing
      showSuccessToast('Order number updated successfully');
      setEditingOrderId(null);
      setEditingOrderValue('');
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
      cancelEditingOrder();
    }
  };

  const handleKeyPress = (e, collectionId) => {
    if (e.key === 'Enter') {
      saveOrderNumber(collectionId);
    } else if (e.key === 'Escape') {
      cancelEditingOrder();
    }
  };

  const duplicateCollectionHandler = async (id) => {
    try {
      const result = await duplicateCollection(id).unwrap();
      showSuccessToast('Collection duplicated successfully');
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to duplicate collection');
    }
  };

  // Render collection as card (for mobile)
  const renderCollectionCard = (collection, isSubCollection = false) => (
    <div
      className='admin-mobile-card'
      key={collection._id}
      style={{
        background: isDarkMode
          ? 'linear-gradient(145deg, #1e1e1e 0%, #2a2a2a 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: isDarkMode
          ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        border: `1px solid ${isDarkMode ? '#333' : '#e2e8f0'}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '120px',
          background: `linear-gradient(135deg, ${colors.accent}08, transparent)`,
          borderRadius: '50%',
          transform: 'translate(30%, -30%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            overflow: 'hidden',
            marginRight: '16px',
            flexShrink: 0,
            border: `2px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <img
            src={collection.image || '/images/sample.jpg'}
            alt={collection.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: '700',
              color: colors.text,
              marginBottom: '6px',
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
            }}
          >
            {collection.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: colors.secondaryText,
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              opacity: 0.8,
            }}
          >
            {collection.description || 'No description available'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: !isSubCollection ? '1fr 1fr' : '1fr',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Products Count */}
        <div
          style={{
            background: isDarkMode ? '#065f4620' : '#ecfdf515',
            border: `1px solid ${isDarkMode ? '#10b981' : '#6ee7b7'}`,
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: colors.secondaryText,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <FaBoxOpen size={12} />
            Products
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: isDarkMode ? '#10b981' : '#059669',
              lineHeight: 1,
            }}
          >
            {getProductCount(collection)}
          </div>
        </div>

        {/* Sub-collections Count */}
        {!isSubCollection && (
          <div
            style={{
              background: isDarkMode ? '#1e40af20' : '#dbeafe15',
              border: `1px solid ${isDarkMode ? '#3b82f6' : '#93c5fd'}`,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: colors.secondaryText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <FaLayerGroup size={12} />
              Sub-Collections
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: isDarkMode ? '#3b82f6' : '#2563eb',
                lineHeight: 1,
              }}
            >
              {Array.isArray(collection.subCollections) ? collection.subCollections.length : 0}
            </div>
          </div>
        )}
      </div>

      {/* Status Badges */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
          alignItems: 'center',
        }}
      >
        {/* Visibility Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600',
            background: collection.isPublic !== false
              ? isDarkMode ? '#059669' : '#10b981'
              : isDarkMode ? '#dc2626' : '#ef4444',
            color: 'white',
            border: 'none',
          }}
        >
          {collection.isPublic !== false ? (
            <>
              <FaGlobe size={10} /> Public
            </>
          ) : (
            <>
              <FaUserShield size={10} /> Private
            </>
          )}
        </div>

        {/* Access Code Badge */}
        {collection.requiresCode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              background: isDarkMode ? '#d97706' : '#f59e0b',
              color: 'white',
            }}
          >
            <FaLock size={10} /> Protected
          </div>
        )}

        {/* Order Number with Edit Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600',
            background: isDarkMode ? '#374151' : '#f3f4f6',
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Button
              size="sm"
              variant="link"
              onClick={() => moveUpHandler(collection._id)}
              disabled={isMovingUp || isMovingDown}
              style={{
                padding: '0',
                width: '14px',
                height: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.accent,
                lineHeight: 1,
              }}
            >
              <FaArrowUp size={6} />
            </Button>
            <Button
              size="sm"
              variant="link"
              onClick={() => moveDownHandler(collection._id)}
              disabled={isMovingUp || isMovingDown}
              style={{
                padding: '0',
                width: '14px',
                height: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.accent,
                lineHeight: 1,
              }}
            >
              <FaArrowDown size={6} />
            </Button>
          </div>
          
          {editingOrderId === collection._id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaListUl size={10} /> #
              <Form.Control
                type="text"
                value={editingOrderValue}
                onChange={(e) => setEditingOrderValue(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, collection._id)}
                onBlur={() => saveOrderNumber(collection._id)}
                autoFocus
                style={{
                  width: '40px',
                  height: '20px',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  padding: '2px 4px',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: '4px',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => startEditingOrder(collection)}
              onMouseOver={(e) => {
                e.currentTarget.style.color = colors.accent;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = colors.text;
              }}
            >
              <FaListUl size={10} /> #{collection.orderNumber || 'N/A'}
            </div>
          )}
        </div>
      </div>

      {/* Add sub-collections section for root collections */}
      {!isSubCollection && (
        <div
          className='card-row'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '10px',
            backgroundColor: isDarkMode ? 'rgba(66, 153, 225, 0.1)' : 'rgba(66, 153, 225, 0.05)',
            borderRadius: '8px',
            border: `1px solid ${isDarkMode ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.1)'}`,
          }}
        >
          <div
            className='card-label'
            style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: colors.secondaryText,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaLayerGroup className='me-2' style={{ color: colors.infoBlue }} /> SUB-COLLECTIONS
          </div>
          <div className='card-value'>
            <Badge
              bg={
                Array.isArray(collection.subCollections) &&
                  collection.subCollections.length > 0
                  ? 'info'
                  : 'secondary'
              }
              pill
              style={{
                padding: '6px 10px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor:
                  Array.isArray(collection.subCollections) &&
                    collection.subCollections.length > 0
                    ? colors.infoBlue
                    : isDarkMode
                      ? '#4a5568'
                      : '#cbd5e0',
              }}
            >
              {Array.isArray(collection.subCollections)
                ? collection.subCollections.length
                : 0}
            </Badge>
          </div>
        </div>
      )}

      <div
        className='card-row'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '8px 0',
        }}
      >
        <div
          className='card-label'
          style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            color: colors.secondaryText,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FaBoxOpen className='me-2' style={{ color: colors.successGreen }} /> PRODUCTS
        </div>
        <div className='card-value'>
          <Badge
            bg={
              getProductCount(collection) > 0
                ? 'success'
                : 'secondary'
            }
            pill
            style={{
              padding: '6px 10px',
              fontSize: '0.85rem',
              fontWeight: '600',
              backgroundColor:
                getProductCount(collection) > 0
                  ? colors.successGreen
                  : isDarkMode
                    ? '#4a5568'
                    : '#cbd5e0',
            }}
          >
            {getProductCount(collection)}
          </Badge>
        </div>
      </div>

      <div
        className='card-row'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '8px 0',
          backgroundColor: colors.hoverBg,
          borderRadius: '8px',
          padding: '10px',
        }}
      >
        <div
          className='card-label'
          style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            color: colors.secondaryText,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FaShieldAlt className='me-2' style={{ color: colors.warningYellow }} /> ACCESS
        </div>
        <div className='card-value'>
          {collection.requiresCode ? (
            <Badge
              bg='warning'
              text='dark'
              pill
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: colors.warningYellow,
                color: '#744210',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <FaLock /> Code Required
            </Badge>
          ) : (
            <Badge
              bg='info'
              pill
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: colors.infoBlue,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <FaUnlock /> Open
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Primary Action */}
        {!isSubCollection && (
          <Button
            variant="primary"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontWeight: '600',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              minHeight: '48px',
            }}
            onClick={() => selectRootCollection(collection._id)}
          >
            <FaChevronRight size={12} /> View Sub-Collections
          </Button>
        )}

        {/* Secondary Actions Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <LinkContainer to={`/admin/collection/${collection._id}/edit`}>
            <Button
              variant="outline-primary"
              style={{
                border: `2px solid ${isDarkMode ? '#3b82f6' : '#3b82f6'}`,
                background: 'transparent',
                color: isDarkMode ? '#60a5fa' : '#3b82f6',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: '600',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                minHeight: '44px',
              }}
            >
              <FaEdit size={12} /> Edit
            </Button>
          </LinkContainer>

          <Button
            variant="info"
            style={{
              background: isDarkMode ? '#1e40af' : '#3b82f6',
              border: 'none',
              borderRadius: '12px',
              padding: '10px',
              minWidth: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
            }}
            onClick={() => duplicateCollectionHandler(collection._id)}
            title="Duplicate Collection"
          >
            <FaCopy size={14} />
          </Button>

          <Button
            variant="danger"
            style={{
              background: isDarkMode ? '#dc2626' : '#ef4444',
              border: 'none',
              borderRadius: '12px',
              padding: '10px',
              minWidth: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
            }}
            onClick={() => deleteCollectionHandler(collection._id)}
          >
            <FaTrash size={14} />
          </Button>
        </div>
      </div>
    </div>
  );

  // Enhanced theme-aware colors with better contrast and modern palette
  const colors = {
    // Backgrounds
    background: isDarkMode ? '#0f0f0f' : '#f8fafc',
    cardBg: isDarkMode ? '#1a1a1a' : '#ffffff',
    headerBg: isDarkMode ? '#1f1f1f' : '#f1f5f9',
    inputBg: isDarkMode ? '#1f1f1f' : '#ffffff',

    // Text colors
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    secondaryText: isDarkMode ? '#cbd5e1' : '#475569',
    mutedText: isDarkMode ? '#94a3b8' : '#64748b',

    // Border and dividers
    border: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    divider: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',

    // Interactive states
    hoverBg: isDarkMode ? 'rgba(124, 77, 255, 0.12)' : 'rgba(124, 77, 255, 0.06)',
    focusBg: isDarkMode ? 'rgba(124, 77, 255, 0.16)' : 'rgba(124, 77, 255, 0.08)',

    // Shadows
    shadow: isDarkMode
      ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)'
      : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
    shadowHover: isDarkMode
      ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 8px rgba(0, 0, 0, 0.4)'
      : '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
    shadowFocus: isDarkMode
      ? '0 0 0 3px rgba(124, 77, 255, 0.4)'
      : '0 0 0 3px rgba(124, 77, 255, 0.2)',

    // Brand colors
    accent: '#7c4dff',
    accentDark: '#6e44b2',
    accentLight: '#9575ff',

    // Status colors
    successGreen: '#10b981',
    successLight: '#34d399',
    warningYellow: '#f59e0b',
    warningLight: '#fbbf24',
    dangerRed: '#ef4444',
    dangerLight: '#f87171',
    infoBlue: '#3b82f6',
    infoLight: '#60a5fa',

    // Gradients
    gradient: isDarkMode
      ? 'linear-gradient(135deg, #7c4dff 0%, #6e44b2 100%)'
      : 'linear-gradient(135deg, #7c4dff 0%, #9575ff 100%)',
    cardGradient: isDarkMode
      ? 'linear-gradient(145deg, #1a1a1a 0%, #1f1f1f 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    successLight: isDarkMode ? '#4ade80' : '#d1fae5',
    dangerLight: isDarkMode ? '#fda4af' : '#fef2f2',
  };

  return (
    <AnimatedScreenWrapper>
      <div className='admin-screen'>
        {(isLoading || !isPageLoaded) && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader />
          </div>
        )}
        <div
          className='admin-container'
          style={{
            backgroundColor: colors.background,
            padding: isMobile ? '12px' : '24px 32px',
            minHeight: 'calc(100vh - 72px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxWidth: '100%',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              maxWidth: '1600px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div
              className='admin-header'
              style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                marginBottom: isMobile ? '20px' : '32px',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '12px' : '16px',
                padding: isMobile ? '12px' : '24px',
                background: colors.cardGradient,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadow,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background decoration */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '200px',
                  height: '100%',
                  background: `linear-gradient(135deg, ${colors.accent}15, transparent)`,
                  borderRadius: '50%',
                  transform: 'translateX(50%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1
                  style={{
                    fontSize: isMobile ? '1.5rem' : '2.5rem',
                    fontWeight: '800',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '8px' : '12px',
                    margin: 0,
                    marginBottom: isMobile ? '4px' : '4px',
                    letterSpacing: '-0.025em',
                  }}
                >
                  <div
                    style={{
                      padding: isMobile ? '6px' : '8px',
                      borderRadius: '12px',
                      background: colors.gradient,
                      color: 'white',
                      boxShadow: colors.shadow,
                    }}
                  >
                    <FaListUl size={isMobile ? 16 : 24} />
                  </div>
                  {isMobile ? 'Collections' : 'Collection Management'}
                </h1>
                {!isMobile && (
                  <p
                    style={{
                      color: colors.secondaryText,
                      fontSize: '1rem',
                      margin: 0,
                      fontWeight: '500',
                    }}
                  >
                    Manage your collections, products, and organization
                  </p>
                )}
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                <Button
                  className='admin-btn'
                  onClick={handleModalOpen}
                  style={{
                    padding: isMobile ? '12px 20px' : '14px 24px',
                    background: colors.gradient,
                    borderColor: 'transparent',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    boxShadow: colors.shadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = colors.shadowHover;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = colors.shadow;
                  }}
                >
                  <FaPlus size={14} /> Create Collection
                </Button>
              </div>
            </div>

            {/* Filters section */}
            <Card
              className='admin-filters mb-4'
              style={{
                background: colors.cardGradient,
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px',
                marginBottom: isMobile ? '20px' : '32px',
                boxShadow: colors.shadow,
                border: `1px solid ${colors.border}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Row className='g-3 align-items-center'>
                <Col md={7} lg={8}>
                  <div style={{ position: 'relative' }}>
                    <InputGroup
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: colors.shadow,
                      }}
                    >
                      <InputGroup.Text
                        style={{
                          backgroundColor: colors.inputBg,
                          border: `1px solid ${colors.border}`,
                          borderRight: 'none',
                          borderRadius: '12px 0 0 12px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FaSearch
                          color={colors.secondaryText}
                          size={16}
                          style={{
                            transition: 'color 0.2s ease',
                          }}
                        />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder='Search collections by name or description...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderLeft: 'none',
                          borderRadius: '0 12px 12px 0',
                          padding: '14px 16px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          '::placeholder': {
                            color: colors.mutedText,
                          }
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = colors.shadowFocus;
                          e.currentTarget.parentElement.style.transform = 'translateY(-1px)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.parentElement.style.transform = 'translateY(0)';
                        }}
                      />
                    </InputGroup>
                  </div>
                </Col>
                <Col md={5} lg={4}>
                  <InputGroup
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: colors.shadow,
                    }}
                  >
                    <InputGroup.Text
                      style={{
                        backgroundColor: colors.inputBg,
                        border: `1px solid ${colors.border}`,
                        borderRight: 'none',
                        borderRadius: '12px 0 0 12px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FaFilter
                        color={colors.secondaryText}
                        size={16}
                      />
                    </InputGroup.Text>
                    <Form.Select
                      value={filterPublic}
                      onChange={(e) => setFilterPublic(e.target.value)}
                      style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderLeft: 'none',
                        borderRadius: '0 12px 12px 0',
                        padding: '14px 16px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = colors.shadowFocus;
                        e.currentTarget.parentElement.style.transform = 'translateY(-1px)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.parentElement.style.transform = 'translateY(0)';
                      }}
                    >
                      <option value='all'>All Visibility</option>
                      <option value='public'>Public Only</option>
                      <option value='private'>Admin Only</option>
                    </Form.Select>
                  </InputGroup>
                </Col>
              </Row>
            </Card>

            {(isCreating || isDeleting) && <Loader />}

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className='mb-4'
              style={{
                borderBottom: `1px solid ${colors.border}`,
                fontSize: '1.1rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Tab
                eventKey='root'
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 5px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '600',
                    }}
                  >
                    <FaLayerGroup /> Root Collections
                  </div>
                }
              >
                {isLoading ? (
                  <Loader />
                ) : error ? (
                  <Message variant='danger'>{error}</Message>
                ) : filteredRootCollections.length > 0 ? (
                  <>
                    {/* Desktop view */}
                    {!isMobile ? (
                      <div
                        className='admin-table-responsive'
                        style={{
                          background: colors.cardGradient,
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: colors.shadow,
                          border: `1px solid ${colors.border}`,
                          width: '100%',
                          overflow: 'auto',
                          boxShadow: colors.shadow,
                          border: `1px solid ${colors.border}`,
                          width: '100%',
                          maxWidth: '100%',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <Table
                          bordered
                          hover
                          responsive
                          className='admin-table mb-0'
                          style={{
                            margin: 0,
                            width: '100%',
                            fontSize: '0.9rem',
                            borderCollapse: 'separate',
                            borderSpacing: '0',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <thead
                            style={{
                              background: `linear-gradient(135deg, ${colors.headerBg} 0%, ${colors.cardBg} 100%)`,
                              position: 'sticky',
                              top: 0,
                              zIndex: 10,
                            }}
                          >
                            <tr>
                              <th
                                style={{
                                  width: '7%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  borderRight: `1px solid ${colors.divider}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                  textAlign: 'center',
                                }}
                                title="Click order number to edit, use arrows to reorder"
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <span>ORDER</span>
                                  <small style={{ fontSize: '0.6rem', opacity: 0.7, textTransform: 'none', fontWeight: '400' }}>
                                    Click to edit
                                  </small>
                                </div>
                              </th>
                              <th
                                style={{
                                  width: '20%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  borderRight: `1px solid ${colors.divider}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                }}
                              >
                                NAME
                              </th>
                              <th
                                style={{
                                  width: '25%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  borderRight: `1px solid ${colors.divider}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                }}
                              >
                                DESCRIPTION
                              </th>
                              <th
                                style={{
                                  width: '7%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  borderRight: `1px solid ${colors.divider}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                  textAlign: 'center',
                                }}
                              >
                                UNITS
                              </th>
                              <th
                                style={{
                                  width: '7%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  borderRight: `1px solid ${colors.divider}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                  textAlign: 'center',
                                }}
                              >
                                SUB-COLLECTIONS
                              </th>
                              <th
                                style={{
                                  width: '7%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  borderRight: `1px solid ${colors.divider}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                  textAlign: 'center',
                                }}
                              >
                                VISIBILITY
                              </th>
                              <th
                                style={{
                                  width: '7%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  borderRight: `1px solid ${colors.divider}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                  textAlign: 'center',
                                }}
                              >
                                ACCESS
                              </th>
                              <th
                                style={{
                                  width: '20%',
                                  padding: '20px 12px',
                                  color: colors.text,
                                  fontWeight: '700',
                                  borderBottom: `2px solid ${colors.border}`,
                                  fontSize: '0.8rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  background: 'transparent',
                                  textAlign: 'center',
                                }}
                              >
                                ACTIONS
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRootCollections.map((collection, index) => (
                              <tr
                                key={collection._id}
                                style={{
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  background: index % 2 === 0 ? 'transparent' : `${colors.border}20`,
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = colors.shadow;
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : `${colors.border}20`;
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <td
                                  className='align-middle text-center'
                                  style={{
                                    padding: '12px 8px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                    {editingOrderId === collection._id ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <Form.Control
                                          type="text"
                                          value={editingOrderValue}
                                          onChange={(e) => setEditingOrderValue(e.target.value)}
                                          onKeyDown={(e) => handleKeyPress(e, collection._id)}
                                          onBlur={() => saveOrderNumber(collection._id)}
                                          autoFocus
                                          style={{
                                            width: '50px',
                                            height: '24px',
                                            fontSize: '0.7rem',
                                            textAlign: 'center',
                                            padding: '2px 4px',
                                            backgroundColor: colors.inputBg,
                                            color: colors.text,
                                            border: `1px solid ${colors.accent}`,
                                            borderRadius: '4px',
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                          <Button
                                            size="sm"
                                            variant="link"
                                            onClick={() => moveUpHandler(collection._id)}
                                            disabled={isMovingUp || isMovingDown}
                                            style={{
                                              padding: '0',
                                              width: '16px',
                                              height: '12px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: colors.accent,
                                              lineHeight: 1,
                                            }}
                                          >
                                            <FaArrowUp size={8} />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="link"
                                            onClick={() => moveDownHandler(collection._id)}
                                            disabled={isMovingUp || isMovingDown}
                                            style={{
                                              padding: '0',
                                              width: '16px',
                                              height: '12px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: colors.accent,
                                              lineHeight: 1,
                                            }}
                                          >
                                            <FaArrowDown size={8} />
                                          </Button>
                                        </div>
                                        <Badge
                                          bg='info'
                                          style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 8px',
                                            fontWeight: '600',
                                            backgroundColor: collection.orderNumber ? colors.infoBlue : isDarkMode ? '#4a5568' : '#cbd5e0',
                                            minWidth: '40px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                          }}
                                          onClick={() => startEditingOrder(collection)}
                                          onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.accent;
                                          }}
                                          onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = collection.orderNumber ? colors.infoBlue : isDarkMode ? '#4a5568' : '#cbd5e0';
                                          }}
                                        >
                                          {collection.orderNumber || 'N/A'}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td
                                  className='align-middle'
                                  style={{
                                    padding: '12px 8px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                  }}
                                >
                                  <div className='d-flex align-items-center'>
                                    <div
                                      className='me-2'
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        boxShadow: `0 2px 4px ${colors.border}`,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <img
                                        src={
                                          collection.image || '/images/sample.jpg'
                                        }
                                        alt={collection.name}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                        }}
                                      />
                                    </div>
                                    <div style={{
                                      color: colors.text,
                                      fontWeight: '600',
                                      fontSize: '0.9rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {collection.name}
                                    </div>
                                  </div>
                                </td>
                                <td
                                  className='align-middle'
                                  style={{
                                    padding: '12px 8px',
                                    color: colors.secondaryText,
                                    borderBottom: `1px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  <div style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.4',
                                  }}>
                                    {/* Public Description */}
                                    <div style={{ marginBottom: '4px' }}>
                                      {collection.description &&
                                        collection.description.length > 60
                                        ? `${collection.description.substring(0, 60)}...`
                                        : collection.description || 'No description'}
                                    </div>
                                    
                                    {/* Admin Description */}
                                    {collection.adminDescription && (
                                      <div 
                                        style={{ 
                                          fontSize: '0.75rem',
                                          color: colors.accent,
                                          fontStyle: 'italic',
                                          marginTop: '4px',
                                          padding: '2px 6px',
                                          backgroundColor: `${colors.accent}15`,
                                          borderRadius: '4px',
                                          border: `1px solid ${colors.accent}30`
                                        }}
                                      >
                                        <strong>Admin:</strong> {collection.adminDescription.length > 40 
                                          ? `${collection.adminDescription.substring(0, 40)}...`
                                          : collection.adminDescription}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td
                                  className='text-center align-middle'
                                  style={{
                                    padding: '12px 8px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                  }}
                                >
                                  <Badge
                                    bg={
                                      getProductCount(collection) > 0
                                        ? 'success'
                                        : 'secondary'
                                    }
                                    pill
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      backgroundColor:
                                        getProductCount(collection) > 0
                                          ? colors.successGreen
                                          : isDarkMode
                                            ? '#4a5568'
                                            : '#cbd5e0',
                                      minWidth: '40px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {getProductCount(collection)}
                                  </Badge>
                                </td>
                                <td
                                  className='text-center align-middle'
                                  style={{
                                    padding: '12px 8px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                  }}
                                >
                                  <Badge
                                    bg={
                                      Array.isArray(collection.subCollections) &&
                                        collection.subCollections.length > 0
                                        ? 'info'
                                        : 'secondary'
                                    }
                                    pill
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      backgroundColor:
                                        Array.isArray(collection.subCollections) &&
                                          collection.subCollections.length > 0
                                          ? colors.infoBlue
                                          : isDarkMode
                                            ? '#4a5568'
                                            : '#cbd5e0',
                                      minWidth: '40px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {Array.isArray(collection.subCollections)
                                      ? collection.subCollections.length
                                      : 0}
                                  </Badge>
                                </td>
                                <td
                                  className='text-center align-middle'
                                  style={{
                                    padding: '12px 8px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                  }}
                                >
                                  {collection.isPublic !== false ? (
                                    <Badge
                                      bg='success'
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        backgroundColor: colors.successGreen,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        minWidth: '60px',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <FaGlobe size={10} /> Public
                                    </Badge>
                                  ) : (
                                    <Badge
                                      bg='danger'
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        backgroundColor: colors.dangerRed,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        minWidth: '60px',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <FaUserShield size={10} /> Admin
                                    </Badge>
                                  )}
                                </td>
                                <td
                                  className='text-center align-middle'
                                  style={{
                                    padding: '12px 8px',
                                    borderBottom: `1px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                  }}
                                >
                                  {collection.requiresCode ? (
                                    <Badge
                                      bg='warning'
                                      text='dark'
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        backgroundColor: colors.warningYellow,
                                        color: '#744210',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        minWidth: '50px',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <FaLock size={10} /> Code
                                    </Badge>
                                  ) : (
                                    <Badge
                                      bg='info'
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        backgroundColor: colors.infoBlue,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        minWidth: '50px',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <FaUnlock size={10} /> Open
                                    </Badge>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: '12px 8px',
                                    borderBottom: `1px solid ${colors.border}`,
                                  }}
                                >
                                  <div
                                    className='admin-actions'
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '6px',
                                      justifyItems: 'stretch',
                                      alignItems: 'stretch',
                                    }}
                                  >
                                    <Button
                                      variant='info'
                                      size='sm'
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        backgroundColor: colors.infoBlue,
                                        border: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        minHeight: '32px',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onClick={() =>
                                        selectRootCollection(collection._id)
                                      }
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.backgroundColor = colors.infoLight;
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.backgroundColor = colors.infoBlue;
                                      }}
                                    >
                                      <FaEye size={12} /> View Subs
                                    </Button>

                                    <LinkContainer
                                      to={`/admin/collection/${collection._id}/edit`}
                                    >
                                      <Button
                                        variant='primary'
                                        size='sm'
                                        style={{
                                          padding: '6px 12px',
                                          borderRadius: '6px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          backgroundColor: colors.accent,
                                          border: 'none',
                                          fontSize: '0.75rem',
                                          fontWeight: '600',
                                          minHeight: '32px',
                                          transition: 'all 0.2s ease',
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.transform = 'translateY(-1px)';
                                          e.currentTarget.style.backgroundColor = colors.accentLight;
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.transform = 'none';
                                          e.currentTarget.style.backgroundColor = colors.accent;
                                        }}
                                      >
                                        <FaEdit size={12} /> Edit
                                      </Button>
                                    </LinkContainer>

                                    <Button
                                      variant='info'
                                      size='sm'
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        backgroundColor: colors.infoBlue,
                                        border: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        minHeight: '32px',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onClick={() => duplicateCollectionHandler(collection._id)}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.backgroundColor = colors.infoLight;
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.backgroundColor = colors.infoBlue;
                                      }}
                                      title="Duplicate Collection"
                                    >
                                      <FaCopy size={12} /> Duplicate
                                    </Button>

                                    <Button
                                      variant='danger'
                                      size='sm'
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        backgroundColor: colors.dangerRed,
                                        border: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        minHeight: '32px',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onClick={() =>
                                        deleteCollectionHandler(collection._id)
                                      }
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.backgroundColor = colors.dangerLight;
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.backgroundColor = colors.dangerRed;
                                      }}
                                    >
                                      <FaTrash size={12} /> Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      // Mobile view
                      <div className='admin-table-mobile'>
                        {filteredRootCollections.map((collection) =>
                          renderCollectionCard(collection)
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Message>
                    No collections found.{' '}
                    {searchTerm && 'Try changing your search criteria.'}
                  </Message>
                )}
              </Tab>

              <Tab
                eventKey='sub'
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 5px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '600',
                    }}
                  >
                    <FaChevronRight /> Sub-Collections
                    {selectedRootCollection && rootCollections?.find(c => c._id === selectedRootCollection) &&
                      <Badge
                        bg="info"
                        pill
                        style={{
                          marginLeft: '5px',
                          backgroundColor: colors.accent,
                          fontSize: '0.75rem',
                        }}
                      >
                        {rootCollections.find(c => c._id === selectedRootCollection).name}
                      </Badge>
                    }
                  </div>
                }
                disabled={!selectedRootCollection}
              >
                {isLoadingSubCollections ? (
                  <Loader />
                ) : (
                  <>
                    {selectedRootCollection && (
                      <div className="mb-4">
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setActiveTab('root');
                            setSelectedRootCollection(null);
                          }}
                          style={{
                            borderRadius: '10px',
                            padding: '8px 15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <FaLayerGroup /> Back to Root Collections
                        </Button>
                      </div>
                    )}

                    {subCollections?.length > 0 ? (
                      !isMobile ? (
                        <div
                          className="admin-table-responsive"
                          style={{
                            background: colors.cardGradient,
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: colors.shadow,
                            border: `1px solid ${colors.border}`,
                            width: '100%',
                            maxWidth: '100%',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'block',
                            overflowX: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            msOverflowStyle: '-ms-autohiding-scrollbar'
                          }}
                        >
                          <Table
                            bordered
                            hover
                            responsive
                            className="admin-table mb-0"
                            style={{
                              margin: 0,
                              width: '100%',
                              fontSize: '0.9rem',
                              borderCollapse: 'separate',
                              borderSpacing: '0',
                              backgroundColor: 'transparent',
                            }}
                          >
                            <thead
                              style={{
                                background: `linear-gradient(135deg, ${colors.headerBg} 0%, ${colors.cardBg} 100%)`,
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                              }}
                            >
                              <tr>
                                <th
                                  style={{
                                    width: '25%',
                                    padding: '20px 12px',
                                    color: colors.text,
                                    fontWeight: '700',
                                    borderBottom: `2px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: 'transparent',
                                  }}
                                >
                                  NAME
                                </th>
                                <th
                                  style={{
                                    width: '30%',
                                    padding: '20px 12px',
                                    color: colors.text,
                                    fontWeight: '700',
                                    borderBottom: `2px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: 'transparent',
                                  }}
                                >
                                  DESCRIPTION
                                </th>
                                <th
                                  style={{
                                    width: '10%',
                                    padding: '20px 12px',
                                    color: colors.text,
                                    fontWeight: '700',
                                    borderBottom: `2px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: 'transparent',
                                    textAlign: 'center',
                                  }}
                                >
                                  UNITS
                                </th>
                                <th
                                  style={{
                                    width: '12%',
                                    padding: '20px 12px',
                                    color: colors.text,
                                    fontWeight: '700',
                                    borderBottom: `2px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: 'transparent',
                                    textAlign: 'center',
                                  }}
                                >
                                  VISIBILITY
                                </th>
                                <th
                                  style={{
                                    width: '10%',
                                    padding: '20px 12px',
                                    color: colors.text,
                                    fontWeight: '700',
                                    borderBottom: `2px solid ${colors.border}`,
                                    borderRight: `1px solid ${colors.divider}`,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: 'transparent',
                                    textAlign: 'center',
                                  }}
                                >
                                  ACCESS
                                </th>
                                <th
                                  style={{
                                    width: '13%',
                                    padding: '20px 12px',
                                    color: colors.text,
                                    fontWeight: '700',
                                    borderBottom: `2px solid ${colors.border}`,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: 'transparent',
                                    textAlign: 'center',
                                  }}
                                >
                                  ACTIONS
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {subCollections.map((collection) => (
                                <tr
                                  key={collection._id}
                                  style={{ transition: 'all 0.2s ease' }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <td
                                    className="align-middle"
                                    style={{
                                      padding: '16px',
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="me-2"
                                        style={{
                                          width: '50px',
                                          height: '50px',
                                          borderRadius: '10px',
                                          overflow: 'hidden',
                                          boxShadow: `0 2px 5px ${colors.border}`,
                                        }}
                                      >
                                        <img
                                          src={collection.image || '/images/sample.jpg'}
                                          alt={collection.name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                          }}
                                        />
                                      </div>
                                      <strong style={{ color: colors.text }}>
                                        {collection.name}
                                      </strong>
                                    </div>
                                  </td>
                                  <td
                                    className="align-middle"
                                    style={{
                                      padding: '16px',
                                      color: colors.secondaryText,
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    {collection.description && collection.description.length > 50
                                      ? `${collection.description.substring(0, 50)}...`
                                      : collection.description || 'No description'}
                                  </td>
                                  <td
                                    className="text-center align-middle"
                                    style={{
                                      padding: '16px',
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    <Badge
                                      bg={
                                        getProductCount(collection) > 0
                                          ? 'success'
                                          : 'secondary'
                                      }
                                      pill
                                      style={{
                                        padding: '8px 12px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        backgroundColor:
                                          getProductCount(collection) > 0
                                            ? colors.successGreen
                                            : isDarkMode
                                              ? '#4a5568'
                                              : '#cbd5e0',
                                      }}
                                    >
                                      {getProductCount(collection)}
                                    </Badge>
                                  </td>
                                  <td
                                    className="text-center align-middle"
                                    style={{
                                      padding: '16px',
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    {collection.isPublic !== false ? (
                                      <Badge
                                        bg="success"
                                        pill
                                        style={{
                                          padding: '8px 16px',
                                          fontSize: '0.85rem',
                                          fontWeight: '700',
                                          backgroundColor: colors.successGreen,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          border: `2px solid ${colors.successLight}20`,
                                          boxShadow: `0 2px 8px ${colors.successGreen}30`,
                                          borderRadius: '12px',
                                        }}
                                      >
                                        <FaGlobe size={12} /> Public
                                      </Badge>
                                    ) : (
                                      <Badge
                                        bg="danger"
                                        pill
                                        style={{
                                          padding: '8px 16px',
                                          fontSize: '0.85rem',
                                          fontWeight: '700',
                                          backgroundColor: colors.dangerRed,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          border: `2px solid ${colors.dangerLight}20`,
                                          boxShadow: `0 2px 8px ${colors.dangerRed}30`,
                                          borderRadius: '12px',
                                        }}
                                      >
                                        <FaUserShield size={12} /> Admin Only
                                      </Badge>
                                    )}
                                  </td>
                                  <td
                                    className="text-center align-middle"
                                    style={{
                                      padding: '16px',
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    {collection.requiresCode ? (
                                      <Badge
                                        bg="warning"
                                        text="dark"
                                        pill
                                        style={{
                                          padding: '8px 12px',
                                          fontSize: '0.85rem',
                                          fontWeight: '600',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          width: 'fit-content',
                                          margin: '0 auto',
                                          backgroundColor: colors.warningYellow,
                                          color: '#744210',
                                        }}
                                      >
                                        <FaLock /> Code
                                      </Badge>
                                    ) : (
                                      <Badge
                                        bg="info"
                                        pill
                                        style={{
                                          padding: '8px 12px',
                                          fontSize: '0.85rem',
                                          fontWeight: '600',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          width: 'fit-content',
                                          margin: '0 auto',
                                          backgroundColor: colors.infoBlue,
                                        }}
                                      >
                                        <FaUnlock /> Open
                                      </Badge>
                                    )}
                                  </td>
                                  <td
                                    style={{
                                      padding: '16px',
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    <div
                                      className="admin-actions"
                                      style={{
                                        display: 'flex',
                                        gap: '6px',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <LinkContainer to={`/admin/collection/${collection._id}/edit`}>
                                        <Button
                                          variant="primary"
                                          style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '36px',
                                            height: '36px',
                                            backgroundColor: colors.accent,
                                            border: 'none',
                                          }}
                                          title="Edit"
                                        >
                                          <FaEdit />
                                        </Button>
                                      </LinkContainer>
                                      <Button
                                        variant="info"
                                        style={{
                                          padding: '8px',
                                          borderRadius: '8px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '36px',
                                          height: '36px',
                                          backgroundColor: colors.infoBlue,
                                          border: 'none',
                                        }}
                                        onClick={() => duplicateCollectionHandler(collection._id)}
                                        title="Duplicate Collection"
                                      >
                                        <FaCopy />
                                      </Button>
                                      <Button
                                        variant="danger"
                                        style={{
                                          padding: '8px',
                                          borderRadius: '8px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '36px',
                                          height: '36px',
                                          backgroundColor: colors.dangerRed,
                                          border: 'none',
                                        }}
                                        onClick={() => deleteCollectionHandler(collection._id)}
                                        title="Delete"
                                      >
                                        <FaTrash />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        // Mobile view for subcollections
                        <div className="admin-table-mobile">
                          {subCollections.map((collection) => renderCollectionCard(collection, true))}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-5">
                        <Message>
                          No subcollections found for this collection.
                        </Message>
                        <Button
                          variant="primary"
                          onClick={handleModalOpen}
                          className="mt-3"
                          style={{
                            backgroundColor: colors.accent,
                            borderColor: colors.accent,
                            borderRadius: '10px',
                          }}
                        >
                          <FaPlus className="me-2" /> Create a Subcollection
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Tab>
            </Tabs>

            {/* Add pagination component at the bottom of the root collections tab */}
            {activeTab === 'root' && data && data.pages > 1 && (
              <div className='d-flex justify-content-center mt-4'>
                <CollectionPaginate
                  pages={data.pages}
                  page={data.page}
                />
              </div>
            )}

            {/* Create Collection Modal */}
            <Modal show={showCreateModal} onHide={handleModalClose} size='lg'>
              <Modal.Header closeButton>
                <Modal.Title>
                  <FaPlus className='me-2' />
                  {parentCollectionId ? 'Create Sub-Collection' : 'Create Root Collection'}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group
                    controlId='parentCollection'
                    className='admin-form-group'
                  >
                    <Form.Label>Parent Collection</Form.Label>
                    <Form.Control
                      as='select'
                      value={parentCollectionId}
                      onChange={(e) => setParentCollectionId(e.target.value)}
                      className='admin-form-control admin-select'
                      style={{ maxHeight: '200px', overflowY: 'auto' }}
                    >
                      <option value=''>None (Root Collection)</option>
                      {rootCollections &&
                        rootCollections
                          .filter(collection => 
                            collection.name.toLowerCase().includes('') // You can add search functionality here
                          )
                          .map((collection) => (
                            <option key={collection._id} value={collection._id}>
                              {collection.name} {collection.orderNumber ? `(#${collection.orderNumber})` : ''}
                            </option>
                          ))}
                    </Form.Control>
                    <Form.Text className='text-muted'>
                      Select a parent collection to create a sub-collection. Leave empty for root collection.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group controlId='orderNumber' className='admin-form-group'>
                    <Form.Label>Order Number</Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='e.g. 1, 1.1, 2.3 (optional)'
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className='admin-form-control'
                    />
                    <Form.Text className='text-muted'>
                      Set the display order of this collection. Collections are sorted by this value on the home screen. Lower numbers appear first.
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={8}>
                      <Form.Group controlId='name' className='admin-form-group'>
                        <Form.Label>Collection Name</Form.Label>
                        <Form.Control
                          type='text'
                          placeholder='Enter collection name'
                          value={collectionName}
                          onChange={(e) => setCollectionName(e.target.value)}
                          required
                          className='admin-form-control'
                        />
                      </Form.Group>

                      <Form.Group
                        controlId='description'
                        className='admin-form-group'
                      >
                        <Form.Label>Public Description</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows={3}
                          placeholder='Enter collection description (visible to users)'
                          value={collectionDescription}
                          onChange={(e) => setCollectionDescription(e.target.value)}
                          required
                          className='admin-form-control'
                        />
                        <Form.Text className='text-muted'>
                          This description will be visible to all users
                        </Form.Text>
                      </Form.Group>

                      <Form.Group
                        controlId='adminDescription'
                        className='admin-form-group'
                      >
                        <Form.Label>Admin Description (Internal Only)</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows={2}
                          placeholder='Enter admin notes (only visible to admins)'
                          value={collectionAdminDescription}
                          onChange={(e) => setCollectionAdminDescription(e.target.value)}
                          className='admin-form-control'
                        />
                        <Form.Text className='text-muted'>
                          Internal notes for admins only - not visible to users
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId='image' className='admin-form-group'>
                        <Form.Label>Collection Image</Form.Label>
                        <div className='text-center mb-3'>
                          {collectionImage ? (
                            <img
                              src={collectionImage}
                              alt='Collection preview'
                              style={{
                                maxWidth: '100%',
                                maxHeight: '150px',
                                objectFit: 'contain',
                                borderRadius: 'var(--admin-radius)',
                                border: '1px solid var(--admin-border)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '150px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'var(--admin-hover)',
                                borderRadius: 'var(--admin-radius)',
                                border: '1px solid var(--admin-border)',
                              }}
                            >
                              <FaImage size={40} style={{ opacity: 0.3 }} />
                            </div>
                          )}
                        </div>
                        <CollectionImageUploader
                          onImageUploaded={handleImageUploaded}
                          initialImage={collectionImage}
                        />
                        <Form.Text className='text-muted'>
                          Upload an image or enter URL directly. You can modify this later.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className='admin-divider'></div>

                  <Row>
                    <Col md={6}>
                      <Form.Group controlId='isPublic' className='admin-form-group'>
                        <div className='d-flex align-items-center mb-2'>
                          <FaGlobe className='me-2 text-primary' />
                          <Form.Label
                            className='mb-0'
                            style={{ fontWeight: '600' }}
                          >
                            Visibility Settings
                          </Form.Label>
                        </div>
                        <Form.Check
                          type='checkbox'
                          label='Public (visible to all users)'
                          checked={collectionIsPublic}
                          onChange={(e) => setCollectionIsPublic(e.target.checked)}
                          className='mb-2'
                        />
                        <Form.Text className='text-muted'>
                          If disabled, this collection will only be visible to
                          admins
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group
                        controlId='requiresCode'
                        className='admin-form-group'
                      >
                        <div className='d-flex align-items-center mb-2'>
                          <FaShieldAlt className='me-2 text-warning' />
                          <Form.Label
                            className='mb-0'
                            style={{ fontWeight: '600' }}
                          >
                            Access Protection
                          </Form.Label>
                        </div>
                        <Form.Check
                          type='checkbox'
                          label='Require access code'
                          checked={requiresCode}
                          onChange={(e) => setRequiresCode(e.target.checked)}
                          className='mb-2'
                        />
                        <Form.Text className='text-muted'>
                          If enabled, users will need to enter a code to view this
                          collection
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  {requiresCode && (
                    <Form.Group controlId='accessCode' className='admin-form-group'>
                      <Form.Label>Access Code</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type='text'
                          placeholder='Enter access code'
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          required={requiresCode}
                          className='admin-form-control'
                        />
                      </InputGroup>
                      <Form.Text className='text-muted'>
                        Share this code with users who should have access
                      </Form.Text>
                    </Form.Group>
                  )}
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant='outline-secondary'
                  onClick={handleModalClose}
                  className='admin-btn'
                >
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onClick={createCollectionHandler}
                  disabled={
                    isCreating ||
                    !collectionName ||
                    !collectionDescription ||
                    !collectionImage ||
                    (requiresCode && !accessCode)
                  }
                  className='admin-btn'
                >
                  {isCreating ? 'Creating...' : 'Create Collection'}
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </div>
    </AnimatedScreenWrapper>
  );
};

export default CollectionListScreen;
