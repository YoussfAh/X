import { useState, useEffect } from 'react';
import { useGetMainHeroSettingsQuery } from '../slices/systemApiSlice';

// Custom hook for optimized hero loading
export const useOptimizedHeroSettings = () => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isHeroEnabled, setIsHeroEnabled] = useState(null); // null = unknown, false = disabled, true = enabled

    // Quick check for hero status without loading full data
    useEffect(() => {
        // Check if there's any indication hero should be enabled
        // This could be from localStorage, user preferences, etc.
        const checkHeroStatus = async () => {
            try {
                // Quick lightweight check - maybe just ping the API for status
                const response = await fetch('/api/system-settings/hero-status', {
                    method: 'HEAD', // Just check if endpoint exists and is enabled
                    cache: 'force-cache'
                });
                
                if (response.ok) {
                    const enabled = response.headers.get('X-Hero-Enabled') === 'true';
                    setIsHeroEnabled(enabled);
                    
                    if (enabled) {
                        // Only load full data if enabled
                        setTimeout(() => setShouldLoad(true), 1000);
                    }
                }
            } catch (error) {
                // Fallback: assume disabled and check later
                setIsHeroEnabled(false);
                
                // Still check after delay in case of network issues
                setTimeout(() => setShouldLoad(true), 3000);
            }
        };

        checkHeroStatus();
    }, []);

    const { 
        data: heroSettings, 
        isLoading, 
        error
    } = useGetMainHeroSettingsQuery(undefined, {
        skip: !shouldLoad,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        keepUnusedDataFor: 600,
    });

    // Update hero enabled status when data loads
    useEffect(() => {
        if (heroSettings && isHeroEnabled === null) {
            setIsHeroEnabled(heroSettings.enabled === true);
        }
    }, [heroSettings, isHeroEnabled]);

    return {
        heroSettings,
        isLoading: shouldLoad ? isLoading : false,
        error,
        isEnabled: heroSettings?.enabled === true,
        shouldRender: shouldLoad && heroSettings?.enabled === true,
        isQuickCheckDone: isHeroEnabled !== null
    };
};
