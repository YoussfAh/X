import { NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaUserCircle,
    FaMoon,
    FaSun,
    FaBoxOpen,
    FaLayerGroup,
    FaUsers,
    FaKey,
    FaDumbbell,
    FaSignOutAlt,
    FaUserAlt,
    FaShoppingBag,
    FaUserShield,
    FaCog,
    FaClock,
    FaCrown,
    FaBuilding,
    FaPlus,
    FaChartLine
} from 'react-icons/fa';

const ProfileDropdown = ({
    userInfo,
    styles,
    expanded,
    setExpanded,
    toggleTheme,
    logoutHandler,
    gradients,
    sizes,
    shadows,
    colors
}) => {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    return (
        <NavDropdown
            title={
                <div
                    className="d-flex align-items-center"
                    style={{
                        background: 'linear-gradient(135deg, #9d71db 0%, #7d3bed 100%)',
                        borderRadius: '50%',
                        padding: '2px',
                        boxShadow: isDarkMode
                            ? '0 0 15px rgba(157, 113, 219, 0.3)'
                            : '0 3px 10px rgba(157, 113, 219, 0.2)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: isDarkMode ? '#121212' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <FaUserAlt
                            size={18}
                            color={isDarkMode ? '#b388ff' : '#9d71db'}
                        />
                    </div>
                </div>
            }
            align="end"
            className="profile-dropdown-container"
            style={{
                margin: 0
            }}
            show={expanded}
            onToggle={(isOpen) => setExpanded(isOpen)}
        >
            <div style={{
                padding: '12px 0',
                width: '100%'
            }}>
                <div style={{
                    padding: '0 16px 12px',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    marginBottom: '8px'
                }}>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                            marginBottom: '2px'
                        }}
                    >
                        Signed in as
                    </div>
                    <div
                        style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: isDarkMode ? '#b388ff' : '#9d71db',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {userInfo.email}
                    </div>
                </div>

                <NavDropdown.Item
                    as={Link}
                    to="/profile"
                    className="dropdown-item-custom"
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: isDarkMode ? '#fff' : '#333',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <FaUserCircle size={16} />
                    My Profile
                </NavDropdown.Item>

                <NavDropdown.Item
                    as={Link}
                    to="/my-collections"
                    className="dropdown-item-custom"
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: isDarkMode ? '#fff' : '#333',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <FaLayerGroup size={16} />
                    My Collections
                </NavDropdown.Item>

                <NavDropdown.Item
                    as={Link}
                    to="/workout-dashboard"
                    className="dropdown-item-custom"
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: isDarkMode ? '#fff' : '#333',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <FaDumbbell size={16} />
                    Exercise Tracking
                </NavDropdown.Item>

                <NavDropdown.Item
                    as={Link}
                    to="/my-orders"
                    className="dropdown-item-custom"
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: isDarkMode ? '#fff' : '#333',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <FaShoppingBag size={16} />
                    My Orders
                </NavDropdown.Item>

                <NavDropdown.Item
                    onClick={toggleTheme}
                    className="dropdown-item-custom"
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: isDarkMode ? '#fff' : '#333',
                        transition: 'all 0.15s ease'
                    }}
                >
                    {isDarkMode ?
                        <FaSun size={16} style={{ color: '#ffd60a' }} /> :
                        <FaMoon size={16} style={{ color: '#9d71db' }} />
                    }
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </NavDropdown.Item>

                {userInfo.isSuperAdmin && (
                    <>
                        <NavDropdown.Divider style={{
                            margin: '8px 0',
                            borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                        }} />
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '8px 16px 4px',
                            color: '#FFD700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <FaCrown size={14} />
                            Super Admin
                        </div>
                        <NavDropdown.Item
                            as={Link}
                            to="/super-admin"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaChartLine size={16} style={{ color: '#FFD700' }} />
                            Dashboard
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/super-admin/tenants"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaBuilding size={16} style={{ color: '#10B981' }} />
                            Manage Tenants
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/super-admin/tenants/create"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaPlus size={16} style={{ color: '#3B82F6' }} />
                            Create Tenant
                        </NavDropdown.Item>
                    </>
                )}

                {userInfo.isAdmin && (
                    <>
                        <NavDropdown.Divider style={{
                            margin: '8px 0',
                            borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                        }} />
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '8px 16px 4px',
                            color: isDarkMode ? '#b388ff' : '#9d71db',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <FaUserShield size={14} />
                            Admin
                        </div>
                        <NavDropdown.Item
                            as={Link}
                            to="/admin/productlist"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaBoxOpen size={16} style={{ color: isDarkMode ? '#b388ff' : '#9d71db' }} />
                            Units
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/admin/collectionlist"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaLayerGroup size={16} style={{ color: isDarkMode ? '#b388ff' : '#9d71db' }} />
                            Collections
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/admin/userlist"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaUsers size={16} style={{ color: isDarkMode ? '#b388ff' : '#9d71db' }} />
                            Users
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/admin/access-codes"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaKey size={16} style={{ color: isDarkMode ? '#b388ff' : '#9d71db' }} />
                            Access Codes
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/admin/workouts"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaDumbbell size={16} style={{ color: isDarkMode ? '#b388ff' : '#9d71db' }} />
                            Workout Management
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/admin/system-settings"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaCog size={16} style={{ color: isDarkMode ? '#b388ff' : '#9d71db' }} />
                            System Settings
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/admin/timeframe-management"
                            className="dropdown-item-custom"
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: isDarkMode ? '#fff' : '#333',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <FaClock size={16} style={{ color: isDarkMode ? '#b388ff' : '#9d71db' }} />
                            CRM
                        </NavDropdown.Item>
                    </>
                )}

                <NavDropdown.Divider style={{
                    margin: '8px 0',
                    borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                }} />

                <NavDropdown.Item
                    onClick={logoutHandler}
                    className="dropdown-item-custom"
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: isDarkMode ? '#ff453a' : '#ff3b30',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <FaSignOutAlt size={16} />
                    Sign Out
                </NavDropdown.Item>
            </div>

            <style jsx="true">{`
                .dropdown-item-custom {
                    border-radius: 8px;
                    margin: 0 8px;
                    width: calc(100% - 16px);
                }
                
                .dropdown-item-custom:hover {
                    background-color: ${isDarkMode ? 'rgba(179, 136, 255, 0.15)' : 'rgba(157, 113, 219, 0.1)'} !important;
                    transform: translateX(5px);
                }
                
                .dropdown-menu {
                    padding: 8px 0 !important;
                    border-radius: 12px !important;
                    border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
                    background-color: ${isDarkMode ? '#121212' : '#ffffff'} !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, ${isDarkMode ? '0.5' : '0.15'}) !important;
                    animation: fadeIn 0.2s ease-out forwards;
                    overflow: hidden;
                }
            `}</style>
        </NavDropdown>
    );
};

export default ProfileDropdown;