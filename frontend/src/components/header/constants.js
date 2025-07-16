export const createConstants = (isDarkMode, isMobile) => {
    // Modern color scheme with vibrant gradients
    const colors = {
        primary: '#7C3AED', // Vibrant purple
        primaryLight: '#A78BFA',
        primaryDark: '#5B21B6',
        accent: '#F59E0B', // Warm orange
        accentLight: '#FBBF24',
        accentDark: '#D97706',
        success: '#10B981', // Emerald
        danger: '#EF4444', // Red
        warning: '#F59E0B', // Amber
        info: '#3B82F6', // Blue
        dark: isDarkMode ? '#1E293B' : '#0F172A',
        light: isDarkMode ? '#E2E8F0' : '#F8FAFC',
        background: isDarkMode ? '#0F172A' : '#FFFFFF',
        surface: isDarkMode ? '#1E293B' : '#F1F5F9',
        border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    };

    // Enhanced gradients
    const gradients = {
        primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
        accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
        surface: isDarkMode
            ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
            : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        glass: isDarkMode
            ? 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(241,245,249,0.9) 100%)',
        glow: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.accent}40 100%)`,
    };

    // Modern sizing system
    const sizes = {
        headerHeight: isMobile ? '70px' : '80px',
        containerMaxWidth: '1400px',
        spacing: {
            xs: '0.5rem',
            sm: '1rem',
            md: '1.5rem',
            lg: '2rem',
        },
        borderRadius: {
            sm: '8px',
            md: '12px',
            lg: '16px',
            xl: '24px',
            full: '9999px',
        },
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
        },
    };

    // Enhanced shadows
    const shadows = {
        sm: isDarkMode
            ? '0 2px 4px rgba(0,0,0,0.3)'
            : '0 2px 4px rgba(0,0,0,0.05)',
        md: isDarkMode
            ? '0 4px 6px rgba(0,0,0,0.4)'
            : '0 4px 6px rgba(0,0,0,0.1)',
        lg: isDarkMode
            ? '0 10px 15px rgba(0,0,0,0.5)'
            : '0 10px 15px rgba(0,0,0,0.1)',
        xl: isDarkMode
            ? '0 20px 25px rgba(0,0,0,0.6)'
            : '0 20px 25px rgba(0,0,0,0.1)',
        glow: `0 0 20px ${colors.primary}40`,
    };

    // Modern animations
    const animations = {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        hover: {
            scale: 'scale(1.05)',
            lift: 'translateY(-2px)',
        },
    };

    return {
        colors,
        gradients,
        sizes,
        shadows,
        animations,
    };
}; 