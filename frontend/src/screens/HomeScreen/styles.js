// Styles for HomeScreen components
// Function to generate theme-aware styles
const getThemeAwareStyles = (isDarkMode) => {
  return {
    heroSectionStyle: {
      position: 'relative',
      padding: '3rem 2rem',
      marginBottom: '3rem',
      borderRadius: '16px',
      overflow: 'hidden',
      background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(12px)',
      boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(99, 102, 241, 0.04)',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.6)',
    },
    
    sectionHeaderStyle: {
      textAlign: 'center',
      marginBottom: '2.5rem',
      padding: '2rem',
      background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(248, 250, 252, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(99, 102, 241, 0.04)',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.6)',
      position: 'relative',
      overflow: 'hidden',
    },
    
    sectionTitleStyle: {
      fontSize: '2rem',
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: '0.75rem',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      transition: 'color 0.3s ease',
    },
    
    sectionSubtitleStyle: {
      fontSize: '1rem',
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(51, 65, 85, 0.9)',
      fontWeight: '400',
      maxWidth: '600px',
      margin: '0 auto',
      transition: 'color 0.3s ease',
    },
    
    dividerStyle: {
      width: '60px',
      height: '2px',
      background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.3)',
      margin: '1.25rem auto',
      borderRadius: '2px',
      transition: 'background 0.3s ease',
    },
    
    collectionInfoStyle: {
      position: 'absolute',
      bottom: '10px',
      right: '10px',
      background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(248, 250, 252, 0.95)',
      color: isDarkMode ? '#fff' : '#1e293b',
      padding: '5px 10px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      backdropFilter: 'blur(4px)',
      boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(99, 102, 241, 0.08)',
      border: isDarkMode ? 'none' : '1px solid rgba(226, 232, 240, 0.6)',
      transition: 'all 0.3s ease',
    }
  };
};

// Default styles for compatibility with existing components
// These will be used until components are updated to use the theme-aware version
export const heroSectionStyle = {
  position: 'relative',
  padding: '3rem 2rem',
  marginBottom: '3rem',
  borderRadius: '16px',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

export const sectionHeaderStyle = {
  textAlign: 'center',
  marginBottom: '2.5rem',
  padding: '2rem',
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'relative',
  overflow: 'hidden',
};

export const sectionTitleStyle = {
  fontSize: '2rem',
  fontWeight: '500',
  color: '#fff',
  marginBottom: '0.75rem',
  letterSpacing: '0.5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
};

export const sectionSubtitleStyle = {
  fontSize: '1rem',
  color: 'rgba(255, 255, 255, 0.7)',
  fontWeight: '400',
  maxWidth: '600px',
  margin: '0 auto',
};

export const dividerStyle = {
  width: '60px',
  height: '2px',
  background: 'rgba(255, 255, 255, 0.2)',
  margin: '1.25rem auto',
  borderRadius: '2px',
};

export const collectionInfoStyle = {
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  background: 'rgba(0, 0, 0, 0.7)',
  padding: '5px 10px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

export default getThemeAwareStyles;