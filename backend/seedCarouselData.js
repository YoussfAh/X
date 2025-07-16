import SystemSettings from './models/systemSettingsModel.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const seedCarouselData = async () => {
    try {
        await connectDB();

        // Check if carousel data already exists
        const existingCarousel = await SystemSettings.findOne({ key: 'carousel' });
        
        if (existingCarousel) {
            console.log('Carousel data already exists, skipping seed...');
            process.exit(0);
        }

        // Default carousel slides
        const defaultSlides = [
            {
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop&q=80',
                mobileImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=80',
                mobileDisplayMode: 'crop',
                link: '/collections',
                isExternal: false,
                alt: 'Discover Amazing Fitness Collections'
            },
            {
                image: 'https://images.unsplash.com/photo-1549476464-37392f717541?w=1200&auto=format&fit=crop&q=80',
                mobileImage: 'https://images.unsplash.com/photo-1549476464-37392f717541?w=400&auto=format&fit=crop&q=80',
                mobileDisplayMode: 'crop',
                link: '/workout-dashboard',
                isExternal: false,
                alt: 'Track Your Fitness Progress'
            },
            {
                image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1200&auto=format&fit=crop&q=80',
                mobileImage: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
                mobileDisplayMode: 'crop',
                link: '/diet-dashboard',
                isExternal: false,
                alt: 'Nutrition and Diet Plans'
            }
        ];

        // Create a fake admin user ID for seeding (will be replaced by actual admin)
        const adminUserId = '507f1f77bcf86cd799439011'; // Example ObjectId

        // Create carousel settings
        const carouselSettings = new SystemSettings({
            key: 'carousel',
            carouselSlides: defaultSlides,
            lastUpdatedBy: adminUserId
        });

        await carouselSettings.save();

        // Also create default carousel settings (timing, etc.)
        const existingSettings = await SystemSettings.findOne({ key: 'carouselSettings' });
        
        if (!existingSettings) {
            const defaultCarouselSettings = new SystemSettings({
                key: 'carouselSettings',
                carouselSettings: {
                    autoPlayInterval: 5000,
                    transitionDuration: 200
                },
                lastUpdatedBy: adminUserId
            });

            await defaultCarouselSettings.save();
        }

        console.log('✅ Default carousel data seeded successfully');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding carousel data:', error);
        process.exit(1);
    }
};

seedCarouselData();
