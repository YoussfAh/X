import { useGetGeneralSettingsQuery } from '../slices/systemApiSlice';
import { getAppName, getAppShortName, getAppDescription, getMetaConfig, getPWAConfig } from '../config/appBranding';

/**
 * Custom hook to access application settings with complete override behavior
 * Prevents flashing by waiting for API data instead of showing env vars first
 */
export const useAppSettings = () => {
    const { 
        data: settings, 
        isLoading, 
        error,
        isFetching 
    } = useGetGeneralSettingsQuery();

    // Complete override logic - never show env vars if settings exist (even if empty)
    // This prevents flashing between old and new data
    const getSettingValue = (settingValue, envVar, defaultValue) => {
        // If we're still loading, don't show anything to prevent flash
        if (isLoading || isFetching) {
            return null;
        }
        
        // If we have settings object (even if empty), use database values completely
        if (settings !== undefined) {
            // Return the database value if it exists and is not empty, otherwise use default
            return (settingValue !== undefined && settingValue !== null && settingValue !== '') 
                ? settingValue 
                : defaultValue;
        }
        
        // Only if API completely failed, fall back to env vars
        if (error) {
            return process.env[envVar] || defaultValue;
        }
        
        // Still waiting for data - return null to prevent flash
        return null;
    };

    // Get centralized branding configuration
    const pwaConfig = getPWAConfig();
    const metaConfig = getMetaConfig();
    
    // Get settings with complete override behavior using centralized defaults
    const siteName = getSettingValue(
        settings?.siteName, 
        'REACT_APP_NAME', 
        getAppName()
    );

    const siteDescription = getSettingValue(
        settings?.siteDescription, 
        'REACT_APP_DESCRIPTION', 
        getAppDescription()
    );

    const siteKeywords = getSettingValue(
        settings?.siteKeywords, 
        'REACT_APP_KEYWORDS', 
        metaConfig.keywords
    );

    const headerImage = getSettingValue(
        settings?.headerImage, 
        'REACT_APP_HEADER_IMAGE', 
        ''
    );

    const faviconImage = getSettingValue(
        settings?.faviconImage, 
        'REACT_APP_FAVICON_IMAGE', 
        ''
    );

    // These settings don't have env var fallbacks - only use database values
    const faviconSvgCode = isLoading || isFetching ? null : (settings?.faviconSvgCode || '');
    const preserveIconRatio = isLoading || isFetching ? null : (settings?.preserveIconRatio ?? true);
    const pwaIconWithoutBackground = isLoading || isFetching ? null : (settings?.pwaIconWithoutBackground ?? false);
    
    const pwaShortName = getSettingValue(
        settings?.pwaShortName, 
        'REACT_APP_PWA_SHORT_NAME', 
        getAppShortName()
    );

    const pwaThemeColor = getSettingValue(
        settings?.pwaThemeColor, 
        'REACT_APP_PWA_THEME_COLOR', 
        pwaConfig.themeColor
    );

    const pwaBackgroundColor = getSettingValue(
        settings?.pwaBackgroundColor, 
        'REACT_APP_PWA_BACKGROUND_COLOR', 
        pwaConfig.backgroundColor
    );

    const pwaSplashScreenImage = getSettingValue(
        settings?.pwaSplashScreenImage, 
        'REACT_APP_PWA_SPLASH_SCREEN_IMAGE', 
        ''
    );

    const ogImage = getSettingValue(
        settings?.ogImage, 
        'REACT_APP_OG_IMAGE', 
        ''
    );

    const colorScheme = isLoading || isFetching ? null : (settings?.colorScheme || {
        primaryColor: '#4F46E5',
        secondaryColor: '#7C3AED'
    });

    // Determine if we have complete data ready (no flashing)
    const isDataReady = !isLoading && !isFetching && settings !== undefined;
    
    // Determine if we should show content (either we have data or API failed)
    const shouldShowContent = isDataReady || error;

    return {
        siteName,
        siteDescription,
        siteKeywords,
        headerImage,
        faviconImage,
        faviconSvgCode,
        preserveIconRatio,
        pwaIconWithoutBackground,
        pwaShortName,
        pwaThemeColor,
        pwaBackgroundColor,
        pwaSplashScreenImage,
        ogImage,
        colorScheme,
        isLoading,
        isFetching,
        error,
        settings,
        isDataReady,
        shouldShowContent
    };
}; 