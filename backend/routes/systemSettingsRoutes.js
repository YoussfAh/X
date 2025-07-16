import express from 'express';
import {
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
} from '../controllers/systemSettingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { identifyTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Apply tenant identification to all routes
router.use(identifyTenant);

router.route('/carousel')
    .get(getCarouselSlides)
    .put(protect, admin, updateCarouselSlides);

router.route('/carousel-settings')
    .get(getCarouselSettings)
    .put(protect, admin, updateCarouselSettings);

router.route('/main-hero')
    .get(getMainHeroSettings)
    .put(protect, admin, updateMainHeroSettings);

router.route('/main-hero/template/:templateCode')
    .get(getHeroTemplate)
    .put(protect, admin, updateHeroTemplate);

router.route('/general')
    .get(getGeneralSettings)
    .put(protect, admin, updateGeneralSettings);

router.route('/manifest')
    .get(getDynamicManifest);

router.route('/manifest.json')
    .get(getDynamicManifest);

// Hero images endpoint for Service Worker caching
router.route('/hero-images')
    .get(getHeroImagesForCache);

export default router;
