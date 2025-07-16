import mongoose from 'mongoose';

const carouselSlideSchema = mongoose.Schema(
    {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
        image: {
            type: String,
            required: true,
        },
        mobileImage: {
            type: String,
            required: false,
        },
        mobileDisplayMode: {
            type: String,
            enum: ['crop', 'fit'],
            default: 'crop',
        },
        link: {
            type: String,
            required: true,
        },
        isExternal: {
            type: Boolean,
            default: false,
        },
        alt: {
            type: String,
            required: true,
        }
    },
    { _id: false }
);

const heroStatSchema = mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
        },
        value: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        }
    },
    { _id: false }
);

const heroTemplateSchema = mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        content: {
            title: {
                type: String,
                required: true,
            },
            subtitle: {
                type: String,
                required: true,
            },
            buttonText: {
                type: String,
                required: true,
            },
            buttonLink: {
                type: String,
                required: true,
            },
            backgroundImage: {
                type: String,
                default: '',
            },
            showStats: {
                type: Boolean,
                default: false,
            },
            stats: [heroStatSchema],
            // New button structure for custom templates
            primaryButton: {
                text: {
                    type: String,
                    required: false,
                },
                link: {
                    type: String,
                    required: false,
                }
            },
            secondaryButton: {
                text: {
                    type: String,
                    required: false,
                },
                link: {
                    type: String,
                    required: false,
                }
            }
        }
    },
    { _id: false }
);

const mainHeroSettingsSchema = mongoose.Schema(
    {
        enabled: {
            type: Boolean,
            default: true,
        },
        selectedTemplate: {
            type: String,
            default: 'classic',
        },
        templates: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { _id: false, strict: false }
);

const systemSettingsSchema = mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: false, // Optional to support main app settings
            index: true
        },
        carouselSlides: [carouselSlideSchema],
        mainHeroSettings: mainHeroSettingsSchema,
        appSettings: {
            siteName: {
                type: String,
                default: 'GRINDX'
            },
            siteDescription: {
                type: String,
                default: 'We offer the best exercises for optimal fitness'
            },
            siteKeywords: {
                type: String,
                default: 'fitness, exercises, health, workout, gym, nutrition'
            },
            headerImage: {
                type: String,
                default: ''
            },
            faviconImage: {
                type: String,
                default: ''
            },
            faviconSvgCode: {
                type: String,
                default: ''
            },
            customTabFavicon: {
                type: String,
                default: ''
            },
            customTabFaviconSvg: {
                type: String,
                default: ''
            },
            preserveIconRatio: {
                type: Boolean,
                default: true
            },
            pwaShortName: {
                type: String,
                default: 'GRINDX'
            },
            pwaIcon: {
                type: String,
                default: ''
            },
            pwaIconWithoutBackground: {
                type: Boolean,
                default: false
            },
            pwaThemeColor: {
                type: String,
                default: '#000000'
            },
            pwaBackgroundColor: {
                type: String,
                default: '#ffffff'
            },
            pwaSplashScreenImage: {
                type: String,
                default: ''
            },
            ogImage: {
                type: String,
                default: ''
            },
            showHeroSection: {
                type: Boolean,
                default: true
            },
            colorScheme: {
                primaryColor: {
                    type: String,
                    default: '#4F46E5' // Indigo
                },
                secondaryColor: {
                    type: String,
                    default: '#7C3AED' // Purple
                }
            }
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        carouselSettings: {
            autoPlayInterval: {
                type: Number,
                default: 5000, // 5 seconds in milliseconds
                min: 1000,     // Minimum 1 second
                max: 30000     // Maximum 30 seconds
            },
            transitionDuration: {
                type: Number,
                default: 200,  // 200ms transition
                min: 50,       // Minimum 50ms
                max: 3000      // Maximum 3 seconds
            }
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index to ensure uniqueness of key per tenant
systemSettingsSchema.index({ key: 1, tenantId: 1 }, { unique: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings; 