import { useState, useEffect, useRef } from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useLogoutMutation } from '../../slices/usersApiSlice';
import { logout } from '../../slices/authSlice';
import { FaUser } from 'react-icons/fa';
import { ReactComponent as LogoSVG } from '../../assets/logo.svg';
import ProfileDropdown from './ProfileDropdown';
import { createConstants } from './constants';
import { createStyles } from './styles';
import { getAnimationStyles } from './animations';

const Header = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const menuRef = useRef(null);

    const [logoutApiCall] = useLogoutMutation();
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 576);
    const [expanded, setExpanded] = useState(false);

    // Get constants and styles
    const constants = createConstants(isDarkMode, false);
    const styles = createStyles(isDarkMode, false, constants.colors, constants.gradients, constants.sizes, constants.shadows, constants.animations);

    // Update theme state and detect screen size
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDarkMode(
                        document.documentElement.getAttribute('data-theme') === 'dark'
                    );
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 576);
        };

        const handleClickOutside = (event) => {
            if (expanded && menuRef.current && !menuRef.current.contains(event.target)) {
                setExpanded(false);
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        handleResize();

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [expanded]);

    const logoutHandler = async () => {
        try {
            await logoutApiCall().unwrap();
            dispatch(logout());
            navigate('/login');
            setExpanded(false);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        setIsDarkMode(!isDarkMode);
    };

    return (
        <header>
            <div style={{
                ...styles.header,
                height: '80px',
                position: 'relative',
                backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <Container style={{
                    ...styles.container,
                    maxWidth: '1200px',
                    padding: '0 1rem',
                    height: '100%'
                }}>
                    <Navbar
                        expand={true}
                        expanded={true}
                        className="h-100 w-100"
                        style={{
                            padding: 0,
                            justifyContent: 'space-between',
                            flexWrap: 'nowrap'
                        }}
                    >
                        <div className="d-flex justify-content-start align-items-center" style={{ flex: '1' }}>
                            <Navbar.Brand
                                as={Link}
                                to="/"
                                className="d-flex align-items-center"
                                style={{
                                    marginRight: '1rem',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '12px',
                                    background: 'transparent',
                                    padding: '9.5px',
                                    display: 'flex',
                                    alignItems:'center',
                                    justifyContent: 'center'
                                }}>
                                    <LogoSVG style={{
                                        width: '110%',
                                        height: '110%',
                                        position: 'relative',
                                        zIndex: 1,
                                        // filter: isDarkMode ? 'brightness(1.3)' : 'brightness(1.2)'
                                    }} />
                                </div>
                                <div className="ms-2" style={{
                                    fontSize: isSmallScreen ? '1.4rem' : '1.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    color: isDarkMode ? '#A78BFA' : '#7C3AED',
                                    transition: 'color 0.3s ease',
                                    textShadow: isDarkMode ? '0 0 10px rgba(167, 139, 250, 0.4)' : '0 0 10px rgba(124, 58, 237, 0.2)'
                                }}>
                                    GRINDX
                                </div>
                            </Navbar.Brand>
                        </div>

                        {/* Replace the empty div with flexbox spacer */}
                        <div className="flex-grow-1"></div>

                        <div className="d-flex justify-content-end align-items-center">
                            <Nav>
                                {userInfo ? (
                                    <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
                                        <div className="profile-dropdown-container" style={{
                                            position: 'relative',
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                        }}>
                                            <ProfileDropdown
                                                userInfo={userInfo}
                                                isDarkMode={isDarkMode}
                                                styles={{
                                                    ...styles,
                                                    gradients: constants.gradients,
                                                    sizes: constants.sizes,
                                                    shadows: constants.shadows,
                                                    colors: constants.colors
                                                }}
                                                expanded={expanded}
                                                setExpanded={setExpanded}
                                                toggleTheme={toggleTheme}
                                                logoutHandler={logoutHandler}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        as={Link}
                                        to="/login"
                                        style={{
                                            background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.9rem',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)'
                                        }}
                                    >
                                        <FaUser className="me-2" />
                                        Sign In
                                    </Button>
                                )}
                            </Nav>
                        </div>
                    </Navbar>
                </Container>
            </div>

            <style jsx="true">{`
                ${getAnimationStyles()}

                .navbar-nav {
                    align-items: center;
                }

                .nav-item {
                    margin: 0 0.5rem;
                }
                
                /* Override Bootstrap's default collapse behavior */
                .navbar-collapse {
                    display: flex !important;
                    flex-basis: auto;
                }
                
                /* Remove dropdown arrow */
                .dropdown-toggle::after {
                    display: none !important;
                }

                /* Fixed position for dropdown menu to ensure consistent placement */
                .profile-dropdown-container .dropdown-menu {
                    position: absolute !important;
                    right: 0 !important;
                    left: auto !important;
                    top: 100% !important;
                    transform: none !important;
                    margin-top: 0.5rem !important;
                    min-width: 280px !important;
                    background-color: ${isDarkMode ? '#1E293B' : '#FFFFFF'} !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, ${isDarkMode ? '0.25' : '0.15'}) !important;
                    border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
                    border-radius: 12px !important;
                    overflow: hidden !important;
                }

                /* Add responsive styles for all screen sizes */
                @media (max-width: 991px) {
                    .profile-dropdown-container {
                        margin-left: auto;
                    }
                }

                @media (max-width: 576px) {
                    .profile-dropdown-container .dropdown-menu {
                        width: 280px !important;
                        max-width: 90vw !important;
                    }
                }
                
                .dropdown-menu-end {
                    right: 0 !important;
                    left: auto !important;
                }
            `}</style>
        </header>
    );
};

export default Header;