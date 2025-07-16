// // This file contains the original Header implementation for reference
// // The active implementation has been moved to the modular components in the header folder

// import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
// import {
//     FaUser,
//     FaMoon,
//     FaSun,
//     FaSignOutAlt,
//     FaUserCircle,
//     FaCog,
//     FaBoxOpen,
//     FaLayerGroup,
//     FaUsers,
//     FaKey,
//     FaBars,
// } from 'react-icons/fa';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate, Link } from 'react-router-dom';
// import { useLogoutMutation } from '../slices/usersApiSlice';
// import { logout } from '../slices/authSlice';
// // Import SVG logo
// import { ReactComponent as LogoSVG } from '../assets/logo.svg';
// import { useState, useEffect } from 'react';

// const HeaderOriginal = () => {
//     const { userInfo } = useSelector((state) => state.auth);
//     const dispatch = useDispatch();
//     const navigate = useNavigate();

//     const [logoutApiCall] = useLogoutMutation();
//     const [isDarkMode, setIsDarkMode] = useState(
//         document.documentElement.getAttribute('data-theme') === 'dark'
//     );
//     const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//     const [expanded, setExpanded] = useState(false);
//     const [showProfileImage, setShowProfileImage] = useState(false);

//     // Update theme state and detect screen size
//     useEffect(() => {
//         const observer = new MutationObserver((mutations) => {
//             mutations.forEach((mutation) => {
//                 if (mutation.attributeName === 'data-theme') {
//                     setIsDarkMode(
//                         document.documentElement.getAttribute('data-theme') === 'dark'
//                     );
//                 }
//             });
//         });
//         observer.observe(document.documentElement, { attributes: true });

//         const handleResize = () => {
//             setIsMobile(window.innerWidth <= 768);
//         };

//         window.addEventListener('resize', handleResize);
//         handleResize();

//         return () => {
//             observer.disconnect();
//             window.removeEventListener('resize', handleResize);
//         };
//     }, []);

//     const logoutHandler = async () => {
//         try {
//             await logoutApiCall().unwrap();
//             dispatch(logout());
//             navigate('/login');
//             setExpanded(false);
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     const toggleTheme = () => {
//         const newTheme = isDarkMode ? 'light' : 'dark';
//         document.documentElement.setAttribute('data-theme', newTheme);
//         localStorage.setItem('theme', newTheme);
//         setIsDarkMode(!isDarkMode);
//     };

//     // Modern color scheme with vibrant gradients
//     const colors = {
//         primary: '#7C3AED', // Vibrant purple
//         primaryLight: '#A78BFA',
//         primaryDark: '#5B21B6',
//         accent: '#F59E0B', // Warm orange
//         accentLight: '#FBBF24',
//         accentDark: '#D97706',
//         success: '#10B981', // Emerald
//         danger: '#EF4444', // Red
//         warning: '#F59E0B', // Amber
//         info: '#3B82F6', // Blue
//         dark: isDarkMode ? '#1E293B' : '#0F172A',
//         light: isDarkMode ? '#E2E8F0' : '#F8FAFC',
//         background: isDarkMode ? '#0F172A' : '#FFFFFF',
//         surface: isDarkMode ? '#1E293B' : '#F1F5F9',
//         border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
//     };

//     // Enhanced gradients
//     const gradients = {
//         primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
//         accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
//         surface: isDarkMode
//             ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
//             : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
//         glass: isDarkMode
//             ? 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)'
//             : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(241,245,249,0.9) 100%)',
//         glow: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.accent}40 100%)`,
//     };

//     // Modern sizing system
//     const sizes = {
//         headerHeight: isMobile ? '70px' : '80px',
//         containerMaxWidth: '1400px',
//         spacing: {
//             xs: '0.5rem',
//             sm: '1rem',
//             md: '1.5rem',
//             lg: '2rem',
//         },
//         borderRadius: {
//             sm: '8px',
//             md: '12px',
//             lg: '16px',
//             xl: '24px',
//             full: '9999px',
//         },
//         fontSize: {
//             xs: '0.75rem',
//             sm: '0.875rem',
//             md: '1rem',
//             lg: '1.125rem',
//             xl: '1.25rem',
//         },
//     };

//     // Enhanced shadows
//     const shadows = {
//         sm: isDarkMode
//             ? '0 2px 4px rgba(0,0,0,0.3)'
//             : '0 2px 4px rgba(0,0,0,0.05)',
//         md: isDarkMode
//             ? '0 4px 6px rgba(0,0,0,0.4)'
//             : '0 4px 6px rgba(0,0,0,0.1)',
//         lg: isDarkMode
//             ? '0 10px 15px rgba(0,0,0,0.5)'
//             : '0 10px 15px rgba(0,0,0,0.1)',
//         xl: isDarkMode
//             ? '0 20px 25px rgba(0,0,0,0.6)'
//             : '0 20px 25px rgba(0,0,0,0.1)',
//         glow: `0 0 20px ${colors.primary}40`,
//     };

//     // Modern animations
//     const animations = {
//         transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//         hover: {
//             scale: 'scale(1.05)',
//             lift: 'translateY(-2px)',
//         },
//     };

//     // Modern component styles
//     const styles = {
//         header: {
//             background: gradients.surface,
//             borderBottom: `1px solid ${colors.border}`,
//             boxShadow: shadows.md,
//             transition: animations.transition,
//         },
//         button: {
//             primary: {
//                 background: gradients.primary,
//                 color: '#ffffff',
//                 borderRadius: sizes.borderRadius.full,
//                 padding: `${sizes.spacing.xs} ${sizes.spacing.md}`,
//                 transition: animations.transition,
//                 '&:hover': {
//                     transform: animations.hover.lift,
//                     boxShadow: shadows.glow,
//                 },
//             },
//             secondary: {
//                 background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
//                 color: colors.dark,
//                 borderRadius: sizes.borderRadius.full,
//                 padding: `${sizes.spacing.xs} ${sizes.spacing.md}`,
//                 transition: animations.transition,
//                 '&:hover': {
//                     background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
//                     transform: animations.hover.lift,
//                 },
//             },
//         },
//         dropdown: {
//             menu: {
//                 background: isDarkMode ? colors.surface : colors.background,
//                 borderRadius: sizes.borderRadius.lg,
//                 border: `1px solid ${colors.border}`,
//                 boxShadow: shadows.lg,
//                 padding: sizes.spacing.sm,
//                 minWidth: isMobile ? '100%' : '280px',
//                 backdropFilter: 'blur(10px)',
//                 WebkitBackdropFilter: 'blur(10px)',
//             },
//             item: {
//                 padding: `${sizes.spacing.sm} ${sizes.spacing.md}`,
//                 borderRadius: sizes.borderRadius.md,
//                 transition: animations.transition,
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '0.5rem',
//                 color: isDarkMode ? colors.light : colors.dark,
//                 '&:hover': {
//                     background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
//                     transform: 'translateX(5px)',
//                 },
//             },
//             divider: {
//                 margin: `${sizes.spacing.xs} 0`,
//                 borderColor: colors.border,
//             },
//             header: {
//                 padding: sizes.spacing.sm,
//                 borderBottom: `1px solid ${colors.border}`,
//                 marginBottom: sizes.spacing.sm,
//             },
//             section: {
//                 padding: sizes.spacing.sm,
//                 fontSize: sizes.fontSize.sm,
//                 fontWeight: '600',
//                 color: colors.primary,
//                 textTransform: 'uppercase',
//                 letterSpacing: '1px',
//             },
//         },
//     };

//     return (
//         <header>
//             <div
//                 style={{
//                     ...styles.header,
//                     height: sizes.headerHeight,
//                 }}
//             >
//                 <Container
//                     style={{
//                         maxWidth: sizes.containerMaxWidth,
//                         height: '100%',
//                         margin: '0 auto',
//                         padding: `0 ${sizes.spacing.md}`,
//                     }}
//                 >
//                     <Navbar
//                         expand="lg"
//                         className="h-100"
//                         style={{ padding: 0 }}
//                     >
//                         {/* Logo */}
//                         <Navbar.Brand
//                             as={Link}
//                             to="/"
//                             className="d-flex align-items-center"
//                             style={{
//                                 marginRight: sizes.spacing.md,
//                                 height: '100%',
//                             }}
//                         >
//                             <div
//                                 style={{
//                                     width: isMobile ? '40px' : '50px',
//                                     height: isMobile ? '40px' : '50px',
//                                     background: gradients.primary,
//                                     borderRadius: sizes.borderRadius.lg,
//                                     padding: '8px',
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'center',
//                                     boxShadow: shadows.glow,
//                                     position: 'relative',
//                                     overflow: 'hidden',
//                                 }}
//                             >
//                                 <div
//                                     style={{
//                                         position: 'absolute',
//                                         width: '150%',
//                                         height: '150%',
//                                         background: gradients.glow,
//                                         top: '-25%',
//                                         left: '-25%',
//                                         opacity: 0.5,
//                                         animation: 'rotate 10s linear infinite',
//                                     }}
//                                 />
//                                 <LogoSVG style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
//                             </div>
//                             <div
//                                 className="ms-3 d-none d-sm-block"
//                                 style={{
//                                     fontSize: sizes.fontSize.lg,
//                                     fontWeight: '700',
//                                     background: gradients.primary,
//                                     WebkitBackgroundClip: 'text',
//                                     WebkitTextFillColor: 'transparent',
//                                     textShadow: shadows.glow,
//                                 }}
//                             >
//                                 GRINDX
//                             </div>
//                         </Navbar.Brand>

//                         {/* Navigation Items */}
//                         <Navbar.Collapse
//                             id="basic-navbar-nav"
//                             style={{
//                                 background: isMobile ? gradients.glass : 'transparent',
//                                 backdropFilter: 'blur(10px)',
//                                 WebkitBackdropFilter: 'blur(10px)',
//                                 borderRadius: isMobile ? `0 0 ${sizes.borderRadius.lg} ${sizes.borderRadius.lg}` : '0',
//                                 marginTop: isMobile ? sizes.spacing.sm : 0,
//                                 padding: isMobile ? sizes.spacing.md : 0,
//                                 boxShadow: isMobile ? shadows.lg : 'none',
//                             }}
//                         >
//                             <Nav className="ms-auto align-items-center">
//                                 {userInfo ? (
//                                     <>
//                                         {/* User Profile with Theme Toggle */}
//                                         <NavDropdown
//                                             title={
//                                                 <div
//                                                     className="d-flex align-items-center"
//                                                     style={{
//                                                         background: gradients.primary,
//                                                         borderRadius: sizes.borderRadius.full,
//                                                         padding: '2px',
//                                                         boxShadow: shadows.glow,
//                                                     }}
//                                                 >
//                                                     <div
//                                                         style={{
//                                                             width: '40px',
//                                                             height: '40px',
//                                                             borderRadius: sizes.borderRadius.full,
//                                                             background: isDarkMode ? colors.surface : colors.background,
//                                                             display: 'flex',
//                                                             alignItems: 'center',
//                                                             justifyContent: 'center',
//                                                             overflow: 'hidden',
//                                                             border: `2px solid ${colors.primaryLight}`,
//                                                         }}
//                                                     >
//                                                         {showProfileImage ? (
//                                                             <img
//                                                                 src="https://randomuser.me/api/portraits/men/45.jpg"
//                                                                 alt="Profile"
//                                                                 style={{
//                                                                     width: '100%',
//                                                                     height: '100%',
//                                                                     objectFit: 'cover',
//                                                                 }}
//                                                             />
//                                                         ) : (
//                                                             <FaUserCircle
//                                                                 size={24}
//                                                                 color={colors.primary}
//                                                             />
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             }
//                                             align="end"
//                                             style={{
//                                                 marginLeft: sizes.spacing.xs,
//                                             }}
//                                             show={expanded}
//                                             onToggle={(isOpen) => setExpanded(isOpen)}
//                                         >
//                                             <div style={styles.dropdown.menu}>
//                                                 <div style={styles.dropdown.header}>
//                                                     <div
//                                                         style={{
//                                                             fontSize: sizes.fontSize.sm,
//                                                             color: isDarkMode ? colors.light : colors.dark,
//                                                             opacity: 0.7,
//                                                         }}
//                                                     >
//                                                         Signed in as
//                                                     </div>
//                                                     <div
//                                                         style={{
//                                                             fontSize: sizes.fontSize.md,
//                                                             fontWeight: '600',
//                                                             color: colors.primary,
//                                                         }}
//                                                     >
//                                                         {userInfo.email}
//                                                     </div>
//                                                 </div>

//                                                 <NavDropdown.Item
//                                                     as={Link}
//                                                     to="/profile"
//                                                     style={styles.dropdown.item}
//                                                 >
//                                                     <FaUserCircle />
//                                                     My Profile
//                                                 </NavDropdown.Item>

//                                                 <NavDropdown.Item
//                                                     onClick={toggleTheme}
//                                                     style={styles.dropdown.item}
//                                                 >
//                                                     {isDarkMode ? <FaSun /> : <FaMoon />}
//                                                     {isDarkMode ? 'Light Mode' : 'Dark Mode'}
//                                                 </NavDropdown.Item>

//                                                 {userInfo.isAdmin && (
//                                                     <>
//                                                         <NavDropdown.Divider style={styles.dropdown.divider} />
//                                                         <div style={styles.dropdown.section}>
//                                                             Admin
//                                                         </div>
//                                                         <NavDropdown.Item
//                                                             as={Link}
//                                                             to="/admin/productlist"
//                                                             style={styles.dropdown.item}
//                                                         >
//                                                             <FaBoxOpen />
//                                                             Products
//                                                         </NavDropdown.Item>
//                                                         <NavDropdown.Item
//                                                             as={Link}
//                                                             to="/admin/collectionlist"
//                                                             style={styles.dropdown.item}
//                                                         >
//                                                             <FaLayerGroup />
//                                                             Collections
//                                                         </NavDropdown.Item>
//                                                         <NavDropdown.Item
//                                                             as={Link}
//                                                             to="/admin/userlist"
//                                                             style={styles.dropdown.item}
//                                                         >
//                                                             <FaUsers />
//                                                             Users
//                                                         </NavDropdown.Item>
//                                                         <NavDropdown.Item
//                                                             as={Link}
//                                                             to="/admin/access-codes"
//                                                             style={styles.dropdown.item}
//                                                         >
//                                                             <FaKey />
//                                                             Access Codes
//                                                         </NavDropdown.Item>
//                                                     </>
//                                                 )}

//                                                 <NavDropdown.Divider style={styles.dropdown.divider} />
//                                                 <NavDropdown.Item
//                                                     onClick={logoutHandler}
//                                                     style={{
//                                                         ...styles.dropdown.item,
//                                                         color: colors.danger,
//                                                     }}
//                                                 >
//                                                     <FaSignOutAlt />
//                                                     Sign Out
//                                                 </NavDropdown.Item>
//                                             </div>
//                                         </NavDropdown>
//                                     </>
//                                 ) : (
//                                     <Button
//                                         as={Link}
//                                         to="/login"
//                                         style={{
//                                             ...styles.button.primary,
//                                             marginLeft: sizes.spacing.xs,
//                                         }}
//                                     >
//                                         <FaUser className="me-2" />
//                                         Sign In
//                                     </Button>
//                                 )}
//                             </Nav>
//                         </Navbar.Collapse>

//                         {/* Mobile Menu Toggle */}
//                         <Navbar.Toggle
//                             aria-controls="basic-navbar-nav"
//                             style={{
//                                 border: 'none',
//                                 background: 'transparent',
//                                 padding: sizes.spacing.xs,
//                                 marginLeft: 'auto',
//                             }}
//                         >
//                             <FaBars
//                                 size={24}
//                                 color={isDarkMode ? colors.light : colors.dark}
//                             />
//                         </Navbar.Toggle>
//                     </Navbar>
//                 </Container>
//             </div>

//             <style jsx="true">{`
//         @keyframes slideDown {
//           from {
//             opacity: 0;
//             transform: translateY(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         @keyframes rotate {
//           from {
//             transform: rotate(0deg);
//           }
//           to {
//             transform: rotate(360deg);
//           }
//         }

//         .navbar-collapse.show {
//           animation: slideDown 0.3s ease-out forwards;
//         }

//         .dropdown-menu.show {
//           animation: fadeIn 0.2s ease-out forwards;
//         }

//         /* Remove dropdown triangle */
//         .dropdown-toggle::after {
//           display: none !important;
//         }

//         @media (max-width: 768px) {
//           .navbar-collapse {
//             position: absolute;
//             top: 100%;
//             left: 0;
//             right: 0;
//             z-index: 1029;
//           }

//           .nav-item {
//             width: 100%;
//           }

//           .nav-link {
//             padding: ${sizes.spacing.sm} ${sizes.spacing.md};
//             border-radius: ${sizes.borderRadius.md};
//             transition: ${animations.transition};
//           }

//           .nav-link:hover {
//             background: ${isDarkMode
//                     ? 'rgba(255,255,255,0.1)'
//                     : 'rgba(0,0,0,0.05)'};
//           }
//         }

//         @media (min-width: 769px) {
//           .navbar-nav {
//             align-items: center;
//           }

//           .nav-item {
//             margin: 0 ${sizes.spacing.xs};
//           }
//         }
//       `}</style>
//         </header>
//     );
// };

// export default HeaderOriginal; 