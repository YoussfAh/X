import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Button,
  ListGroup,
  Row,
  Col,
  Table,
  InputGroup,
  Card,
  Badge,
  Pagination,
} from 'react-bootstrap';
import {
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaArrowLeft,
  FaImage,
  FaLock,
  FaUnlock,
  FaPlus,
  FaPencilAlt,
  FaSortNumericDown,
} from 'react-icons/fa';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import CollectionImageUploader from '../../components/CollectionImageUploader';
import {
  useGetAdminCollectionDetailsQuery,
  useUpdateCollectionMutation,
  useUploadCollectionImageMutation,
  useAddProductToCollectionMutation,
  useRemoveProductFromCollectionMutation,
  useUpdateProductsOrderMutation,
  useGetAdminCollectionsQuery,
  useUpdateCollectionOrderMutation,
} from '../../slices/collectionsApiSlice';
import { useGetProductsQuery, useCreateProductMutation } from '../../slices/productsApiSlice';
import '../../assets/styles/admin.css';

const CollectionEditScreen = () => {
  const { id: collectionId } = useParams();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth <= 1024 && window.innerWidth > 768
  );
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024 && window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Define theme-aware colors with black oiled appearance
  const colors = {
    background: isDarkMode ? '#0a0a0a' : '#121212',
    cardBg: isDarkMode ? '#151515' : '#1a1a1a',
    text: isDarkMode ? '#e2e8f0' : '#d0d0d0',
    secondaryText: isDarkMode ? '#94a3b8' : '#909090',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.1)',
    shadow: '0 4px 15px rgba(0, 0, 0, 0.7)',
    accent: '#6e44b2',
    hoverBg: isDarkMode ? '#202020' : '#252525',
    tableHeaderBg: isDarkMode ? '#121212' : '#131313',
    buttonBg: isDarkMode ? '#1e1e1e' : '#252525',
    dangerBg: isDarkMode ? '#301515' : '#2a1515',
    infoBg: isDarkMode ? '#0c2332' : '#0d2838',
    successBg: isDarkMode ? '#0f2a1d' : '#122b1e',
  };

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [adminDescription, setAdminDescription] = useState('');
  const [parentCollection, setParentCollection] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [requiresCode, setRequiresCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Add current page state

  const {
    data: collection,
    isLoading,
    refetch,
    error,
  } = useGetAdminCollectionDetailsQuery(collectionId);

  // Update products query to include pagination
  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery({
    pageNumber: currentPage,
    keyword: searchTerm,
  });
  const { data: collections } = useGetAdminCollectionsQuery();

  const [updateCollection, { isLoading: isUpdating }] =
    useUpdateCollectionMutation();
  const [uploadCollectionImage, { isLoading: isUploading }] =
    useUploadCollectionImageMutation();
  const [addProductToCollection] = useAddProductToCollectionMutation();
  const [removeProductFromCollection] =
    useRemoveProductFromCollectionMutation();
  const [updateProductsOrder] = useUpdateProductsOrderMutation();
  const [createProduct, { isLoading: loadingCreate }] =
    useCreateProductMutation();
  const [updateCollectionOrder] = useUpdateCollectionOrderMutation();

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description);
      setAdminDescription(collection.adminDescription || '');
      setImage(collection.image);
      setIsPublic(
        collection.isPublic !== undefined ? collection.isPublic : true
      );
      setParentCollection(collection.parentCollection || '');
      setOrderNumber(collection.orderNumber || '');

      // Load access code settings
      setRequiresCode(collection.requiresCode || false);
      setAccessCode(collection.accessCode || '');

      // Set selected products with null safety
      if (collection.products) {
        setSelectedProducts(
          collection.products
            .filter(item => item?.product?._id) // Filter out null products
            .map((item) => item.product._id)
        );
        setProductOrders(
          collection.products
            .filter(item => item?.product?._id) // Filter out null products
            .map((item) => ({
              productId: item.product._id,
              displayOrder: item.displayOrder,
              name: item.product.name,
              image: item.product.image,
            }))
        );
      }
    }
  }, [collection]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateCollection({
        collectionId,
        name,
        description,
        adminDescription,
        image,
        isPublic,
        parentCollection: parentCollection || null,
        requiresCode,
        accessCode: requiresCode ? accessCode : '',
        orderNumber,
      }).unwrap();
      showSuccessToast('Collection updated');
      
      // Only refetch if the query has been initialized
      if (refetch) {
        try {
          await refetch();
        } catch (refetchError) {
          console.warn('Refetch failed:', refetchError);
        }
      }
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  const handleImageUploaded = (imageUrl) => {
    setImage(imageUrl);
    showSuccessToast('Image uploaded successfully');
  };

  const addProductHandler = async (productId) => {
    try {
      // Find the next display order (highest + 1)
      const nextOrder =
        productOrders.length > 0
          ? Math.max(...productOrders.map((p) => p.displayOrder)) + 1
          : 0;

      await addProductToCollection({
        collectionId,
        productId,
        displayOrder: nextOrder,
      }).unwrap();

      showSuccessToast('Unit added to collection'); // Changed from Product to Unit
      
      // Only refetch if the query has been initialized
      if (refetch) {
        try {
          await refetch();
        } catch (refetchError) {
          console.warn('Refetch failed:', refetchError);
        }
      }
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  const removeProductHandler = async (productId) => {
    if (window.confirm('Are you sure you want to remove this unit?')) { // Changed from product to unit
      try {
        await removeProductFromCollection({ collectionId, productId }).unwrap();
        showSuccessToast('Unit removed from collection'); // Changed from Product to Unit
        
        // Only refetch if the query has been initialized
        if (refetch) {
          try {
            await refetch();
          } catch (refetchError) {
            console.warn('Refetch failed:', refetchError);
          }
        }
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  const moveProductHandler = async (productId, direction) => {
    try {
      // Find the current product and the one to swap with
      const currentIndex = productOrders.findIndex(
        (p) => p.productId === productId
      );
      const currentProduct = productOrders[currentIndex];

      // Calculate new index based on direction
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      // Check if the move is valid
      if (newIndex < 0 || newIndex >= productOrders.length) {
        return; // Can't move beyond boundaries
      }

      const swapProduct = productOrders[newIndex];

      // Swap display orders
      const updatedOrders = [
        {
          productId: currentProduct.productId,
          displayOrder: swapProduct.displayOrder,
        },
        {
          productId: swapProduct.productId,
          displayOrder: currentProduct.displayOrder,
        },
      ];

      await updateProductsOrder({
        collectionId,
        productOrders: updatedOrders,
      }).unwrap();
      showSuccessToast('Unit order updated'); // Changed from Product to Unit

      // Refetch the entire collection data to ensure UI is in sync with the backend
      if (refetch) {
        try {
          await refetch();
        } catch (refetchError) {
          console.warn('Refetch failed:', refetchError);
        }
      }

      // For better UI experience, also update the local state immediately
      setProductOrders((prevOrders) => {
        const updated = [...prevOrders];
        [updated[currentIndex], updated[newIndex]] = [
          updated[newIndex],
          updated[currentIndex],
        ];
        return updated;
      });
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  const createProductHandler = async () => {
    if (window.confirm('Are you sure you want to create a new unit?')) { // Changed from product to unit
      try {
        // Creating a product with minimal required fields
        const result = await createProduct({
          name: 'New Unit',
          image: '/images/sample.jpg',
          category: 'Exercise',
          description: 'New exercise unit - please edit to add details',
          price: 0,
          countInStock: 0,
          brand: 'Brand',
          isMealDiet: false,
          primaryMuscleGroup: 'chest', // Add default primary muscle group to avoid validation error
          muscleGroups: ['chest'], // Add default muscle groups
          exerciseType: 'strength',
          difficulty: 'intermediate'
        }).unwrap();

        // Add the product to the current collection
        await addProductToCollection({
          collectionId,
          productId: result._id,
          displayOrder: productOrders.length // Add as the last item
        }).unwrap();

        showSuccessToast('Unit created and added to collection'); // Changed from Product to Unit

        // Store current collection ID in localStorage to return here after editing
        localStorage.setItem('returnToCollectionId', collectionId);

        // Navigate to product edit page
        navigate(`/admin/product/${result._id}/edit`);
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  const handleOrderNumberChange = async () => {
    if (!orderNumber.trim()) {
      showErrorToast('Order number cannot be empty');
      return;
    }

    try {
      await updateCollectionOrder({
        collectionId,
        orderNumber: orderNumber.trim(),
      }).unwrap();
      
      // Auto-fix orders after manual update to ensure proper sequencing
      try {
        // await fixAllCollectionOrders().unwrap(); // This line is removed
        showSuccessToast('Collection order updated. This change will affect how collections are displayed on the home screen.');
      } catch (fixError) {
        console.warn('Failed to auto-fix orders after manual update:', fixError);
        showSuccessToast('Collection order updated. This change will affect how collections are displayed on the home screen.');
      }
      
      setIsEditingOrder(false);
      
      // Only refetch if the query has been initialized
      if (refetch) {
        try {
          await refetch();
        } catch (refetchError) {
          console.warn('Refetch failed:', refetchError);
        }
      }
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Filter products based on search term with null safety
  const filteredProducts = productsData?.products
    ? productsData.products
      .filter((product) => product?._id && !selectedProducts.includes(product._id))
      .filter(
        (product) =>
          product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Truncate text helper
  const truncateText = (text, maxLength) => {
    return text && text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  // Render product card (for mobile)
  const renderProductCard = (product, inCollection = false) => (
    <div
      className='product-card'
      key={product.productId || product._id}
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: isDarkMode ? '#1a2233' : '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <FaImage size={24} color={isDarkMode ? '#4b5563' : '#cbd5e1'} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h5
            style={{
              fontWeight: '600',
              marginBottom: '4px',
              color: colors.text,
              fontSize: '1rem',
            }}
          >
            {truncateText(product.name, 30)}
          </h5>
        </div>
      </div>

      {inCollection && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: isDarkMode ? '#1e2736' : '#f8fafc',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: '500',
              color: isDarkMode ? '#94a3b8' : '#64748b',
              marginRight: '8px',
            }}
          >
            DISPLAY ORDER:
          </div>
          <Badge
            bg='secondary'
            style={{
              backgroundColor: colors.accent,
              fontSize: '0.85rem',
              padding: '4px 10px',
            }}
          >
            {product.displayOrder}
          </Badge>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginTop: '12px',
        }}
      >
        {inCollection ? (
          <>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flex: '1',
                justifyContent: 'space-between',
                marginBottom: isMobile ? '8px' : 0,
                width: '100%',
              }}
            >
              <Button
                variant='light'
                style={{
                  backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                  borderColor: 'transparent',
                  color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  flex: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  maxWidth: '100px',
                }}
                disabled={
                  productOrders.findIndex(
                    (p) => p.productId === product.productId
                  ) === 0
                }
                onClick={() => moveProductHandler(product.productId, 'up')}
              >
                <FaArrowUp size={14} /> {!isMobile && 'Up'}
              </Button>
              <Button
                variant='light'
                style={{
                  backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                  borderColor: 'transparent',
                  color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  flex: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  maxWidth: '100px',
                }}
                disabled={
                  productOrders.findIndex(
                    (p) => p.productId === product.productId
                  ) ===
                  productOrders.length - 1
                }
                onClick={() => moveProductHandler(product.productId, 'down')}
              >
                <FaArrowDown size={14} />
              </Button>
            </div>
            <Button
              variant='danger'
              style={{
                backgroundColor: isDarkMode ? '#451a1a' : '#fee2e2',
                borderColor: 'transparent',
                color: isDarkMode ? '#fecaca' : '#b91c1c',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                marginBottom: '8px',
              }}
              onClick={() => removeProductHandler(product.productId)}
            >
              <FaTrash size={14} /> Remove from Collection
            </Button>
            <Button
              variant='info'
              style={{
                backgroundColor: isDarkMode ? '#0c4a6e' : '#e0f2fe',
                borderColor: 'transparent',
                color: isDarkMode ? '#bae6fd' : '#0369a1',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
              onClick={() => {
                // Store current collection ID in localStorage to return here after editing
                localStorage.setItem('returnToCollectionId', collectionId);
                navigate(`/admin/product/${product.productId}/edit`);
              }}
            >
              <FaEdit size={14} /> Edit Product
            </Button>
          </>
        ) : (
          <Button
            style={{
              backgroundColor: colors.accent,
              borderColor: 'transparent',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            onClick={() => addProductHandler(product._id)}
          >
            <FaPlus size={14} /> Add to Collection
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className='admin-container'
      style={{
        backgroundColor: colors.background,
        padding: '20px 16px',
        minHeight: 'calc(100vh - 72px)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Button
        as={Link}
        to='/admin/collectionlist'
        style={{
          backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
          borderColor: 'transparent',
          color: isDarkMode ? '#e2e8f0' : '#1e293b',
          marginBottom: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '0.9rem',
          fontWeight: '500',
        }}
      >
        <FaArrowLeft size={14} /> Back to Collections
      </Button>

      <Row className='g-4'>
        <Col lg={5}>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: colors.shadow,
              border: `1px solid ${colors.border}`,
              marginBottom: '24px',
            }}
          >
            <Card.Header
              style={{
                backgroundColor: '#0d0d0d',
                borderBottom: `1px solid ${colors.border}`,
                padding: '16px 20px',
              }}
            >
              <h5
                style={{
                  margin: 0,
                  color: colors.text,
                  fontWeight: '600',
                }}
              >
                Edit Collection
              </h5>
            </Card.Header>
            <Card.Body
              style={{
                padding: '20px',
                color: colors.text,
              }}
            >
              {isLoading ? (
                <Loader />
              ) : error ? (
                <Message variant='danger'>
                  {error.data?.message || error.error}
                </Message>
              ) : (
                <Form onSubmit={submitHandler}>
                  <Form.Group controlId='name' className='mb-4'>
                    <Form.Label
                      style={{
                        fontWeight: '500',
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        marginBottom: '8px',
                      }}
                    >
                      Name
                    </Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter name'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        backgroundColor: '#0f0f0f',
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    />
                  </Form.Group>

                  <Form.Group controlId='description' className='mb-4'>
                    <Form.Label
                      style={{
                        fontWeight: '500',
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        marginBottom: '8px',
                      }}
                    >
                      Public Description
                    </Form.Label>
                    <Form.Control
                      as='textarea'
                      rows={3}
                      placeholder='Enter description (visible to users)'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      style={{
                        backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    />
                    <Form.Text
                      style={{
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                      }}
                    >
                      To add a link in description, use format: [visible text](url) - example: [Google](https://google.com)
                    </Form.Text>
                  </Form.Group>

                  <Form.Group controlId='adminDescription' className='mb-4'>
                    <Form.Label
                      style={{
                        fontWeight: '500',
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        marginBottom: '8px',
                      }}
                    >
                      Admin Description (Internal Only)
                    </Form.Label>
                    <Form.Control
                      as='textarea'
                      rows={2}
                      placeholder='Enter admin notes (only visible to admins)'
                      value={adminDescription}
                      onChange={(e) => setAdminDescription(e.target.value)}
                      style={{
                        backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    />
                    <Form.Text
                      style={{
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                      }}
                    >
                      Internal notes for admins only - not visible to users
                    </Form.Text>
                  </Form.Group>

                  <Form.Group controlId='parentCollection' className='mb-4'>
                    <Form.Label
                      style={{
                        fontWeight: '500',
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        marginBottom: '8px',
                      }}
                    >
                      Parent Collection
                    </Form.Label>
                    <Form.Select
                      value={parentCollection}
                      onChange={(e) => setParentCollection(e.target.value)}
                      style={{
                        backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    >
                      <option value=''>None (Root Collection)</option>
                      {collections &&
                        collections
                          .filter((c) => c._id !== collectionId) // Can't be its own parent
                          .map((collection) => (
                            <option key={collection._id} value={collection._id}>
                              {collection.name}
                            </option>
                          ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className='mb-4'>
                    <Form.Label style={{ 
                      fontWeight: '500',
                      color: colors.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <FaSortNumericDown style={{ color: colors.accent }} />
                      Order Number
                    </Form.Label>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      <Form.Control
                        type='text'
                        placeholder='e.g. 1, 1.1, 2.3'
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        style={{
                          maxWidth: '150px',
                          backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          padding: '8px 12px',
                        }}
                      />
                      <small style={{ 
                        color: isDarkMode ? '#aaa' : '#666',
                        flex: '1',
                        minWidth: '200px',
                        paddingTop: '4px'
                      }}>
                        Set the display order of this collection (e.g., "1", "1.1", "2.3"). Collections are sorted by this number.
                      </small>
                    </div>
                  </Form.Group>

                  <Form.Group controlId='image' className='mb-4'>
                    <Form.Label
                      style={{
                        fontWeight: '500',
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        marginBottom: '8px',
                      }}
                    >
                      Collection Image
                    </Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter image url'
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      required
                      style={{
                        backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '12px',
                      }}
                    />
                    <div style={{ marginBottom: '12px' }}>
                      <CollectionImageUploader
                        onImageUploaded={handleImageUploaded}
                        initialImage={image}
                      />
                    </div>
                    {isUploading && <Loader />}
                  </Form.Group>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: isDarkMode ? '#1e2736' : '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Group controlId='isPublic' className='mb-3'>
                      <Form.Check
                        type='checkbox'
                        label='Public (visible to all users)'
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        style={{
                          color: colors.text,
                        }}
                      />
                      <Form.Text
                        style={{
                          color: isDarkMode ? '#94a3b8' : '#64748b',
                        }}
                      >
                        If disabled, this collection will only be visible to
                        admins
                      </Form.Text>
                    </Form.Group>

                    <hr
                      style={{
                        margin: '16px 0',
                        borderColor: colors.border,
                      }}
                    />

                    <h5
                      style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: '16px',
                      }}
                    >
                      Access Protection
                    </h5>

                    <Form.Group controlId='requiresCode' className='mb-3'>
                      <Form.Check
                        type='checkbox'
                        label='Require access code'
                        checked={requiresCode}
                        onChange={(e) => setRequiresCode(e.target.checked)}
                        style={{
                          color: colors.text,
                        }}
                      />
                      <Form.Text
                        style={{
                          color: isDarkMode ? '#94a3b8' : '#64748b',
                        }}
                      >
                        If enabled, users will need to enter a code to view this
                        collection
                      </Form.Text>
                    </Form.Group>

                    {requiresCode && (
                      <Form.Group controlId='accessCode' className='mt-3'>
                        <Form.Label
                          style={{
                            fontWeight: '500',
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            marginBottom: '8px',
                          }}
                        >
                          Access Code
                        </Form.Label>
                        <InputGroup>
                          <InputGroup.Text
                            style={{
                              backgroundColor: isDarkMode
                                ? '#1a2233'
                                : '#f1f5f9',
                              border: `1px solid ${colors.border}`,
                              borderRight: 'none',
                              borderRadius: '8px 0 0 8px',
                            }}
                          >
                            <FaLock
                              size={14}
                              color={isDarkMode ? '#94a3b8' : '#64748b'}
                            />
                          </InputGroup.Text>
                          <Form.Control
                            type='text'
                            placeholder='Enter access code'
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            required={requiresCode}
                            style={{
                              backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderLeft: 'none',
                              borderRadius: '0 8px 8px 0',
                            }}
                          />
                        </InputGroup>
                        <Form.Text
                          style={{
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            display: 'block',
                            marginTop: '8px',
                          }}
                        >
                          Share this code with users who should have access
                        </Form.Text>
                      </Form.Group>
                    )}
                  </div>

                  <div className='admin-screen'>
                    <div className='admin-container'>
                      <div className='admin-card'>
                        <h1 style={{ 
                          fontSize: '1.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '2rem',
                          color: colors.text,
                          padding: '1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                            <FaEdit style={{ color: colors.accent }} />
                            Edit Collection
                          </div>
                          <div style={{ 
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1.25rem',
                            background: isDarkMode ? 'rgba(110, 68, 255, 0.1)' : 'rgba(110, 68, 255, 0.05)',
                            borderRadius: '8px'
                          }}>
                            Order: {orderNumber || 'Not set'}
                            <Button
                              variant="link"
                              onClick={() => setIsEditingOrder(true)}
                              style={{ 
                                padding: '0',
                                color: colors.accent,
                                textDecoration: 'none'
                              }}
                            >
                              <FaPencilAlt size={12} />
                            </Button>
                          </div>
                        </h1>

                        <Button
                          type='submit'
                          variant='primary'
                          style={{
                            backgroundColor: colors.accent,
                            borderColor: 'transparent',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            display: 'block',
                            width: '100%',
                            boxShadow: isDarkMode
                              ? '0 4px 12px rgba(110, 68, 178, 0.5)'
                              : '0 4px 12px rgba(110, 68, 178, 0.25)',
                          }}
                          disabled={isUpdating || (requiresCode && !accessCode)}
                        >
                          {isUpdating ? 'Updating...' : 'Update Collection'}
                        </Button>
                        {isUpdating && <Loader />}
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: colors.shadow,
              border: `1px solid ${colors.border}`,
              marginBottom: '24px',
            }}
          >
            <Card.Header
              style={{
                backgroundColor: '#0d0d0d',
                borderBottom: `1px solid ${colors.border}`,
                padding: '16px 20px',
              }}
            >
              <h5
                style={{
                  margin: 0,
                  color: colors.text,
                  fontWeight: '600',
                }}
              >
                Units in Collection
              </h5>
            </Card.Header>
            <Card.Body
              style={{
                padding: '20px',
                color: colors.text,
              }}
            >
              {productOrders.length === 0 ? (
                <Message>No units in this collection</Message>
              ) : !isMobile ? (
                // Desktop view
                <div
                  style={{
                    overflowX: 'auto',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Table
                    bordered
                    hover
                    responsive
                    style={{
                      marginBottom: 0,
                      color: colors.text,
                      borderColor: colors.border,
                    }}
                  >
                    <thead
                      style={{
                        backgroundColor: isDarkMode ? '#1e2736' : '#f8fafc',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            padding: '14px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                          }}
                        >
                          IMAGE
                        </th>
                        <th
                          style={{
                            padding: '14px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                          }}
                        >
                          NAME
                        </th>
                        <th
                          style={{
                            padding: '14px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                          }}
                        >
                          ORDER
                        </th>
                        <th
                          style={{
                            padding: '14px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                          }}
                        >
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productOrders
                        .filter(product => product?.productId) // Filter out null products
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((product, index) => (
                          <tr
                            key={product.productId}
                            style={{
                              borderBottom: `1px solid ${colors.border}`,
                            }}
                          >
                            <td
                              style={{
                                padding: '14px',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                              }}
                            >
                              <div
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  backgroundColor: isDarkMode
                                    ? '#1a2233'
                                    : '#f1f5f9',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <FaImage
                                    size={16}
                                    color={isDarkMode ? '#4b5563' : '#cbd5e1'}
                                  />
                                )}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                              }}
                            >
                              {product.name}
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                              }}
                            >
                              <Badge
                                bg='secondary'
                                style={{
                                  backgroundColor: colors.accent,
                                  padding: '6px 10px',
                                }}
                              >
                                {product.displayOrder}
                              </Badge>
                            </td>
                            <td
                              style={{
                                padding: '10px 14px',
                                verticalAlign: 'middle',
                              }}
                            >
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Button
                                  variant='light'
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? '#334155'
                                      : '#e2e8f0',
                                    borderColor: 'transparent',
                                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    padding: 0,
                                    borderRadius: '6px',
                                  }}
                                  disabled={index === 0}
                                  onClick={() =>
                                    moveProductHandler(product.productId, 'up')
                                  }
                                >
                                  <FaArrowUp size={14} />
                                </Button>
                                <Button
                                  variant='light'
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? '#334155'
                                      : '#e2e8f0',
                                    borderColor: 'transparent',
                                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    padding: 0,
                                    borderRadius: '6px',
                                  }}
                                  disabled={index === productOrders.length - 1}
                                  onClick={() =>
                                    moveProductHandler(
                                      product.productId,
                                      'down'
                                    )
                                  }
                                >
                                  <FaArrowDown size={14} />
                                </Button>
                                <Button
                                  variant='danger'
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? '#451a1a'
                                      : '#fee2e2',
                                    borderColor: 'transparent',
                                    color: isDarkMode ? '#fecaca' : '#b91c1c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    padding: 0,
                                    borderRadius: '6px',
                                  }}
                                  onClick={() =>
                                    removeProductHandler(product.productId)
                                  }
                                >
                                  <FaTrash size={14} />
                                </Button>
                                <Button
                                  variant='info'
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? '#0c4a6e'
                                      : '#e0f2fe',
                                    borderColor: 'transparent',
                                    color: isDarkMode ? '#bae6fd' : '#0369a1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    padding: 0,
                                    borderRadius: '6px',
                                  }}
                                  onClick={() => {
                                    // Store current collection ID in localStorage to return here after editing
                                    localStorage.setItem('returnToCollectionId', collectionId);
                                    navigate(`/admin/product/${product.productId}/edit`);
                                  }}
                                >
                                  <FaEdit size={14} />
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
                <div>
                  {productOrders
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((product) => renderProductCard(product, true))}
                </div>
              )}
            </Card.Body>
          </Card>

          <Card
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: colors.shadow,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Card.Header
              style={{
                backgroundColor: '#0d0d0d',
                borderBottom: `1px solid ${colors.border}`,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h5
                style={{
                  margin: 0,
                  color: colors.text,
                  fontWeight: '600',
                }}
              >
                Add Units to Collection
              </h5>
              <Button
                onClick={createProductHandler}
                style={{
                  backgroundColor: colors.accent,
                  borderColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  boxShadow: isDarkMode
                    ? '0 2px 8px rgba(110, 68, 178, 0.4)'
                    : '0 2px 8px rgba(110, 68, 178, 0.2)',
                }}
              >
                <FaPlus size={12} /> Create Product
              </Button>
            </Card.Header>
            <Card.Body
              style={{
                padding: '20px',
                color: colors.text,
              }}
            >
              <Row className='mb-4'>
                <Col>
                  <InputGroup>
                    <InputGroup.Text
                      style={{
                        backgroundColor: isDarkMode ? '#1a2233' : '#f1f5f9',
                        border: `1px solid ${colors.border}`,
                        borderRight: 'none',
                        borderRadius: '8px 0 0 8px',
                      }}
                    >
                      <FaSearch
                        size={14}
                        color={isDarkMode ? '#94a3b8' : '#64748b'}
                      />
                    </InputGroup.Text>
                    <Form.Control
                      type='text'
                      placeholder='Search units by name or description...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        backgroundColor: isDarkMode ? '#1a2233' : '#fff',
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderLeft: 'none',
                        borderRight: searchTerm
                          ? 'none'
                          : `1px solid ${colors.border}`,
                        borderRadius: searchTerm ? '0' : '0 8px 8px 0',
                      }}
                    />
                    {searchTerm && (
                      <Button
                        style={{
                          backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                          borderColor: 'transparent',
                          color: isDarkMode ? '#e2e8f0' : '#1e293b',
                          borderRadius: '0 8px 8px 0',
                        }}
                        onClick={() => setSearchTerm('')}
                      >
                        Clear
                      </Button>
                    )}
                  </InputGroup>
                </Col>
              </Row>

              {productsData?.products ? (
                filteredProducts.length > 0 ? (
                  !isMobile ? (
                    <div
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <ListGroup variant='flush'>
                        {filteredProducts.map((product) => (
                          <ListGroup.Item
                            key={product._id}
                            style={{
                              backgroundColor: colors.cardBg,
                              borderBottom: `1px solid ${colors.border}`,
                              padding: '16px',
                            }}
                          >
                            <Row className='align-items-center'>
                              <Col xs={2} style={{ maxWidth: '80px' }}>
                                <div
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: isDarkMode
                                      ? '#1a2233'
                                      : '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  ) : (
                                    <FaImage
                                      size={20}
                                      color={isDarkMode ? '#4b5563' : '#cbd5e1'}
                                    />
                                  )}
                                </div>
                              </Col>
                              <Col>
                                <div
                                  style={{
                                    fontWeight: '500',
                                    color: colors.text,
                                    marginBottom: '4px',
                                  }}
                                >
                                  {product.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.85rem',
                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                  }}
                                >
                                  {product.description &&
                                    truncateText(product.description, 100)}
                                </div>
                              </Col>
                              <Col xs={3} style={{ textAlign: 'right' }}>
                                <Button
                                  style={{
                                    backgroundColor: colors.accent,
                                    borderColor: 'transparent',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                  }}
                                  onClick={() => addProductHandler(product._id)}
                                >
                                  <FaPlus size={12} /> Add to Collection
                                </Button>
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  ) : (
                    // Mobile view for available products
                    <div>
                      {filteredProducts.map((product) =>
                        renderProductCard(product)
                      )}
                    </div>
                  )
                ) : searchTerm ? (
                  <Message>No units match your search</Message>
                ) : (
                  <Message>No units available to add</Message>
                )
              ) : (
                <Loader />
              )}

              {/* Pagination controls */}
              {productsData && productsData.pages > 1 && (
                <div className='d-flex justify-content-center mt-4'>
                  <Pagination>
                    <Pagination.First
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{
                        backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                    <Pagination.Prev
                      onClick={() => setCurrentPage(currentPage => Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      style={{
                        backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />

                    {[...Array(productsData.pages).keys()].map(x => {
                      const pageNumber = x + 1;
                      // Show current page, 2 pages before and after when possible
                      if (
                        pageNumber === 1 ||
                        pageNumber === productsData.pages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <Pagination.Item
                            key={pageNumber}
                            active={pageNumber === currentPage}
                            onClick={() => setCurrentPage(pageNumber)}
                            style={pageNumber !== currentPage ? {
                              backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                              borderColor: colors.border,
                              color: colors.text,
                            } : {}}
                          >
                            {pageNumber}
                          </Pagination.Item>
                        );
                      } else if (
                        (pageNumber === 2 && currentPage > 3) ||
                        (pageNumber === productsData.pages - 1 && currentPage < productsData.pages - 2)
                      ) {
                        // Add ellipsis when needed
                        return <Pagination.Ellipsis key={`ellipsis-${pageNumber}`} />;
                      }
                      return null;
                    })}

                    <Pagination.Next
                      onClick={() => setCurrentPage(currentPage => Math.min(productsData.pages, currentPage + 1))}
                      disabled={currentPage === productsData.pages}
                      style={{
                        backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                    <Pagination.Last
                      onClick={() => setCurrentPage(productsData.pages)}
                      disabled={currentPage === productsData.pages}
                      style={{
                        backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CollectionEditScreen;
