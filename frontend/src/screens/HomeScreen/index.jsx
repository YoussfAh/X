import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Message from '../../components/Message';
import Meta from '../../components/Meta';
import { useGetCollectionsQuery } from '../../slices/collectionsApiSlice';
import { useGetActiveQuizForUserQuery } from '../../slices/quizApiSlice';
import { useTrackCollectionAccessMutation, useRefreshUserDataQuery } from '../../slices/usersApiSlice';
import { updateUserData } from '../../slices/authSlice';
import QuizBanner from '../../components/QuizBanner';
import '../../assets/styles/index.css';

// Import all components directly for instant loading (no lazy loading)
import MainHeroSection from '../../components/hero/MainHeroSection';
import TopHeroCarousel from '../../components/TopHeroCarousel';
import AssignedCollections from './AssignedCollections';
import CollectionsGrid from './CollectionsGrid';
import { getAllCollections } from './utils';

// Custom style to remove horizontal padding
const fullWidthContainerStyle = {
  paddingLeft: 0,
  paddingRight: 0,
};

const HomeScreen = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);
    const [trackAccess] = useTrackCollectionAccessMutation();
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    const { data: collectionsData, error: collectionsError } = useGetCollectionsQuery(undefined, {
        // Remove loading states for instant display
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
        keepUnusedDataFor: 300 // 5 minute cache
    });
    
    const { data: refreshedUserData } = useRefreshUserDataQuery(undefined, { 
        skip: !userInfo,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false
    });

    useEffect(() => {
        if (refreshedUserData && userInfo) {
            const hasChanged = 
                refreshedUserData.assignedCollections?.length !== userInfo.assignedCollections?.length ||
                refreshedUserData.isAdmin !== userInfo.isAdmin ||
                refreshedUserData.email !== userInfo.email;
                
            if (hasChanged) {
                dispatch(updateUserData(refreshedUserData));
            }
        }
    }, [refreshedUserData, userInfo, dispatch]);

    const { data: activeQuiz } = useGetActiveQuizForUserQuery(undefined, {
        skip: !userInfo,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false
    });

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

    const handleCollectionClick = async (collectionId) => {
        if (!userInfo?._id) return;
        try {
            await trackAccess({ userId: userInfo._id, collectionId }).unwrap();
        } catch (err) {
            console.error('Error tracking access:', err);
        }
    };

    const publicCollections = useMemo(() => {
        return collectionsData ? getAllCollections(collectionsData) : [];
    }, [collectionsData]);

    const error = collectionsError ? (collectionsError?.data?.message || collectionsError.error) : null;

    // Remove all loading checks - render immediately with available data
    return (
        <div className="no-margin-top">
            <Meta title='Collections | Home' description='Explore our collections' />

            <div className="main-hero-section">
                <MainHeroSection userInfo={userInfo} />
            </div>
            
            <div className='main-content-section pb-4' style={{
                color: isDarkMode ? '#fff' : '#1e293b',
                backgroundColor: isDarkMode ? 'transparent' : '#f8fafc',
                minHeight: '100vh',
                transition: 'all 0.3s ease',
            }}>
                <div className="carousel-section">
                    <TopHeroCarousel />
                </div>

                {userInfo && activeQuiz && (
                    <div className="container section-spacing">
                        <QuizBanner
                          message={activeQuiz.homePageMessage}
                          quizId={activeQuiz._id}
                          quizName={activeQuiz.name}
                        />
                    </div>
                )}

                <div style={fullWidthContainerStyle} className="section-spacing">
                    <AssignedCollections userInfo={userInfo} onCollectionClick={handleCollectionClick} />
                </div>

                {error && <Message variant='danger'>{error}</Message>}
                
                <div style={fullWidthContainerStyle} className="section-spacing">
                    <CollectionsGrid collections={publicCollections} onCollectionClick={handleCollectionClick} />
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;