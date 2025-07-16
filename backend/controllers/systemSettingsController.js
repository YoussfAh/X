import asyncHandler from '../middleware/asyncHandler.js';
import SystemSettings from '../models/systemSettingsModel.js';

// Helper function to get default templates
const getDefaultTemplates = () => ({
    original: {
        code: 'original',
        name: 'Original Hero',
        description: 'Your beautiful original hero section with all features and animations',
        content: {
            title: 'TRANSFORM YOUR FITNESS JOURNEY',
            subtitle: 'Join our elite community designed to transform your body and mindset with science-backed workouts, personalized nutrition plans, and cutting-edge progress tracking.',
            buttonText: 'Start Workout',
            buttonLink: '/workout',
            backgroundImage: '',
            showStats: false,
            stats: []
        }
    },
    classic: {
        code: 'classic',
        name: 'Classic Hero',
        description: 'Traditional hero section with text and background',
        content: {
            title: 'TRANSFORM YOUR FITNESS JOURNEY',
            subtitle: 'Join our elite community designed to transform your body and mindset with science-backed workouts, personalized nutrition plans, and cutting-edge progress tracking.',
            buttonText: 'Get Started Now',
            buttonLink: '/collections',
            backgroundImage: '',
            showStats: false,
            stats: []
        }
    },
    minimal: {
        code: 'minimal',
        name: 'Minimal Hero',
        description: 'Clean and simple hero section',
        content: {
            title: 'Achieve Greatness',
            subtitle: 'Your fitness journey starts here.',
            buttonText: 'Explore',
            buttonLink: '/collections',
            backgroundImage: '',
            showStats: false,
            stats: []
        }
    },
    custom: {
        code: 'custom',
        name: 'Custom Hero',
        description: 'Fully customizable hero with editable content from admin panel',
        content: {
            title: 'TRANSFORM YOUR FITNESS JOURNEY',
            subtitle: 'Achieve your goals with our personalized fitness programs designed to help you succeed.',
            buttonText: 'Start Your Journey',
            buttonLink: '/workout',
            backgroundImage: '',
            showStats: false,
            primaryButton: {
                text: 'Start Your Journey',
                link: '/workout'
            },
            secondaryButton: {
                text: 'Learn More',
                link: '/about'
            },
            stats: []
        }
    },
    'modern-tech': {
        code: 'modern-tech',
        name: 'Modern Tech Hero',
        description: 'A dark, modern hero section with a tech-inspired design, featuring animated backgrounds and dual buttons.',
        content: {
            topText: 'Ignite Your Full Potential ->',
            title: 'Forge Your Ultimate Physique',
            subtitle: 'Explore personalized workout plans where cutting-edge technology merges with elite fitness expertise.',
            primaryButton: {
                text: 'Start Workout',
                link: '/workout'
            },
            secondaryButton: {
                text: 'Learn More',
                link: '/about'
            },
            backgroundImage: '',
            showStats: true,
            stats: [
                { label: 'Workouts', value: '1,200+', icon: 'dumbbell' },
                { label: 'Members', value: '5,000+', icon: 'users' },
                { label: 'Programs', value: '50+', icon: 'list-check' },
                { label: 'Experts', value: '15+', icon: 'user-tie' }
            ]
        }
    },
    'corporate-tech': {
        code: 'corporate-tech',
        name: 'Corporate Tech Hero',
        description: 'A polished, corporate-style hero section for tech companies.',
        content: {
            topTagline: 'Welcome to GRINDX',
            titleLine1: 'Transform Your',
            titleLine2Highlighted: 'Workout Strategy',
            titleLine3: 'with the Power of AI',
            subtitle: 'Boost your performance, increase ROI on your effort, and unlock data-driven insights with our advanced fitness solutions.',
            primaryButton: { text: 'Get Started', link: '/register' },
            socialProofStat: { value: '40,000+', label: 'Happy members and counting' },
            socialProofLogos: [
                'https://res.cloudinary.com/dov60yxxk/image/upload/v1719299793/spotify-logo_a2z8pe.png',
                'https://res.cloudinary.com/dov60yxxk/image/upload/v1719299792/Allianz-logo_krvx8i.png',
                'https://res.cloudinary.com/dov60yxxk/image/upload/v1719299793/loreal-logo_qw5rb6.png',
                'https://res.cloudinary.com/dov60yxxk/image/upload/v1719299793/kelloggs-logo_zcyofg.png',
                'https://res.cloudinary.com/dov60yxxk/image/upload/v1719299793/netflix-logo_yvxiq3.png'
            ]
        }
    },
    'crypto-hero': {
        code: 'crypto-hero',
        name: 'Crypto Hero',
        description: 'A modern, crypto-themed hero section with a 3D graphic.',
        content: {
            tagline: 'Introducing our new most advanced Web3 hosting',
            titleLine1: 'Build on',
            titleLine2: 'decentralized',
            titleLine3Highlighted: 'crypto protocol',
            subtitle: 'Nebula Core is a leading provider of cutting-edge decentralized solutions, powering the next generation of NFT, GameFi, and Metaverse projects.',
            buttonText: 'Schedule demo',
            buttonLink: '/contact',
            graphicUrl: 'https://i.imgur.com/gS39Y9w.png'
        }
    }
});

// Helper function to merge saved templates with defaults
const mergeWithDefaultTemplates = (savedTemplates) => {
    const defaults = getDefaultTemplates();
    const merged = { ...defaults };

    // Override with saved data where it exists
    Object.keys(savedTemplates).forEach(templateCode => {
        const savedTemplate = savedTemplates[templateCode];
        if (savedTemplate && savedTemplate.content) {
            merged[templateCode] = savedTemplate;
        }
    });

    return merged;
};

// @desc    Get system carousel slides
// @route   GET /api/system-settings/carousel
// @access  Public
const getCarouselSlides = asyncHandler(async (req, res) => {
    // Build query based on tenant context
    const query = { key: 'carousel' };
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    } else {
        // For main app (no tenant), look for documents without tenantId
        query.tenantId = { $exists: false };
    }

    const systemSettings = await SystemSettings.findOne(query);

    // Set cache headers for hero image URLs (5 minutes cache, revalidate)
    res.set({
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'ETag': `"carousel-${req.tenantId || 'main'}-${systemSettings?.updatedAt?.getTime() || Date.now()}"`,
        'Vary': 'Accept-Encoding'
    });

    if (systemSettings && systemSettings.carouselSlides) {
        // Filter carousel slides by tenantId to ensure data isolation
        const tenantSlides = systemSettings.carouselSlides.filter(slide => {
            if (req.tenantId) {
                return slide.tenantId && slide.tenantId.toString() === req.tenantId.toString();
            } else {
                return !slide.tenantId; // Main app slides
            }
        });
        res.json(tenantSlides);
    } else {
        // If no carousel settings exist yet, return an empty array
        res.json([]);
    }
});

// @desc    Update system carousel slides
// @route   PUT /api/system-settings/carousel
// @access  Private/Admin
const updateCarouselSlides = asyncHandler(async (req, res) => {
    const { carouselSlides } = req.body;

    // Build query based on tenant context
    const query = { key: 'carousel' };
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    } else {
        query.tenantId = { $exists: false };
    }

    let systemSettings = await SystemSettings.findOne(query);

    // Add tenantId to each slide for proper data isolation
    const slidesWithTenantId = carouselSlides.map(slide => ({
        ...slide,
        tenantId: req.tenantId || null
    }));

    if (systemSettings) {
        // Update existing settings
        systemSettings.carouselSlides = slidesWithTenantId;
        systemSettings.lastUpdatedBy = req.user._id;
        if (req.tenantId && !systemSettings.tenantId) {
            systemSettings.tenantId = req.tenantId;
        }
    } else {
        // Create new settings if they don't exist
        systemSettings = new SystemSettings({
            key: 'carousel',
            carouselSlides: slidesWithTenantId,
            lastUpdatedBy: req.user._id,
            tenantId: req.tenantId || undefined,
        });
    }

    const updatedSettings = await systemSettings.save();
    
    // Return only the slides for this tenant
    const tenantSlides = updatedSettings.carouselSlides.filter(slide => {
        if (req.tenantId) {
            return slide.tenantId && slide.tenantId.toString() === req.tenantId.toString();
        } else {
            return !slide.tenantId;
        }
    });
    
    res.json(tenantSlides);
});

// @desc    Get main hero section settings
// @route   GET /api/system-settings/main-hero
// @access  Public
const getMainHeroSettings = asyncHandler(async (req, res) => {
    try {
        // Build query based on tenant context
        const query = { key: 'mainHero' };
        if (req.tenantId) {
            query.tenantId = req.tenantId;
        } else {
            query.tenantId = { $exists: false };
        }

        const systemSettings = await SystemSettings.findOne(query);

        // Set cache headers for hero settings (5 minutes cache, revalidate)
        res.set({
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
            'ETag': `"main-hero-${req.tenantId || 'main'}-${systemSettings?.updatedAt?.getTime() || Date.now()}"`,
            'Vary': 'Accept-Encoding'
        });

        if (!systemSettings || !systemSettings.mainHeroSettings) {
            // Return default settings with FULL template data, not just titles
            const defaultTemplates = getDefaultTemplates();
            return res.json({
                enabled: true,
                selectedTemplate: 'original',
                templates: defaultTemplates, // Always return full templates
                timestamp: Date.now()
            });
        }

        const heroSettings = systemSettings.mainHeroSettings;
        const templates = heroSettings.templates || {};

        // ALWAYS ensure we have all templates by merging with defaults
        const mergedTemplates = mergeWithDefaultTemplates(templates);

        res.json({
            enabled: heroSettings.enabled !== false,
            selectedTemplate: heroSettings.selectedTemplate || 'original',
            templates: mergedTemplates, // Always return full templates
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error fetching main hero settings:', error);
        res.status(500).json({ message: 'Server error fetching hero settings' });
    }
});

// @desc    Update main hero section settings
// @route   PUT /api/system-settings/main-hero
// @access  Private/Admin
const updateMainHeroSettings = asyncHandler(async (req, res) => {
    const { enabled, selectedTemplate, templates } = req.body;

    // Build query based on tenant context
    const query = { key: 'mainHero' };
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    } else {
        query.tenantId = { $exists: false };
    }

    let systemSettings = await SystemSettings.findOne(query);

    if (systemSettings) {
        // Initialize mainHeroSettings if it doesn't exist
        if (!systemSettings.mainHeroSettings) {
            systemSettings.mainHeroSettings = {
                enabled: true,
                selectedTemplate: 'original',
                templates: getDefaultTemplates()
            };
        }

        // Update existing settings
        systemSettings.mainHeroSettings.enabled = enabled !== undefined ? enabled : systemSettings.mainHeroSettings.enabled;
        systemSettings.mainHeroSettings.selectedTemplate = selectedTemplate || systemSettings.mainHeroSettings.selectedTemplate;

        // Only update templates if explicitly provided
        if (templates) {
            systemSettings.mainHeroSettings.templates = templates;
        }
        // If no templates exist and none provided, use defaults
        else if (!systemSettings.mainHeroSettings.templates || Object.keys(systemSettings.mainHeroSettings.templates).length === 0) {
            systemSettings.mainHeroSettings.templates = getDefaultTemplates();
        }

        systemSettings.lastUpdatedBy = req.user._id;
        systemSettings.markModified('mainHeroSettings');
    } else {
        // Create new settings with tenant support
        systemSettings = new SystemSettings({
            key: 'mainHero',
            tenantId: req.tenantId || undefined,
            mainHeroSettings: {
                enabled: enabled !== undefined ? enabled : true,
                selectedTemplate: selectedTemplate || 'original',
                templates: templates || getDefaultTemplates()
            },
            lastUpdatedBy: req.user._id,
        });
    }

    const updatedSettings = await systemSettings.save();
    res.json(updatedSettings.mainHeroSettings);
});

// @desc    Get specific hero template
// @route   GET /api/system-settings/main-hero/template/:templateCode
// @access  Public
const getHeroTemplate = asyncHandler(async (req, res) => {
    const { templateCode } = req.params;

    // Build query based on tenant context
    const query = { key: 'mainHero' };
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    } else {
        query.tenantId = { $exists: false };
    }

    let systemSettings = await SystemSettings.findOne(query);

    // Get the current hero settings (includes default templates)
    const heroSettings = await getMainHeroSettingsInternal(req.tenantId);

    if (heroSettings.templates[templateCode]) {
        res.json(heroSettings.templates[templateCode]);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

// Get main hero settings
const getMainHeroSettingsInternal = async (tenantId = null) => {
    try {
        // Build query based on tenant context
        const query = { key: 'mainHero' };
        if (tenantId) {
            query.tenantId = tenantId;
        } else {
            query.tenantId = { $exists: false };
        }

        const systemSettings = await SystemSettings.findOne(query);

        if (!systemSettings?.mainHeroSettings) {
            return {
                enabled: true,
                selectedTemplate: 'original',
                templates: getDefaultTemplates()
            };
        }

        const templates = systemSettings.mainHeroSettings.templates || {};

        // If no templates saved, return defaults
        if (Object.keys(templates).length === 0) {
            return {
                enabled: systemSettings.mainHeroSettings.enabled !== false,
                selectedTemplate: systemSettings.mainHeroSettings.selectedTemplate || 'original',
                templates: getDefaultTemplates()
            };
        }

        // Merge with defaults to ensure all templates exist
        const mergedTemplates = mergeWithDefaultTemplates(templates);

        return {
            enabled: systemSettings.mainHeroSettings.enabled !== false,
            selectedTemplate: systemSettings.mainHeroSettings.selectedTemplate || 'original',
            templates: mergedTemplates
        };
    } catch (error) {
        console.error('Error in getMainHeroSettingsInternal:', error);
        return {
            enabled: true,
            selectedTemplate: 'original',
            templates: getDefaultTemplates()
        };
    }
};

// @desc    Update specific hero template
// @route   PUT /api/system-settings/main-hero/template/:templateCode
// @access  Private/Admin
const updateHeroTemplate = asyncHandler(async (req, res) => {
    const { templateCode } = req.params;
    const templateData = req.body;

    try {
        // Build query based on tenant context
        const query = { key: 'mainHero' };
        if (req.tenantId) {
            query.tenantId = req.tenantId;
        } else {
            query.tenantId = { $exists: false };
        }

        let systemSettings = await SystemSettings.findOne(query);

        if (!systemSettings) {
            systemSettings = new SystemSettings({
                key: 'mainHero',
                tenantId: req.tenantId || undefined,
                mainHeroSettings: {
                    enabled: true,
                    selectedTemplate: 'original',
                    templates: {}
                },
                lastUpdatedBy: req.user._id
            });
        }

        // Initialize mainHeroSettings if it doesn't exist
        if (!systemSettings.mainHeroSettings) {
            systemSettings.mainHeroSettings = {
                enabled: true,
                selectedTemplate: 'original',
                templates: {}
            };
        }

        // Ensure templates object exists
        if (!systemSettings.mainHeroSettings.templates) {
            systemSettings.mainHeroSettings.templates = {};
        }

        // Save the template data directly to the object
        systemSettings.mainHeroSettings.templates[templateCode] = templateData;

        // CRITICAL: Mark the nested object as modified for MongoDB
        systemSettings.markModified('mainHeroSettings.templates');
        systemSettings.markModified('mainHeroSettings');
        systemSettings.lastUpdatedBy = req.user._id;

        const savedSettings = await systemSettings.save();

        // Return the saved template
        const returnData = savedSettings.mainHeroSettings.templates[templateCode];

        res.json(returnData);
    } catch (error) {
        console.error('Error saving template:', error);
        res.status(500).json({ message: 'Failed to save template', error: error.message });
    }
});

// @desc    Get general app settings
// @route   GET /api/system-settings/general
// @access  Public
const getGeneralSettings = asyncHandler(async (req, res) => {
    let systemSettings = await SystemSettings.findOne({ key: 'general' });

    if (systemSettings) {
        res.json(systemSettings.appSettings);
    } else {
        // Return default settings if none exist
        const defaultSettings = {
            siteName: 'GRINDX',
            siteDescription: 'We offer the best exercises for optimal fitness',
            siteKeywords: 'fitness, exercises, health, workout, gym, nutrition',
            headerImage: '',
            faviconImage: '',
            faviconSvgCode: '',
            preserveIconRatio: true,
            pwaIconWithoutBackground: false,
            pwaIcon: '',
            pwaShortName: 'GRINDX',
            pwaThemeColor: '#000000',
            pwaBackgroundColor: '#ffffff',
            pwaSplashScreenImage: '',
            ogImage: '',
            colorScheme: {
                primaryColor: '#4F46E5',
                secondaryColor: '#7C3AED'
            }
        };
        res.json(defaultSettings);
    }
});

// @desc    Update general app settings
// @route   PUT /api/system-settings/general
// @access  Private/Admin
const updateGeneralSettings = asyncHandler(async (req, res) => {
    console.log('Received settings update request:', req.body);
    const { 
        siteName, 
        siteDescription, 
        siteKeywords, 
        headerImage, 
        faviconImage, 
        faviconSvgCode, 
        preserveIconRatio, 
        pwaIconWithoutBackground,
        pwaIcon,
        pwaShortName, 
        pwaThemeColor, 
        pwaBackgroundColor, 
        pwaSplashScreenImage,
        ogImage, 
        colorScheme 
    } = req.body;
    console.log('Extracted faviconSvgCode:', faviconSvgCode ? 'Present (length: ' + faviconSvgCode.length + ')' : 'Not present');

    let systemSettings = await SystemSettings.findOne({ key: 'general' });

    if (systemSettings) {
        systemSettings.appSettings = {
            siteName: siteName || 'GRINDX',
            siteDescription: siteDescription || 'We offer the best exercises for optimal fitness',
            siteKeywords: siteKeywords || 'fitness, exercises, health, workout, gym, nutrition',
            headerImage: headerImage || '',
            faviconImage: faviconImage || '',
            faviconSvgCode: faviconSvgCode || '',
            preserveIconRatio: preserveIconRatio !== undefined ? preserveIconRatio : true,
            pwaIconWithoutBackground: pwaIconWithoutBackground !== undefined ? pwaIconWithoutBackground : false,
            pwaIcon: pwaIcon || '',
            pwaShortName: pwaShortName || 'GRINDX',
            pwaThemeColor: pwaThemeColor || '#000000',
            pwaBackgroundColor: pwaBackgroundColor || '#ffffff',
            pwaSplashScreenImage: pwaSplashScreenImage || '',
            ogImage: ogImage || '',
            colorScheme: colorScheme || {
                primaryColor: '#4F46E5',
                secondaryColor: '#7C3AED'
            }
        };
        systemSettings.lastUpdatedBy = req.user._id;
    } else {
        // Create new settings if they don't exist
        systemSettings = new SystemSettings({
            key: 'general',
            appSettings: {
                siteName: siteName || 'GRINDX',
                siteDescription: siteDescription || 'We offer the best exercises for optimal fitness',
                siteKeywords: siteKeywords || 'fitness, exercises, health, workout, gym, nutrition',
                headerImage: headerImage || '',
                faviconImage: faviconImage || '',
                faviconSvgCode: faviconSvgCode || '',
                preserveIconRatio: preserveIconRatio !== undefined ? preserveIconRatio : true,
                pwaIconWithoutBackground: pwaIconWithoutBackground !== undefined ? pwaIconWithoutBackground : false,
                pwaIcon: pwaIcon || '',
                pwaShortName: pwaShortName || 'GRINDX',
                pwaThemeColor: pwaThemeColor || '#000000',
                pwaBackgroundColor: pwaBackgroundColor || '#ffffff',
                pwaSplashScreenImage: pwaSplashScreenImage || '',
                ogImage: ogImage || '',
                colorScheme: colorScheme || {
                    primaryColor: '#4F46E5',
                    secondaryColor: '#7C3AED'
                }
            },
            lastUpdatedBy: req.user._id,
        });
    }

    const updatedSettings = await systemSettings.save();
    res.json(updatedSettings.appSettings);
});

// @desc    Get carousel settings (speed, timing, etc.)
// @route   GET /api/system-settings/carousel-settings
// @access  Public
const getCarouselSettings = asyncHandler(async (req, res) => {
    // Build query based on tenant context
    const query = { key: 'carouselSettings' };
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    } else {
        // For main app (no tenant), look for documents without tenantId
        query.tenantId = { $exists: false };
    }

    const systemSettings = await SystemSettings.findOne(query);

    if (systemSettings && systemSettings.carouselSettings) {
        res.json(systemSettings.carouselSettings);
    } else {
        // Return default settings if none exist
        const defaultSettings = {
            autoPlayInterval: 5000,     // 5 seconds
            transitionDuration: 200     // 200ms
        };
        res.json(defaultSettings);
    }
});

// @desc    Update carousel settings
// @route   PUT /api/system-settings/carousel-settings
// @access  Private/Admin
const updateCarouselSettings = asyncHandler(async (req, res) => {
    const { autoPlayInterval, transitionDuration } = req.body;

    // Validate values
    const validatedAutoPlayInterval = Math.max(1000, Math.min(30000, autoPlayInterval || 5000));
    const validatedTransitionDuration = Math.max(50, Math.min(3000, transitionDuration || 200));

    // Build query based on tenant context
    const query = { key: 'carouselSettings' };
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    } else {
        query.tenantId = { $exists: false };
    }

    let systemSettings = await SystemSettings.findOne(query);

    if (systemSettings) {
        systemSettings.carouselSettings = {
            autoPlayInterval: validatedAutoPlayInterval,
            transitionDuration: validatedTransitionDuration
        };
        systemSettings.lastUpdatedBy = req.user._id;
        if (req.tenantId && !systemSettings.tenantId) {
            systemSettings.tenantId = req.tenantId;
        }
    } else {
        // Create new settings if they don't exist
        systemSettings = new SystemSettings({
            key: 'carouselSettings',
            carouselSettings: {
                autoPlayInterval: validatedAutoPlayInterval,
                transitionDuration: validatedTransitionDuration
            },
            lastUpdatedBy: req.user._id,
            tenantId: req.tenantId || undefined,
        });
    }

    const updatedSettings = await systemSettings.save();
    res.json(updatedSettings.carouselSettings);
});

// @desc    Get dynamic PWA manifest
// @route   GET /api/system-settings/manifest
// @access  Public
const getDynamicManifest = asyncHandler(async (req, res) => {
    let systemSettings = await SystemSettings.findOne({ key: 'general' });
    
    const defaultManifest = {
        short_name: 'App',
        name: 'App',
        description: 'the App for the best fitness',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [] // Default to empty, will be populated dynamically
    };

    if (systemSettings && systemSettings.appSettings) {
        const settings = systemSettings.appSettings;
        
        // Update manifest with admin settings
        const dynamicManifest = {
            ...defaultManifest,
            short_name: settings.pwaShortName || defaultManifest.short_name,
            name: settings.pwaShortName ? `${settings.pwaShortName} - Fitness App` : defaultManifest.name, // Use pwaShortName for full name
            description: settings.siteDescription || defaultManifest.description,
            theme_color: settings.pwaThemeColor || defaultManifest.theme_color,
            background_color: settings.pwaBackgroundColor || defaultManifest.background_color,
            
            // Dynamically set icons based on pwaIcon from settings
            icons: settings.pwaIcon ? [
                {
                    src: settings.pwaIcon,
                    sizes: '192x192',
                    type: 'image/svg+xml', // Assuming SVG as per frontend setup
                    purpose: settings.pwaIconWithoutBackground ? 'maskable' : 'any'
                },
                {
                    src: settings.pwaIcon,
                    sizes: '512x512',
                    type: 'image/svg+xml', // Assuming SVG
                    purpose: settings.pwaIconWithoutBackground ? 'maskable' : 'any'
                }
            ] : defaultManifest.icons // Fallback to empty if no pwaIcon
        };

        res.json(dynamicManifest);
    } else {
        // If no settings exist, return the default manifest
        res.json(defaultManifest);
    }
});

// @desc    Get hero images for Service Worker caching
// @route   GET /api/system/hero-images
// @access  Public
const getHeroImagesForCache = asyncHandler(async (req, res) => {
    try {
        // Build queries based on tenant context
        const carouselQuery = { key: 'carousel' };
        const heroQuery = { key: 'mainHero' };
        
        if (req.tenantId) {
            carouselQuery.tenantId = req.tenantId;
            heroQuery.tenantId = req.tenantId;
        } else {
            carouselQuery.tenantId = { $exists: false };
            heroQuery.tenantId = { $exists: false };
        }

        // Get carousel slides for this tenant
        const carouselSettings = await SystemSettings.findOne(carouselQuery);
        
        // Get main hero settings for this tenant
        const heroSettings = await SystemSettings.findOne(heroQuery);
        
        const heroImages = [];
        
        // Extract images from carousel slides (filter by tenantId)
        if (carouselSettings?.carouselSlides) {
            carouselSettings.carouselSlides.forEach(slide => {
                // Additional filtering to ensure we only get tenant-specific slides
                const slideIsForThisTenant = req.tenantId ? 
                    (slide.tenantId && slide.tenantId.toString() === req.tenantId.toString()) :
                    !slide.tenantId;
                    
                if (slideIsForThisTenant) {
                    if (slide.image) heroImages.push(slide.image);
                    if (slide.mobileImage) heroImages.push(slide.mobileImage);
                }
            });
        }
        
        // Extract images from hero templates
        if (heroSettings?.mainHeroSettings?.templates) {
            Object.values(heroSettings.mainHeroSettings.templates).forEach(template => {
                if (template.content?.backgroundImage) {
                    heroImages.push(template.content.backgroundImage);
                }
                if (template.content?.graphicUrl) {
                    heroImages.push(template.content.graphicUrl);
                }
                // Extract logo URLs from social proof
                if (template.content?.socialProofLogos && Array.isArray(template.content.socialProofLogos)) {
                    heroImages.push(...template.content.socialProofLogos);
                }
            });
        }
        
        // Remove duplicates and empty values
        const uniqueHeroImages = [...new Set(heroImages.filter(Boolean))];
        
        // Set aggressive cache headers for hero images list (30 minutes)
        res.set({
            'Cache-Control': 'public, max-age=1800, stale-while-revalidate=300',
            'ETag': `"hero-images-${req.tenantId || 'main'}-${Date.now()}"`,
            'Vary': 'Accept-Encoding'
        });
        
        res.json({
            heroImages: uniqueHeroImages,
            count: uniqueHeroImages.length,
            timestamp: Date.now(),
            tenantId: req.tenantId || null
        });
    } catch (error) {
        console.error('Error fetching hero images for cache:', error);
        res.status(500).json({ message: 'Server error fetching hero images' });
    }
});

export {
    getCarouselSlides,
    updateCarouselSlides,
    getCarouselSettings,
    updateCarouselSettings,
    getMainHeroSettings,
    updateMainHeroSettings,
    getHeroTemplate,
    updateHeroTemplate,
    getGeneralSettings,
    updateGeneralSettings,
    getDynamicManifest,
    getHeroImagesForCache
};
