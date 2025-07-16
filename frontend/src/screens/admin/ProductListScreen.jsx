import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Badge, Container } from 'react-bootstrap';
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaBox,
  FaImage,
  FaSearch,
  FaSort,
  FaChevronRight,
  FaFilter,
} from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import ContentLoader from '../../components/animations/ContentLoader';
import PageTransition from '../../components/animations/PageTransition';
import StaggeredList from '../../components/animations/StaggeredList';
import {
  useGetProductsQuery,
  useGetAllProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
} from '../../slices/productsApiSlice';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import '../../assets/styles/admin.css';

const ProductListScreen = () => {
  const navigate = useNavigate();
  const { pageNumber = 1 } = useParams();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth <= 1024 && window.innerWidth > 768
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  // Add state for showing the "Continue to iterate?" button
  const [showIterateButton, setShowIterateButton] = useState(false);
  const [isIterating, setIsIterating] = useState(false);

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

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      navigate('/admin/productlist/1');
    }
  }, [debouncedSearchTerm, navigate]);

  // Define theme-aware colors - Enhanced for AMOLED
  const colors = {
    background: isDarkMode ? '#000000' : '#f8fafc', // True black for AMOLED
    cardBg: isDarkMode ? '#0a0a0a' : '#ffffff', // Near-black for cards
    text: isDarkMode ? '#e2e8f0' : '#1e293b',
    secondaryText: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
    shadow: isDarkMode
      ? '0 10px 25px rgba(0, 0, 0, 0.8), 0 8px 10px rgba(0, 0, 0, 0.7)'
      : '0 2px 10px rgba(0, 0, 0, 0.1)',
    accent: '#7c4dff', // Vibrant purple
    accentDark: '#6e44b2', // Darker purple
    hoverBg: isDarkMode
      ? 'rgba(124, 77, 255, 0.15)'
      : 'rgba(124, 77, 255, 0.05)',
    headerBg: isDarkMode ? '#121212' : '#f8f9fa',
    inputBg: isDarkMode ? '#121212' : '#ffffff',
    buttonGradient: isDarkMode
      ? 'linear-gradient(135deg, #7c4dff, #6930c3)'
      : 'linear-gradient(135deg, #9d71db, #8a5cc7)',
    deleteButtonBg: isDarkMode ? '#451a1a' : '#fee2e2',
    deleteButtonColor: isDarkMode ? '#fda4af' : '#b91c1c',
    editButtonBg: isDarkMode ? '#1e293b' : '#e2e8f0',
    editButtonColor: isDarkMode ? '#e2e8f0' : '#1e293b',
    cardShadowHover: isDarkMode
      ? '0 14px 30px rgba(0, 0, 0, 0.9), 0 10px 15px rgba(0, 0, 0, 0.8)'
      : '0 8px 20px rgba(0, 0, 0, 0.15)',
  };

  // For pagination (when no filters)
  const { data, isLoading, error, refetch } = useGetProductsQuery({
    keyword: '',
    pageNumber: Number(pageNumber),
  });

  // For filtering - get all products
  const { data: allProductsData, refetch: refetchAll } =
    useGetAllProductsQuery();

  const [deleteProduct, { isLoading: loadingDelete }] =
    useDeleteProductMutation();

  const deleteHandler = async (id, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        await deleteProduct(id);
        refetch();
        refetchAll(); // Also refetch all products for filters
        showSuccessToast(`"${productName}" deleted successfully`);
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  const [createProduct, { isLoading: loadingCreate }] =
    useCreateProductMutation();

  const createProductHandler = async () => {
    if (window.confirm('Are you sure you want to create a new unit?')) {
      try {
        await createProduct();
        refetch();
        refetchAll(); // Also refetch all products for filters
        showSuccessToast('Unit created successfully');
        // Show the iterate button after successful creation
        setShowIterateButton(true);
        // Auto-hide after 15 seconds
        setTimeout(() => {
          setShowIterateButton(false);
        }, 15000);
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  // Handle continue iteration
  const continueIterationHandler = () => {
    setIsIterating(true);
    createProductHandler();
    setIsIterating(false);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Enhanced search function
  const searchInProduct = (product, searchTerm) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    // Search in product name
    if (product.name && product.name.toLowerCase().includes(term)) {
      return true;
    }

    // Search in product category
    if (product.category && product.category.toLowerCase().includes(term)) {
      return true;
    }

    // Search in product description if it exists
    if (
      product.description &&
      product.description.toLowerCase().includes(term)
    ) {
      return true;
    }

    // Search in product ID (partial match)
    if (product._id && product._id.toLowerCase().includes(term)) {
      return true;
    }

    return false;
  };

  // Get all products for filtering
  const getAllProducts = () => {
    // If we're filtering, use all products data
    if (debouncedSearchTerm || categoryFilter !== 'all') {
      return allProductsData?.products || [];
    }
    // Otherwise use the paginated data
    return data?.products || [];
  };

  // Get unique categories from products for filter dropdown
  const getUniqueCategories = () => {
    // Always use all products data to get complete category list
    const allProducts = allProductsData?.products || [];
    if (!allProducts.length) return [];
    const categories = [
      ...new Set(
        allProducts.map((product) => product.category).filter(Boolean)
      ),
    ];
    return categories.sort();
  };

  // Filter products by category and search term
  const filteredProducts = getAllProducts().filter((product) => {
    // Apply search filter
    const matchesSearch = searchInProduct(product, debouncedSearchTerm);

    // Apply category filter
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Apply client-side sorting to filtered products
  const sortedProducts = filteredProducts
    ? [...filteredProducts].sort((a, b) => {
        // For string fields
        if (a[sortField] < b[sortField])
          return sortDirection === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField])
          return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : [];

  // Update results summary logic
  const getFilterSummary = () => {
    const totalProducts = getAllProducts().length;
    const filteredCount = filteredProducts.length;

    if (!debouncedSearchTerm && categoryFilter === 'all') {
      return `Showing ${data?.products?.length || 0} of ${
        data?.totalProducts || 0
      } units`;
    }

    let summary = `Found ${filteredCount} unit${
      filteredCount !== 1 ? 's' : ''
    }`;

    if (debouncedSearchTerm && categoryFilter !== 'all') {
      summary += ` matching "${debouncedSearchTerm}" in category "${categoryFilter}"`;
    } else if (debouncedSearchTerm) {
      summary += ` matching "${debouncedSearchTerm}"`;
    } else if (categoryFilter !== 'all') {
      summary += ` in category "${categoryFilter}"`;
    }

    return summary;
  };

  // Determine if we should show pagination
  const shouldShowPagination = () => {
    // Don't show pagination if we're filtering (search or category)
    if (debouncedSearchTerm || categoryFilter !== 'all') {
      return false;
    }
    // Show pagination for normal browsing
    return data?.pages > 1;
  };

  // Truncate text helper
  const truncateText = (text, maxLength) => {
    return text && text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  // Render product card for mobile and tablet view
  const renderProductCard = (product, index) => (
    <div
      className={`product-card stagger-item-${(index % 10) + 1}`}
      key={product._id}
      style={{
        backgroundColor: isDarkMode ? '#111111' : '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid ${
          isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }`,
        boxShadow: isDarkMode
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isDarkMode
          ? '0 8px 20px rgba(0, 0, 0, 0.4)'
          : '0 8px 20px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.border = `1px solid ${
          isDarkMode ? 'rgba(157, 113, 219, 0.4)' : 'rgba(157, 113, 219, 0.3)'
        }`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = isDarkMode
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.border = `1px solid ${
          isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }`;
      }}
    >
      {/* Product Image */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${
              isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }`,
          }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <FaImage size={32} color={isDarkMode ? '#666666' : '#9ca3af'} />
          )}
        </div>
      </div>

      {/* Product Name */}
      <h5
        style={{
          fontWeight: '600',
          margin: '0 0 8px 0',
          color: isDarkMode ? '#ffffff' : '#1f2937',
          fontSize: '1.1rem',
          textAlign: 'center',
          lineHeight: '1.3',
          minHeight: '1.4em',
        }}
      >
        {truncateText(product.name, 25)}
      </h5>

      {/* Product Price */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#9d71db',
            background: isDarkMode
              ? 'linear-gradient(135deg, #9d71db, #7c4dff)'
              : 'linear-gradient(135deg, #9d71db, #8a5cc7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {product.price}
        </span>
      </div>

      {/* Product Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.02)',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginBottom: '4px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Category
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              color: isDarkMode ? '#e5e7eb' : '#374151',
              fontWeight: '500',
            }}
          >
            {truncateText(product.category || 'N/A', 12)}
          </div>
        </div>
        <div
          style={{
            width: '1px',
            height: '30px',
            backgroundColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
          }}
        ></div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginBottom: '4px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Status
          </div>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(157, 113, 219, 0.15)',
              color: '#9d71db',
            }}
          >
            {product.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Product ID */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: isDarkMode ? '#6b7280' : '#9ca3af',
            fontFamily: 'monospace',
          }}
        >
          ID: {truncateText(product._id, 8)}
        </span>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
        }}
      >
        <Button
          as={Link}
          to={`/admin/product/${product._id}/edit`}
          style={{
            backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6',
            border: `1px solid ${
              isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }`,
            color: isDarkMode ? '#e5e7eb' : '#374151',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            borderRadius: '8px',
            fontWeight: '500',
            transition: 'all 0.1s ease',
            flex: 1,
            justifyContent: 'center',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode
              ? '#222222'
              : '#e5e7eb';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode
              ? '#1a1a1a'
              : '#f3f4f6';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <FaEdit size={14} /> Edit
        </Button>
        <Button
          onClick={() => deleteHandler(product._id, product.name)}
          style={{
            backgroundColor: isDarkMode
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${
              isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
            }`,
            color: '#ef4444',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            borderRadius: '8px',
            fontWeight: '500',
            transition: 'all 0.1s ease',
            flex: 1,
            justifyContent: 'center',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <FaTrash size={14} />
        </Button>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <Container
        fluid
        className='px-1'
        style={{
          backgroundColor: '#000000',
          minHeight: 'calc(100vh - 72px)',
          transition: 'background-color 0.1s ease',
        }}
      >
        {/* Header Section - Always Visible */}
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#111111',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? '1.5rem' : '1.8rem',
              fontWeight: '700',
              color: '#9d71db',
              margin: 0,
              textShadow: '0 0 20px rgba(157, 113, 219, 0.3)',
            }}
          >
            Unit Management
          </h1>

          {/* Controls Container */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'stretch',
            }}
          >
            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <input
                type='text'
                placeholder='Search units by name or category...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  width: isMobile ? '100%' : '280px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.1s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9d71db';
                  e.target.style.boxShadow =
                    '0 0 0 3px rgba(157, 113, 219, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <FaSearch
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666666',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ position: 'relative' }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  width: isMobile ? '100%' : '160px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.1s ease',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9d71db';
                  e.target.style.boxShadow =
                    '0 0 0 3px rgba(157, 113, 219, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value='all'>All Categories</option>
                {getUniqueCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <FaFilter
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666666',
                  fontSize: '0.9rem',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Create Button */}
            <Button
              onClick={createProductHandler}
              disabled={loadingCreate}
              style={{
                background: '#9d71db',
                borderColor: 'transparent',
                padding: '12px 18px',
                borderRadius: '10px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minWidth: isMobile ? '100%' : '140px',
                color: '#ffffff',
                transition: 'all 0.1s ease',
                opacity: loadingCreate ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (!loadingCreate) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.backgroundColor = '#8a5cc7';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.backgroundColor = '#9d71db';
              }}
            >
              <FaPlus /> {loadingCreate ? 'Creating...' : 'Create Unit'}
            </Button>
          </div>
        </div>

        {/* Filter Results Summary */}
        {(debouncedSearchTerm || categoryFilter !== 'all') && (
          <div
            style={{
              marginBottom: '20px',
              padding: '10px 16px',
              backgroundColor: 'rgba(157, 113, 219, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(157, 113, 219, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                color: '#e5e7eb',
              }}
            >
              {getFilterSummary()}
            </span>
          </div>
        )}

        {/* Loading States */}
        {loadingDelete && <Loader text='Deleting unit...' size='small' />}

        {/* Continue Iteration Button */}
        {showIterateButton && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                backgroundColor: 'rgba(157, 113, 219, 0.15)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(157, 113, 219, 0.3)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(157, 113, 219, 0.25)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaChevronRight size={18} color='#9d71db' />
                </div>
                <div>
                  <h5
                    style={{
                      color: '#ffffff',
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '600',
                    }}
                  >
                    Unit created successfully
                  </h5>
                  <p
                    style={{
                      color: '#9ca3af',
                      margin: '4px 0 0 0',
                      fontSize: '0.9rem',
                    }}
                  >
                    Would you like to create another unit?
                  </p>
                </div>
              </div>
              <Button
                onClick={continueIterationHandler}
                disabled={isIterating}
                style={{
                  background: '#9d71db',
                  borderColor: 'transparent',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#ffffff',
                  transition: 'all 0.1s ease',
                }}
              >
                {isIterating ? (
                  <>Creating...</>
                ) : (
                  <>
                    Continue <FaPlus size={12} />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div>
            <ContentLoader
              type={isMobile ? 'card' : 'table'}
              rows={6}
              columns={5}
              cardCount={isMobile ? 3 : 0}
            />
          </div>
        ) : error ? (
          <div>
            <Message variant='danger'>
              {error.data?.message || error.error}
            </Message>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#9ca3af',
            }}
          >
            <FaBox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3
              style={{
                color: '#e5e7eb',
                marginBottom: '8px',
                fontSize: '1.25rem',
                fontWeight: '600',
              }}
            >
              No Units Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              {debouncedSearchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first unit to get started'}
            </p>
          </div>
        ) : (
          <div>
            {/* Product Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : isTablet
                  ? 'repeat(2, 1fr)'
                  : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                padding: '0',
                width: '100%',
              }}
            >
              {sortedProducts.map((product, index) => (
                <div key={product._id}>{renderProductCard(product, index)}</div>
              ))}
            </div>

            {/* Pagination */}
            {shouldShowPagination() && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '40px',
                }}
              >
                <Paginate
                  pages={data.pages}
                  page={data.page}
                  isAdmin={true}
                  keyword={debouncedSearchTerm ? debouncedSearchTerm : ''}
                />
              </div>
            )}
          </div>
        )}
      </Container>
    </PageTransition>
  );
};

export default ProductListScreen;
