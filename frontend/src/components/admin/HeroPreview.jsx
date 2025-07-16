import React, { memo, lazy, Suspense, useMemo } from 'react';

const ComponentLoader = React.memo(() => (
    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
));

const ClassicHeroTemplate = lazy(() => import('../hero/templates/ClassicHeroTemplate'));
const MinimalHeroTemplate = lazy(() => import('../hero/templates/MinimalHeroTemplate'));
const OriginalHeroTemplate = lazy(() => import('../hero/templates/OriginalHeroTemplate'));
const CustomHeroTemplate = lazy(() => import('../hero/templates/CustomHeroTemplate'));
const ModernTechHeroTemplate = lazy(() => import('../hero/templates/ModernTechHeroTemplate'));
const CorporateTechHeroTemplate = lazy(() => import('../hero/templates/CorporateTechHeroTemplate'));
const CryptoHeroTemplate = lazy(() => import('../hero/templates/CryptoHeroTemplate'));

const HeroPreview = memo(({ heroSettings, userInfo, forceRefreshKey }) => {
    const selectedTemplate = heroSettings?.selectedTemplate || 'original';
    const isEnabled = heroSettings?.enabled !== false;
    const templateData = heroSettings?.templates?.[selectedTemplate];

    const TemplateComponent = useMemo(() => {
        if (!isEnabled || !heroSettings) return null;
        
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
    }, [selectedTemplate, isEnabled, heroSettings]);

    const componentKey = useMemo(() => {
        if (!templateData?.content) return `empty-${forceRefreshKey}`;
        const keyData = {
            template: selectedTemplate,
            title: templateData.content.title,
            subtitle: templateData.content.subtitle,
            buttonText: templateData.content.buttonText,
            refreshKey: forceRefreshKey
        };
        return `hero-preview-${JSON.stringify(keyData).length}-${forceRefreshKey}`;
    }, [templateData, selectedTemplate, forceRefreshKey]);

    if (!heroSettings) {
        return (
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ComponentLoader />
            </div>
        );
    }

    if (!isEnabled || !TemplateComponent || !templateData) {
        return (
             <div className="text-center py-5 d-flex align-items-center justify-content-center" style={{minHeight: '400px'}}>
                <div>
                    <h4>Hero Section Disabled</h4>
                    <p className="text-muted">Enable the hero section to see a preview.</p>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<ComponentLoader />}>
            <div style={{border: '1px solid #dee2e6', borderRadius: '0.375rem', overflow: 'hidden'}}>
                <TemplateComponent 
                    key={componentKey}
                    templateData={templateData}
                    userInfo={userInfo}
                    forceRefreshKey={forceRefreshKey}
                    isPreview={true}
                />
            </div>
        </Suspense>
    );
});

HeroPreview.displayName = 'HeroPreview';

export default HeroPreview; 