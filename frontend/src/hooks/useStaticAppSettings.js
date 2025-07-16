import { useState, useEffect } from 'react';
import { getActiveConfigSync, getActiveConfig } from '../config/staticAppConfig';
import { updatePWASettings } from '../utils/pwaUtils';

/**
 * Static App Settings Hook - INSTANT LOADING + REAL-TIME UPDATES!
 * No API calls, no loading states, no spinners - everything loads instantly
 * This replaces useAppSettings for maximum performance
 * Now includes real-time updates for all users when admin makes changes
 */
export const useStaticAppSettings = () => {
    // Check if this is a new user (no localStorage config at all)
    const isNewUser = () => {
        return !localStorage.getItem('STATIC_CONFIG_OVERRIDE') && 
               !localStorage.getItem('STATIC_CONFIG_API_CACHE');
    };

    // Start with synchronous config for instant loading - ensure never null
    const [config, setConfig] = useState(() => {
        // For new users, immediately trigger API fetch before first render
        if (isNewUser()) {
            console.log('👤 New user detected - will fetch latest config from API');
            // Return static config initially, but API fetch will update it immediately
            return {
                ...getActiveConfigSync(),
                colorScheme: getActiveConfigSync()?.colorScheme || {
                    primaryColor: '#4F46E5',
                    secondaryColor: '#7C3AED'
                }
            };
        }
        
        const initialConfig = getActiveConfigSync();
        // Ensure colorScheme is never null
        return {
            ...initialConfig,
            colorScheme: initialConfig?.colorScheme || {
                primaryColor: '#4F46E5',
                secondaryColor: '#7C3AED'
            }
        };
    });
    
    // Flag to track if we've done initial API fetch
    const [hasInitialFetch, setHasInitialFetch] = useState(false);
    
    // Immediate effect to ALWAYS fetch latest config on app load - PRIORITY for new users
    useEffect(() => {
        if (!hasInitialFetch) {
            const wasNewUser = isNewUser();
            console.log(wasNewUser ? '👤 New user - PRIORITY API fetch for latest config' : '🌍 App loaded - fetching latest config from API');
            
            // Always fetch latest config on app load to ensure users see admin changes
            getActiveConfig().then(latestConfig => {
                if (latestConfig) {
                    console.log('📥 Latest config received from API:', latestConfig.siteName);
                    const updatedConfig = {
                        ...latestConfig,
                        colorScheme: latestConfig?.colorScheme || {
                            primaryColor: '#4F46E5',
                            secondaryColor: '#7C3AED'
                        }
                    };
                    setConfig(updatedConfig);
                    
                    // Apply PWA settings when config loads
                    updatePWASettings(updatedConfig);
                    
                    console.log(wasNewUser ? '🎉 NEW USER: Config updated with latest admin changes!' : '✅ Config updated for existing user');
                } else {
                    console.log('⚠️ No config received from API, using current config');
                }
                setHasInitialFetch(true);
            }).catch(error => {
                console.warn('❌ Could not fetch initial config from API:', error);
                setHasInitialFetch(true);
            });
        }
    }, [hasInitialFetch]);
    
    // Listen for config changes (for admin updates) + check for API updates
    useEffect(() => {
        let pollInterval;
        
        const handleConfigUpdate = (event) => {
            // Immediate update from admin changes
            let newConfig;
            
            if (event.detail) {
                // Custom event with config data
                newConfig = event.detail;
            } else if (event.key === 'STATIC_CONFIG_BROADCAST') {
                // Storage event from cross-tab broadcast
                try {
                    const broadcast = JSON.parse(event.newValue);
                    newConfig = broadcast.config;
                    console.log('📡 Received config broadcast from another tab');
                } catch (e) {
                    console.warn('Invalid broadcast data');
                    return;
                }
            } else {
                // Other storage events or general updates
                newConfig = getActiveConfigSync();
            }
            
            if (newConfig) {
                // Ensure colorScheme is never null
                const updatedConfig = {
                    ...newConfig,
                    colorScheme: newConfig?.colorScheme || {
                        primaryColor: '#4F46E5',
                        secondaryColor: '#7C3AED'
                    }
                };
                setConfig(updatedConfig);
                
                // Apply PWA settings when config changes
                updatePWASettings(updatedConfig);
                
                console.log('✅ Config updated from broadcast:', newConfig.siteName);
            }
        };
        
        const checkForUpdates = async () => {
            try {
                // Check if there are API updates available
                const latestConfig = await getActiveConfig();
                
                // For first-time users or when no localStorage override exists, always update with API data
                const hasLocalOverride = localStorage.getItem('STATIC_CONFIG_OVERRIDE');
                const wasNewUser = !hasLocalOverride && !localStorage.getItem('STATIC_CONFIG_API_CACHE');
                
                if (!hasInitialFetch && wasNewUser && latestConfig) {
                    console.log('🚀 First load for new user: Getting latest config from API');
                    setConfig({
                        ...latestConfig,
                        colorScheme: latestConfig?.colorScheme || {
                            primaryColor: '#4F46E5',
                            secondaryColor: '#7C3AED'
                        }
                    });
                    setHasInitialFetch(true);
                    return;
                }
                
                // Compare meaningful fields to detect changes for existing users
                const currentKeys = ['siteName', 'siteDescription', 'headerImage', 'colorScheme'];
                const hasChanges = currentKeys.some(key => {
                    if (key === 'colorScheme') {
                        return JSON.stringify(config?.[key]) !== JSON.stringify(latestConfig?.[key]);
                    }
                    return config?.[key] !== latestConfig?.[key];
                });
                
                if (hasChanges && latestConfig) {
                    console.log('🔄 Config changes detected from API, updating...');
                    // Ensure colorScheme is never null
                    setConfig({
                        ...latestConfig,
                        colorScheme: latestConfig?.colorScheme || {
                            primaryColor: '#4F46E5',
                            secondaryColor: '#7C3AED'
                        }
                    });
                }
                
                if (!hasInitialFetch) {
                    setHasInitialFetch(true);
                }
            } catch (error) {
                console.warn('Could not check for config updates:', error);
                if (!hasInitialFetch) {
                    setHasInitialFetch(true);
                }
            }
        };
        
        // Listen for localStorage changes (cross-tab)
        window.addEventListener('storage', handleConfigUpdate);
        
        // Custom event for same-window updates (admin changes)
        window.addEventListener('staticConfigUpdate', handleConfigUpdate);
        window.addEventListener('instantConfigUpdate', handleConfigUpdate);
        
        // Determine polling frequency based on user type
        const isNewUser = !localStorage.getItem('STATIC_CONFIG_OVERRIDE') && 
                         !localStorage.getItem('STATIC_CONFIG_API_CACHE');
        
        // Poll more frequently for new users to ensure they get admin changes quickly
        const pollFrequency = isNewUser ? 2000 : 5000; // 2 seconds for new users, 5 seconds for existing
        
        // Poll for API changes 
        pollInterval = setInterval(checkForUpdates, pollFrequency);
        
        return () => {
            clearInterval(pollInterval);
            window.removeEventListener('storage', handleConfigUpdate);
            window.removeEventListener('staticConfigUpdate', handleConfigUpdate);
            window.removeEventListener('instantConfigUpdate', handleConfigUpdate);
        };
    }, [config, hasInitialFetch]);

    return {
        siteName: config?.siteName || 'App',
        siteDescription: config?.siteDescription || '',
        siteKeywords: config?.siteKeywords || '',
        headerImage: config?.headerImage || '',
        faviconImage: config?.faviconImage || '',
        faviconSvgCode: config?.faviconSvgCode || '',
        preserveIconRatio: config?.preserveIconRatio || false,
        colorScheme: config?.colorScheme || {
            primaryColor: '#4F46E5',
            secondaryColor: '#7C3AED'
        },
        // PWA Settings
        pwaIcon: config?.pwaIcon || '',
        pwaShortName: config?.pwaShortName || config?.siteName || 'App',
        pwaThemeColor: config?.pwaThemeColor || '#000000',
        pwaBackgroundColor: config?.pwaBackgroundColor || '#ffffff',
        pwaSplashScreenImage: config?.pwaSplashScreenImage || '',
        ogImage: config?.ogImage || '',
        shouldShowContent: true,
        isDataReady: hasInitialFetch,
        isLoading: !hasInitialFetch
    };
}; 