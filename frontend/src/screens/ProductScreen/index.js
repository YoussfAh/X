import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaArrowLeft } from 'react-icons/fa';
import { useGetProductDetailsQuery, useGetWorkoutCollectionQuery } from '../../slices/productsApiSlice';
import Loader from '../../components/Loader';
import Meta from '../../components/Meta';
import { AnimatedScreenWrapper } from '../../components/animations';
import FadeIn from '../../components/animations/FadeIn';
import ProductContent from './ProductContent';
import VideoSection from './VideoSection';
import '../../assets/styles/animations.css';

const ProductScreen = ({ productId: propProductId, inCollection = false }) => {
    const { id: paramProductId } = useParams();
    const productId = propProductId || paramProductId;
    const cachedProductRef = useRef({});
    const initialLoadRef = useRef(true);

    // Extract collection ID from URL if in a collection
    const getCollectionIdFromUrl = () => {
        if (window.location.pathname.includes('/collections/')) {
            return window.location.pathname.split('/collections/')[1]?.split('/')[0] || null;
        }
        return null;
    };

    const collectionId = getCollectionIdFromUrl();

    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    const [hasLoaded, setHasLoaded] = useState(false);

    // Check if this product has been viewed before
    const [productCached, setProductCached] = useState(() => {
        try {
            const cachedProducts = JSON.parse(localStorage.getItem('cached_products') || '{}');
            return Boolean(cachedProducts[productId]);
        } catch (e) {
            return false;
        }
    });

    const { userInfo } = useSelector((state) => state.auth);
    const { data: product, isLoading, error, isFetching } = useGetProductDetailsQuery(productId, {
        skip: !productId,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: false,
    });

    const { data: workoutCollection, isLoading: isLoadingWorkouts } = useGetWorkoutCollectionQuery(
        undefined,
        {
            skip: !product || !product.category || !product.category.toLowerCase().includes('fitness'),
        }
    );

    // Update product cache when data arrives
    useEffect(() => {
        if (product && productId) {
            try {
                const cachedProducts = JSON.parse(localStorage.getItem('cached_products') || '{}');
                cachedProducts[productId] = {
                    timestamp: Date.now(),
                    name: product.name
                };
                localStorage.setItem('cached_products', JSON.stringify(cachedProducts));
                setProductCached(true);

                // Store product in ref for immediate access during skeleton loading
                cachedProductRef.current = product;
            } catch (e) {
                console.error('Failed to cache product data:', e);
            }
        }
    }, [product, productId]);

    // Set loaded state with a slight delay to ensure smooth transitions
    useEffect(() => {
        if (product && !hasLoaded) {
            const timer = setTimeout(() => {
                setHasLoaded(true);
                initialLoadRef.current = false;
            }, inCollection ? 50 : 300);
            return () => clearTimeout(timer);
        }
    }, [product, hasLoaded, inCollection]);

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

    // Prepare error message if there's an error
    const errorMessage = error ? error.message : null;

    // Optimize animation props for better performance in collection view
    const fadeProps = useMemo(() => {
        return {
            delay: inCollection ? 50 : 200,
            immediate: inCollection && productCached,
            fast: inCollection,
            duration: inCollection ? 300 : 500
        };
    }, [inCollection, productCached]);

    // If we're in a collection and loading, show a more lightweight skeleton
    if ((isLoading || isFetching) && inCollection) {
        return (
            <div className="product-enter" style={{
                opacity: 0,
                transform: 'translateY(20px)'
            }}>
                <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: isDarkMode ? 'rgba(15, 15, 15, 0.3)' : 'rgba(248, 250, 252, 0.5)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
                    boxShadow: isDarkMode ? '0 8px 30px rgba(0, 0, 0, 0.12)' : '0 8px 30px rgba(0, 0, 0, 0.03)',
                }}>
                    <div className="d-flex align-items-center mb-3">
                        <div className="product-skeleton" style={{ width: '50px', height: '50px', borderRadius: '8px' }} />
                        <div className="ms-3" style={{ flex: 1 }}>
                            <div className="product-skeleton" style={{ height: '22px', width: '60%', marginBottom: '8px' }} />
                            <div className="product-skeleton" style={{ height: '16px', width: '40%' }} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="product-skeleton" style={{ height: '14px', width: '100%', marginBottom: '8px' }} />
                        <div className="product-skeleton" style={{ height: '14px', width: '90%' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AnimatedScreenWrapper
            isLoading={isLoading || isLoadingWorkouts}
            loaderType="card"
            cardCount={1}
            error={errorMessage}
            skipAnimation={inCollection && productCached}
        >
            <Meta title={product?.name || 'Exercise Details'} description={product?.description} />

            {inCollection ? (
                <div className={`collection-product-wrapper ${productCached ? 'instant-load' : 'product-enter'}`} style={{
                    width: '100%',
                    margin: 0,
                    padding: 0
                }}>
                    <ProductContent
                        product={product}
                        isDarkMode={isDarkMode}
                        inCollection={inCollection}
                        productId={productId}
                        workoutCollection={workoutCollection}
                        animationOptimized={true}
                    />
                </div>
            ) : (
                <div
                    className='product-screen-container'
                    style={{
                        overflow: 'hidden',
                        position: 'relative',
                        minHeight: '100vh',
                        backgroundColor: 'transparent',
                        paddingTop: '0.5rem',
                        paddingBottom: '2rem',
                    }}
                >
                    <div
                        className='container-fluid'
                        style={{
                            maxWidth: '100%',
                            margin: '0 auto',
                            padding: '0 0.5rem',
                        }}
                    >
                        <FadeIn delay={100} direction="left">
                            <Link
                                className='btn mb-3 d-flex align-items-center'
                                to='/home'
                                style={{
                                    background: 'transparent',
                                    color: isDarkMode ? '#fff' : '#333',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: 'none',
                                    width: 'fit-content',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                                onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
                            >
                                <FaArrowLeft className='me-2' /> Back to Exercises
                            </Link>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <ProductContent
                                product={product}
                                isDarkMode={isDarkMode}
                                inCollection={inCollection}
                                productId={productId}
                                workoutCollection={workoutCollection}
                            />
                        </FadeIn>
                    </div>
                </div>
            )}
        </AnimatedScreenWrapper>
    );
};

export default ProductScreen;