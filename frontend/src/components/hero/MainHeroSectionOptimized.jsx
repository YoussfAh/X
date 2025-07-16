import React, { memo, lazy, Suspense, useMemo, useEffect, useState } from 'react';
import { useGetMainHeroSettingsQuery } from '../../slices/systemApiSlice';

// Simple loading fallback component
const ComponentLoader = React.memo(() => (
    <div style={{ 
        height: '200px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'transparent' 
    }}>
        <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
    </div>
));

// Lazy load hero templates for performance
const ClassicHeroTemplate = lazy(() => import('./templates/ClassicHeroTemplate'));
const MinimalHeroTemplate = lazy(() => import('./templates/MinimalHeroTemplate'));
const OriginalHeroTemplate = lazy(() => import('./templates/OriginalHeroTemplate'));
const CustomHeroTemplate = lazy(() => import('./templates/CustomHeroTemplate'));
const ModernTechHeroTemplate = lazy(() => import('./templates/ModernTechHeroTemplate'));
const CorporateTechHeroTemplate = lazy(() => import('./templates/CorporateTechHeroTemplate'));
const CryptoHeroTemplate = lazy(() => import('./templates/CryptoHeroTemplate'));

const MainHeroSection = memo(({ userInfo }) => {
    const [forceRefreshKey, setForceRefreshKey] = useState(0);
    const [shouldFetch, setShouldFetch] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    
    // Start with disabled state, check after component mount
    useEffect(() => {
        // Delay fetching to allow app to load first
        const timer = setTimeout(() => {
            setShouldFetch(true);
        }, 1500); // Wait 1.5 seconds after app loads
        
        return () => clearTimeout(timer);
    }, []);
    
    const { 
        data: heroSettings, 
        isLoading, 
        error
    } = useGetMainHeroSettingsQuery(undefined, {
        // Only fetch when shouldFetch is true
        skip: !shouldFetch,
        refetchOnMountOrArgChange: false, // Reduced refetching
        refetchOnFocus: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        // Cache for 10 minutes to reduce API calls
        keepUnusedDataFor: 600,
    });

    // Update refresh key when data changes
    useEffect(() => {
        if (heroSettings) {
            setForceRefreshKey(prev => prev + 1);
            
            // Only show if enabled
            if (heroSettings.enabled === true) {
                setIsVisible(true);
            }
        }
    }, [heroSettings]);

    // Get selected template and check if enabled
    const selectedTemplate = heroSettings?.selectedTemplate || 'original';
    const isEnabled = heroSettings?.enabled === true; // Explicitly check for true
    const templateData = heroSettings?.templates?.[selectedTemplate];

    // Memoize template component selection
    const TemplateComponent = useMemo(() => {
        if (!isEnabled) return null;
        
        switch (selectedTemplate) {
            case 'original':
                return OriginalHeroTemplate;
            case 'classic':
                return ClassicHeroTemplate;
            case 'minimal':
                return MinimalHeroTemplate;
            case 'custom':
                return CustomHeroTemplate;
            case 'modern-tech':
                return ModernTechHeroTemplate;
            case 'corporate-tech':
                return CorporateTechHeroTemplate;
            case 'crypto-hero':
                return CryptoHeroTemplate;
            default:
                return OriginalHeroTemplate;
        }
    }, [selectedTemplate, isEnabled]);

    // Create a unique key for force re-render when content changes
    const componentKey = useMemo(() => {
        if (!templateData?.content) return `empty-${forceRefreshKey}`;
        
        const keyData = {
            template: selectedTemplate,
            title: templateData.content.title,
            subtitle: templateData.content.subtitle,
            buttonText: templateData.content.buttonText,
            refreshKey: forceRefreshKey
        };
        
        return `hero-${JSON.stringify(keyData).length}-${forceRefreshKey}`;
    }, [templateData, selectedTemplate, forceRefreshKey]);

    // Don't show anything while waiting to fetch
    if (!shouldFetch) {
        return null;
    }

    // Don't show loading spinner - just return null if not ready
    if (isLoading) {
        return null; // No loading spinner visible to user
    }

    if (error) {
        console.error('Error loading hero settings:', error);
        return null;
    }

    // Only render if explicitly enabled and has data
    if (!isEnabled || !isVisible || !TemplateComponent || !templateData) {
        return null;
    }

    return (
        <Suspense fallback={null}> {/* No loading fallback visible to user */}
            <TemplateComponent 
                key={componentKey}
                templateData={templateData}
                userInfo={userInfo}
                forceRefreshKey={forceRefreshKey}
            />
        </Suspense>
    );
});

MainHeroSection.displayName = 'MainHeroSection';

export default MainHeroSection;
