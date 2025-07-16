import { Helmet } from 'react-helmet-async';
import { useStaticAppSettings } from '../hooks/useStaticAppSettings';
import { getAppName, getAppDescription, getMetaConfig, getSocialConfig } from '../config/appBranding';
import React from 'react';
import { getEffectiveIconUrl } from '../utils/iconUtils';

const Meta = ({ title, description, keywords, useDynamicFavicon = false }) => {
  const { 
    faviconImage, 
    faviconSvgCode, 
    ogImage,
    shouldShowContent,
    isDataReady
  } = useStaticAppSettings();
  
  // Get centralized branding configuration
  const appName = getAppName();
  const appDescription = getAppDescription();
  const metaConfig = getMetaConfig();
  const socialConfig = getSocialConfig();
  
  // Don't render meta tags until we have complete data to prevent flashing
  if (!shouldShowContent) {
    return (
      <Helmet>
        <title>Loading...</title>
      </Helmet>
    );
  }
  
  // Use centralized configuration with prop overrides
  const finalTitle = title || appName;
  const finalDescription = description || appDescription;
  const finalKeywords = keywords || metaConfig.keywords;
  const finalOgImage = ogImage || faviconImage;
  const effectiveIcon = getEffectiveIconUrl(faviconImage, faviconSvgCode);
  
  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name='description' content={finalDescription} />
      <meta name='keywords' content={finalKeywords} />
      <meta name="author" content={metaConfig.author} />
      <meta name="robots" content={metaConfig.robots} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="language" content={metaConfig.language} />
      
      {/* Enhanced Open Graph */}
      <meta property="og:type" content={socialConfig.ogType} />
      <meta property="og:site_name" content={appName} />
      <meta property="og:title" content={socialConfig.ogTitle} />
      <meta property="og:description" content={socialConfig.ogDescription} />
      {socialConfig.ogImage && <meta property="og:image" content={socialConfig.ogImage} />}
      {socialConfig.ogImage && <meta property="og:image:alt" content={`${appName} - ${finalTitle}`} />}
      <meta property="og:locale" content="en_US" />
      
      {/* Enhanced Twitter Card */}
      <meta name="twitter:card" content={socialConfig.twitterCard} />
      <meta name="twitter:site" content={appName} />
      <meta name="twitter:creator" content={appName} />
      <meta name="twitter:title" content={socialConfig.twitterTitle} />
      <meta name="twitter:description" content={socialConfig.twitterDescription} />
      {socialConfig.ogImage && <meta name="twitter:image" content={socialConfig.ogImage} />}
      {socialConfig.ogImage && <meta name="twitter:image:alt" content={`${appName} - ${finalTitle}`} />}
      
      {/* Additional Social Media */}
      <meta property="og:url" content={window.location.href} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={appName} />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content={appName} />
      
    </Helmet>
  );
};

Meta.defaultProps = {
  title: '', // Will be filled by siteName from hook if empty
  description: '', // Will be filled by siteDescription from hook if empty
  keywords: '', // Will be filled by siteKeywords from hook if empty
  useDynamicFavicon: false,
};

export default Meta;
