export const createStyles = (isDarkMode, isMobile, colors, gradients, sizes, shadows, animations) => {
    return {
        header: {
            background: gradients.surface,
            borderBottom: `1px solid ${colors.border}`,
            boxShadow: shadows.md,
            transition: animations.transition,
        },
        container: {
            maxWidth: sizes.containerMaxWidth,
            height: '100%',
            margin: '0 auto',
            padding: `0 ${sizes.spacing.md}`,
        },
        navbar: {
            padding: 0,
        },
        logo: {
            container: {
                width: isMobile ? '40px' : '50px',
                height: isMobile ? '40px' : '50px',
                background: gradients.primary,
                borderRadius: sizes.borderRadius.lg,
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.glow,
                position: 'relative',
                overflow: 'hidden',
            },
            glow: {
                position: 'absolute',
                width: '150%',
                height: '150%',
                background: gradients.glow,
                top: '-25%',
                left: '-25%',
                opacity: 0.5,
                animation: 'rotate 10s linear infinite',
            },
            text: {
                fontSize: sizes.fontSize.lg,
                fontWeight: '700',
                background: gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: shadows.glow,
            },
        },
        search: {
            container: {
                flex: 1,
                maxWidth: '600px',
                margin: '0 2rem',
            },
            input: {
                border: `1px solid ${colors.border}`,
                borderRadius: sizes.borderRadius.md,
                padding: `${sizes.spacing.xs} ${sizes.spacing.md}`,
                fontSize: sizes.fontSize.sm,
                background: isDarkMode ? colors.surface : colors.background,
                color: isDarkMode ? colors.light : colors.dark,
            },
            icon: {
                background: 'transparent',
                border: 'none',
                color: isDarkMode ? colors.light : colors.dark,
            },
        },
        cart: {
            container: {
                position: 'relative',
                marginRight: sizes.spacing.md,
            },
            iconWrapper: {
                position: 'relative',
            },
            icon: {
                fontSize: '1.2rem',
                color: isDarkMode ? colors.light : colors.dark,
            },
            badge: {
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                padding: '0.25rem 0.5rem',
                fontSize: sizes.fontSize.xs,
            },
        },
        mobileMenu: {
            background: isMobile ? gradients.glass : 'transparent',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: isMobile ? `0 0 ${sizes.borderRadius.lg} ${sizes.borderRadius.lg}` : '0',
            marginTop: isMobile ? sizes.spacing.sm : 0,
            padding: isMobile ? sizes.spacing.md : 0,
            boxShadow: isMobile ? shadows.lg : 'none',
        },
        button: {
            primary: {
                background: gradients.primary,
                color: '#ffffff',
                borderRadius: sizes.borderRadius.full,
                padding: `${sizes.spacing.xs} ${sizes.spacing.md}`,
                transition: animations.transition,
                '&:hover': {
                    transform: animations.hover.lift,
                    boxShadow: shadows.glow,
                },
            },
            secondary: {
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: isDarkMode ? colors.light : colors.dark,
                borderRadius: sizes.borderRadius.full,
                padding: `${sizes.spacing.xs} ${sizes.spacing.md}`,
                transition: animations.transition,
                '&:hover': {
                    background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                    transform: animations.hover.lift,
                },
            },
        },
        dropdown: {
            menu: {
                background: isDarkMode ? colors.surface : colors.background,
                borderRadius: sizes.borderRadius.lg,
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.lg,
                padding: sizes.spacing.sm,
                minWidth: isMobile ? '100%' : '280px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
            },
            item: {
                padding: `${sizes.spacing.sm} ${sizes.spacing.md}`,
                borderRadius: sizes.borderRadius.md,
                transition: animations.transition,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: isDarkMode ? colors.light : colors.dark,
                '&:hover': {
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    transform: 'translateX(5px)',
                },
            },
            divider: {
                margin: `${sizes.spacing.xs} 0`,
                borderColor: colors.border,
            },
            header: {
                padding: sizes.spacing.sm,
                borderBottom: `1px solid ${colors.border}`,
                marginBottom: sizes.spacing.sm,
            },
            section: {
                padding: sizes.spacing.sm,
                fontSize: sizes.fontSize.sm,
                fontWeight: '600',
                color: colors.primary,
                textTransform: 'uppercase',
                letterSpacing: '1px',
            },
        },
    };
}; 