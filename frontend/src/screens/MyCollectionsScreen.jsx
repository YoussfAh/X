import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { FaLayerGroup, FaLock, FaLockOpen } from 'react-icons/fa';
import { useGetCollectionsQuery } from '../slices/collectionsApiSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';

const MyCollectionsScreen = () => {
  const [accessedCollections, setAccessedCollections] = useState([]);
  const { userInfo } = useSelector((state) => state.auth);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const { data, isLoading, error } = useGetCollectionsQuery();

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Load accessed collections from localStorage
  useEffect(() => {
    const loadAccessedCollections = () => {
      const accessedCollectionsList = [];

      // Get all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('collection_access_')) {
          const collectionId = key.replace('collection_access_', '');
          try {
            const accessData = JSON.parse(localStorage.getItem(key));
            if (accessData && accessData.granted) {
              accessedCollectionsList.push(collectionId);
            }
          } catch (e) {
            console.error('Error parsing collection access data:', e);
          }
        }
      }

      setAccessedCollections(accessedCollectionsList);
    };

    loadAccessedCollections();
  }, []);

  // Get all accessible collections by combining public and assigned collections
  const getAccessibleCollections = () => {
    if (!data) return [];

    const publicCollections = data.publicCollections || [];
    const assignedCollections = data.assignedCollections || [];

    // Combine both arrays
    return [...publicCollections, ...assignedCollections];
  };

  // Get recently accessed collections (limit to 4)
  const getRecentlyAccessed = () => {
    const accessible = getAccessibleCollections();
    // Show most recently accessed collections first (if user data available)
    if (userInfo?.accessedCollections) {
      const sortedByRecent = [...accessible].sort((a, b) => {
        const aAccess = userInfo.accessedCollections.find(
          (ac) => ac.collectionId === a._id
        );
        const bAccess = userInfo.accessedCollections.find(
          (ac) => ac.collectionId === b._id
        );

        if (!aAccess) return 1;
        if (!bAccess) return -1;

        return new Date(bAccess.lastAccessed) - new Date(aAccess.lastAccessed);
      });

      return sortedByRecent.slice(0, 4);
    }

    return accessible.slice(0, 4);
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#1E293B' : '#fff',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: isDarkMode
      ? '0 4px 6px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px rgba(0, 0, 0, 0.1)',
    height: '100%',
    border: 'none',
  };

  return (
    <Container fluid className='px-1'>
      <Meta title='My Collections | PRO' />
      <h1 className='my-4'>My Collections</h1>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <section className='mb-5'>
            <h2 className='h4 mb-4'>Recently Accessed</h2>
            <Row>
              {getRecentlyAccessed().length > 0 ? (
                getRecentlyAccessed().map((collection) => (
                  <Col
                    key={collection._id}
                    sm={12}
                    md={6}
                    lg={3}
                    className='mb-4'
                  >
                    <Card style={cardStyle}>
                      <Link to={`/collections/${collection._id}`}>
                        <div
                          style={{
                            height: '140px',
                            backgroundImage: `url(${collection.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                          }}
                        >
                          {collection.requiresCode && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: accessedCollections.includes(
                                  collection._id
                                )
                                  ? 'rgba(39, 174, 96, 0.8)'
                                  : 'rgba(231, 76, 60, 0.8)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {accessedCollections.includes(collection._id) ? (
                                <FaLockOpen size={16} />
                              ) : (
                                <FaLock size={16} />
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                      <Card.Body>
                        <Card.Title
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: isDarkMode ? '#fff' : '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <FaLayerGroup
                            size={16}
                            style={{ color: '#8B5CF6' }}
                          />
                          {collection.name}
                        </Card.Title>
                        <Card.Text
                          style={{
                            fontSize: '0.9rem',
                            color: isDarkMode ? '#CBD5E1' : '#64748B',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {collection.description ||
                            'No description available.'}
                        </Card.Text>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: isDarkMode ? '#94A3B8' : '#94A3B8',
                          }}
                        >
                          {collection.products?.length || 0} products
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col>
                  <Message>No collections accessed yet.</Message>
                </Col>
              )}
            </Row>
          </section>

          <section>
            <h2 className='h4 mb-4'>All Available Collections</h2>
            <Row>
              {getAccessibleCollections().length > 0 ? (
                getAccessibleCollections().map((collection) => (
                  <Col
                    key={collection._id}
                    sm={12}
                    md={6}
                    lg={3}
                    className='mb-4'
                  >
                    <Card style={cardStyle}>
                      <Link to={`/collections/${collection._id}`}>
                        <div
                          style={{
                            height: '140px',
                            backgroundImage: `url(${collection.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                          }}
                        >
                          {collection.requiresCode && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: accessedCollections.includes(
                                  collection._id
                                )
                                  ? 'rgba(39, 174, 96, 0.8)'
                                  : 'rgba(231, 76, 60, 0.8)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {accessedCollections.includes(collection._id) ? (
                                <FaLockOpen size={16} />
                              ) : (
                                <FaLock size={16} />
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                      <Card.Body>
                        <Card.Title
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: isDarkMode ? '#fff' : '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <FaLayerGroup
                            size={16}
                            style={{ color: '#8B5CF6' }}
                          />
                          {collection.name}
                        </Card.Title>
                        <Card.Text
                          style={{
                            fontSize: '0.9rem',
                            color: isDarkMode ? '#CBD5E1' : '#64748B',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {collection.description ||
                            'No description available.'}
                        </Card.Text>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: isDarkMode ? '#94A3B8' : '#94A3B8',
                          }}
                        >
                          {collection.products?.length || 0} products
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col>
                  <Message>No available collections found.</Message>
                </Col>
              )}
            </Row>
          </section>
        </>
      )}
    </Container>
  );
};

export default MyCollectionsScreen;
