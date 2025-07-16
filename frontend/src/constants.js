// Get the API URL based on environment
const getApiUrl = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const envApiUrl = process.env.REACT_APP_API_URL;

  if (isDevelopment) {
    console.log('Development mode - using localhost');
    return 'http://localhost:5000'; // Development default (using 5000 to match backend)
  } else {
    // In production, try to determine the API URL
    if (envApiUrl) {
      console.log('Production mode - using env API URL:', envApiUrl);
      return envApiUrl;
    }
    
    // For Vercel deployments, try to use the current domain
    if (typeof window !== 'undefined') {
      const currentDomain = window.location.origin;
      console.log('Production mode - using current domain:', currentDomain);
      return currentDomain;
    }
    
    // Fallback to default Vercel URL
    const fallbackUrl = 'https://pro-g.vercel.app';
    console.log('Production mode - using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
  // return 'http://192.168.1.2:5000';
};

export const BASE_URL = getApiUrl();
export const PRODUCTS_URL = '/api/products';
export const USERS_URL = '/api/users';
export const ORDERS_URL = '/api/orders';
export const PAYPAL_URL = '/api/config/paypal';
export const COLLECTIONS_URL = '/api/collections';
export const WORKOUT_URL = '/api/workout';
export const DIET_URL = '/api/diet';
export const SLEEP_URL = '/api/sleep';
export const WEIGHT_URL = '/api/weight';
export const QUIZ_URL = '/api/quiz';

// Note: UI Configuration (site name, header image, hero section visibility)
// is now managed through the system settings API instead of environment variables.
// Use the useAppSettings hook to access these values.
