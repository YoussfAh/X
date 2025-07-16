import { useEffect } from 'react';
import { useGetCarouselSlidesQuery } from '../slices/systemApiSlice';

/**
 * Hero Image Preloader - Preloads hero images as soon as possible
 * This component runs early in the app lifecycle to cache images
 * before the carousel is even rendered
 */
const HeroImagePreloader = () => {
  const { data: systemCarouselSlides } = useGetCarouselSlidesQuery();

  useEffect(() => {
    if (!systemCarouselSlides?.length) return;

    // Preload images immediately using native browser preloading
    const preloadImages = async () => {
      const imageUrls = [];
      
      // Collect all image URLs
      systemCarouselSlides.forEach(slide => {
        if (slide.image) imageUrls.push(slide.image);
        if (slide.mobileImage) imageUrls.push(slide.mobileImage);
      });

      // Create link elements for high priority preloading
      imageUrls.forEach((url, index) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.fetchPriority = index === 0 ? 'high' : 'low';
        document.head.appendChild(link);
      });

      // Also preload using Image constructor for better caching
      const promises = imageUrls.map((url, index) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.fetchPriority = index === 0 ? 'high' : 'low';
          img.src = url;
        });
      });

      try {
        await Promise.allSettled(promises);
        console.log(`HeroImagePreloader: Preloaded ${imageUrls.length} hero images`);
      } catch (error) {
        console.warn('HeroImagePreloader: Some images failed to preload:', error);
      }
    };

    // Start preloading immediately
    preloadImages();
  }, [systemCarouselSlides]);

  // This component doesn't render anything
  return null;
};

export default HeroImagePreloader;
