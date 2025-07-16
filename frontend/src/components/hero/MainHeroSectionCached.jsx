import React, { memo, lazy, Suspense, useMemo, useEffect, useState } from 'react';
import { useGetMainHeroSettingsQuery } from '../../slices/systemApiSlice';

// Local storage cache key
const HERO_CACHE_KEY = 'mainHeroCache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached hero settings
const getCachedHeroSettings = () => {
    try {
        const cached = localStorage.getItem(HERO_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            
            // Return cached data if not expired
            if (now - timestamp < CACHE_DURATION) {
                return data;
            }
        }
    } catch (error) {
        console.warn('Failed to get cached hero settings:', error);
    }
    
    return null;
};

// Cache hero settings
const cacheHeroSettings = (data) => {
    try {
        localStorage.setItem(HERO_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.warn('Failed to cache hero settings:', error);
    }
};

// Lazy load hero templates
const ClassicHeroTemplate = lazy(() => import('./templates/ClassicHeroTemplate'));
const MinimalHeroTemplate = lazy(() => import('./templates/MinimalHeroTemplate'));
const OriginalHeroTemplate = lazy(() => import('./templates/OriginalHeroTemplate'));
const CustomHeroTemplate = lazy(() => import('./templates/CustomHeroTemplate'));
const ModernTechHeroTemplate = lazy(() => import('./templates/ModernTechHeroTemplate'));
const CorporateTechHeroTemplate = lazy(() => import('./templates/CorporateTechHeroTemplate'));
const CryptoHeroTemplate = lazy(() => import('./templates/CryptoHeroTemplate'));

const MainHeroSectionCached = memo(({ userInfo }) => {
    const [forceRefreshKey, setForceRefreshKey] = useState(0);
    const [cachedSettings, setCachedSettings] = useState(() => getCachedHeroSettings());
    const [shouldFetchFresh, setShouldFetchFresh] = useState(false);
    
    // Start background fetch after component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            setShouldFetchFresh(true);
        }, cachedSettings ? 2000 : 0); // Delay if we have cache, immediate if not
        
        return () => clearTimeout(timer);
    }, [cachedSettings]);
    
    const { 
        data: heroSettings, 
        isLoading, 
        error
    } = useGetMainHeroSettingsQuery(undefined, {
        skip: !shouldFetchFresh,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        keepUnusedDataFor: 600,
    });

    // Update cache when fresh data arrives
    useEffect(() => {
        if (heroSettings && shouldFetchFresh) {
            cacheHeroSettings(heroSettings);
            setCachedSettings(heroSettings);
            setForceRefreshKey(prev => prev + 1);
        }
    }, [heroSettings, shouldFetchFresh]);

    // Use cached settings if available, otherwise wait for fresh data
    const currentSettings = cachedSettings || heroSettings;
    
    // Get selected template and check if enabled
    const selectedTemplate = currentSettings?.selectedTemplate || 'original';
    const isEnabled = currentSettings?.enabled === true;
    const templateData = currentSettings?.templates?.[selectedTemplate];

    // Memoize template component selection
    const TemplateComponent = useMemo(() => {
        if (!isEnabled) return null;
        
        switch (selectedTemplate) {
            case 'original': return OriginalHeroTemplate;
            case 'classic': return ClassicHeroTemplate;
            case 'minimal': return MinimalHeroTemplate;
            case 'custom': return CustomHeroTemplate;
            case 'modern-tech': return ModernTechHeroTemplate;
            case 'corporate-tech': return CorporateTechHeroTemplate;
            case 'crypto-hero': return CryptoHeroTemplate;
            default: return OriginalHeroTemplate;
        }
    }, [selectedTemplate, isEnabled]);

    // Create component key
    const componentKey = useMemo(() => {
        if (!templateData?.content) return `empty-${forceRefreshKey}`;
        
        const keyData = {
            template: selectedTemplate,
            title: templateData.content.title,
            subtitle: templateData.content.subtitle,
            refreshKey: forceRefreshKey
        };
        
        return `hero-cached-${JSON.stringify(keyData).length}-${forceRefreshKey}`;
    }, [templateData, selectedTemplate, forceRefreshKey]);

    // Render immediately if we have cached settings, or wait silently for fresh data
    if (!currentSettings) {
        if (isLoading) return null; // No loading spinner
        if (error) return null;
        return null;
    }

    // Only render if enabled and has data
    if (!isEnabled || !TemplateComponent || !templateData) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <TemplateComponent 
                key={componentKey}
                templateData={templateData}
                userInfo={userInfo}
                forceRefreshKey={forceRefreshKey}
            />
        </Suspense>
    );
});

MainHeroSectionCached.displayName = 'MainHeroSectionCached';

export default MainHeroSectionCached;
