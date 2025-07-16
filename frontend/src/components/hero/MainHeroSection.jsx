import React, { memo, useMemo, useEffect, useState } from 'react';
import { useGetMainHeroSettingsQuery } from '../../slices/systemApiSlice';

// Import all templates directly for instant loading
import ClassicHeroTemplate from './templates/ClassicHeroTemplate';
import MinimalHeroTemplate from './templates/MinimalHeroTemplate';
import OriginalHeroTemplate from './templates/OriginalHeroTemplate';
import CustomHeroTemplate from './templates/CustomHeroTemplate';
import ModernTechHeroTemplate from './templates/ModernTechHeroTemplate';
import CorporateTechHeroTemplate from './templates/CorporateTechHeroTemplate';
import CryptoHeroTemplate from './templates/CryptoHeroTemplate';

const MainHeroSection = memo(({ userInfo }) => {
    const [forceRefreshKey, setForceRefreshKey] = useState(0);
    
    const { 
        data: heroSettings, 
        error
    } = useGetMainHeroSettingsQuery(undefined, {
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        keepUnusedDataFor: 600, // 10-minute cache
    });

    // Update refresh key when data changes
    useEffect(() => {
        if (heroSettings) {
            setForceRefreshKey(prev => prev + 1);
        }
    }, [heroSettings]);

    // Get selected template and check if enabled
    const selectedTemplate = heroSettings?.selectedTemplate || 'original';
    const isEnabled = heroSettings?.enabled !== false;
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

    // Don't render anything if disabled or no data - instant return
    if (!isEnabled || !TemplateComponent || !templateData) {
        return null;
    }

    return (
        <TemplateComponent 
            key={componentKey}
            templateData={templateData}
            userInfo={userInfo}
            forceRefreshKey={forceRefreshKey}
        />
    );
});

MainHeroSection.displayName = 'MainHeroSection';

export default MainHeroSection; 