// Device detection utility for PWA install prompt
// This helps determine if the install prompt should be shown

export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check for mobile devices
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
  
  // Check screen size as additional criteria
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isSmallScreen = screenWidth <= 768 || screenHeight <= 768;
  
  // Check for touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return mobileRegex.test(userAgent) || (isSmallScreen && hasTouchScreen);
};

export const isDesktopDevice = () => {
  return !isMobileDevice();
};

export const getDeviceType = () => {
  if (isMobileDevice()) {
    return 'mobile';
  }
  return 'desktop';
};

// Debug function to log device information
export const logDeviceInfo = () => {
  console.log('Device Detection Debug:');
  console.log('User Agent:', navigator.userAgent);
  console.log('Screen Width:', window.innerWidth);
  console.log('Screen Height:', window.innerHeight);
  console.log('Touch Screen:', 'ontouchstart' in window || navigator.maxTouchPoints > 0);
  console.log('Is Mobile:', isMobileDevice());
  console.log('Is Desktop:', isDesktopDevice());
  console.log('Device Type:', getDeviceType());
};
