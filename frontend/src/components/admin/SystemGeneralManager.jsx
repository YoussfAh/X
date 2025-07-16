import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Spinner, Image, ButtonGroup } from 'react-bootstrap';
import { FaCheck, FaTimes, FaImage, FaGlobe, FaPalette, FaRocket, FaMobile, FaCog, FaEnvelope, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetGeneralSettingsQuery, useUpdateGeneralSettingsMutation } from '../../slices/systemApiSlice';
import ImageUploader from './ImageUploader';
import { updatePWASettings } from '../../utils/pwaUtils';

const SystemGeneralManager = () => {
    const [formData, setFormData] = useState({
        // PWA Icon Settings
        pwaIcon: '',
        pwaIconDisplayStyle: 'container', // 'container' or 'full-space'
        
        // PWA App Settings  
        pwaShortName: '',
        pwaThemeColor: '',
        pwaBackgroundColor: '',
        pwaSplashScreenImage: '',
        
        // SEO & Social
        ogImage: '',
        
        // Custom Tab Favicon
        customTabFavicon: '',
        customTabFaviconSvg: ''
    });
    
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    const { 
        data: settings, 
        isLoading: loadingSettings, 
        error: settingsError,
        refetch 
    } = useGetGeneralSettingsQuery();

    const [updateSettings, { isLoading: updatingSettings }] = useUpdateGeneralSettingsMutation();

    // Setup observer to detect theme changes
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

        return () => {
            observer.disconnect();
        };
    }, []);

    // Update form data when settings are loaded
    useEffect(() => {
        if (settings) {
            setFormData({
                // PWA Icon Settings
                pwaIcon: settings.pwaIcon || '',
                pwaIconDisplayStyle: settings.pwaIconWithoutBackground ? 'full-space' : 'container',
                
                // PWA App Settings
                pwaShortName: settings.pwaShortName || 'GRINDX',
                pwaThemeColor: settings.pwaThemeColor || '#4F46E5',
                pwaBackgroundColor: settings.pwaBackgroundColor || '#ffffff',
                pwaSplashScreenImage: settings.pwaSplashScreenImage || '',
                
                // SEO & Social
                ogImage: settings.ogImage || '',
                
                // Custom Tab Favicon
                customTabFavicon: settings.customTabFavicon || '',
                customTabFaviconSvg: settings.customTabFaviconSvg || ''
            });
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Show loading state
        toast.info('Saving settings...', { autoClose: 1000 });

        try {
            // Convert display style back to boolean for backend compatibility
            const submitData = {
                ...formData,
                pwaIconWithoutBackground: formData.pwaIconDisplayStyle === 'full-space'
            };
            
            console.log('Form data being submitted:', submitData);
            const response = await updateSettings(submitData).unwrap();
            
            // Force immediate refetch to ensure new data overrides old data
            await refetch();
            
            // CRITICAL: Invalidate cache and update for ALL users
            localStorage.removeItem('STATIC_CONFIG_API_CACHE');
            localStorage.removeItem('STATIC_CONFIG_OVERRIDE');
            
            // Update global config cache with new settings
            const newGlobalConfig = {
                ...submitData,
                timestamp: Date.now()
            };
            localStorage.setItem('STATIC_CONFIG_OVERRIDE', JSON.stringify(newGlobalConfig));
            
            // Broadcast custom favicon to ALL users immediately via localStorage
            const faviconBroadcast = {
                type: 'CUSTOM_FAVICON_UPDATE',
                customTabFavicon: submitData.customTabFavicon || '',
                customTabFaviconSvg: submitData.customTabFaviconSvg || '',
                timestamp: Date.now()
            };
            localStorage.setItem('CUSTOM_FAVICON_BROADCAST', JSON.stringify(faviconBroadcast));
            
            // Remove the broadcast after a short delay
            setTimeout(() => {
                localStorage.removeItem('CUSTOM_FAVICON_BROADCAST');
            }, 1000);
            
            // Apply PWA changes immediately using utility function
            updatePWASettings(submitData);
            
            // Handle custom tab favicon updates (SVG has priority over URL)
            const { forceApplyCustomTabFavicon, forceApplyCustomSvgFavicon, updateDynamicFavicon } = await import('../../utils/faviconUtils');
            
            if (submitData.customTabFaviconSvg && submitData.customTabFaviconSvg.trim()) {
                // Apply custom SVG favicon (highest priority)
                forceApplyCustomSvgFavicon(submitData.customTabFaviconSvg);
                console.log('🎨 ADMIN: Custom SVG favicon applied and broadcasted to all users');
            } else if (submitData.customTabFavicon && submitData.customTabFavicon.trim()) {
                // Apply custom URL favicon
                forceApplyCustomTabFavicon(submitData.customTabFavicon);
                console.log('🔥 ADMIN: Custom URL favicon applied and broadcasted to all users:', submitData.customTabFavicon);
            } else {
                // Clear all custom favicons if both are empty
                localStorage.removeItem('ACTIVE_CUSTOM_FAVICON');
                localStorage.removeItem('ACTIVE_CUSTOM_SVG_FAVICON');
                updateDynamicFavicon(null, null, '', true, true);
                console.log('🔥 ADMIN: All custom favicons cleared, using fallback');
            }
            
            // Trigger immediate custom favicon update event for all users
            window.dispatchEvent(new CustomEvent('customFaviconUpdate', { 
                detail: {
                    customTabFavicon: submitData.customTabFavicon,
                    customTabFaviconSvg: submitData.customTabFaviconSvg,
                    faviconImage: submitData.faviconImage,
                    faviconSvgCode: submitData.faviconSvgCode
                } 
            }));
            
            // Trigger a storage event to notify other tabs/windows of the changes
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'STATIC_CONFIG_OVERRIDE',
                newValue: JSON.stringify(newGlobalConfig),
                oldValue: null
            }));
            
            toast.success('✅ PWA Settings saved and applied globally! All users will see the changes.', { 
                autoClose: 4000,
                position: "top-right" 
            });
            
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error(`❌ Failed to save: ${error?.data?.message || 'Unknown error'}`, {
                autoClose: 5000,
                position: "top-right"
            });
        }
    };

    const cardStyle = {
        background: isDarkMode
            ? 'linear-gradient(135deg, #111111 0%, #000000 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderColor: isDarkMode ? '#222222' : '#e9ecef',
        boxShadow: isDarkMode
            ? '0 4px 12px rgba(0, 0, 0, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
    };

    const inputStyle = {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#ced4da',
        color: isDarkMode ? '#ffffff' : '#212529',
    };

    if (loadingSettings) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status" style={{ color: isDarkMode ? '#9966FF' : '#7952b3' }}>
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2" style={{ color: isDarkMode ? '#cccccc' : '#6c757d' }}>
                    Loading advanced settings...
                </p>
            </div>
        );
    }

    if (settingsError) {
        return (
            <Alert variant="danger">
                <FaTimes className="me-2" />
                Failed to load advanced settings: {settingsError?.data?.message || 'Unknown error'}
            </Alert>
        );
    }

    return (
        <div>
            {/* Header & Information */}
            <div className="mb-4">
                <h4 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                    <FaGlobe className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#7952b3' }} />
                    General Settings & PWA Configuration
                </h4>
                
                <Alert variant="info" className="mb-4">
                    <div className="d-flex align-items-start">
                        <FaEnvelope className="me-3 mt-1" style={{ fontSize: '1.1rem' }} />
                        <div>
                            <strong>📝 Simple Branding via .env File</strong>
                            <p className="mb-2 mt-1">
                                For basic app name and header logo changes, edit <code>frontend/.env</code> file:
                            </p>
                            <pre className="bg-dark text-light p-2 rounded small">
                                REACT_APP_SITE_NAME=Your App Name{'\n'}
                                REACT_APP_HEADER_IMAGE=/path/to/logo.png
                            </pre>
                            <small className="text-muted">
                                Changes require server restart. Leave HEADER_IMAGE empty for text logo.
                            </small>
                        </div>
                    </div>
                </Alert>
                
                <Alert variant="success" className="mb-4">
                    <div className="d-flex align-items-start">
                        <FaRocket className="me-3 mt-1" style={{ fontSize: '1.1rem' }} />
                        <div>
                            <strong>🚀 Advanced PWA Settings Below</strong>
                            <p className="mb-0 mt-1">
                                Configure Progressive Web App features, social media integration, and custom branding. 
                                These settings take effect immediately after saving and enhance the user experience when 
                                your app is installed on mobile devices or shared on social media.
                            </p>
                        </div>
                    </div>
                </Alert>
            </div>

            <Form onSubmit={handleSubmit}>
                {/* PWA ICON SETTINGS */}
                <Card className="mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                    border: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                }}>
                    <Card.Header style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                    }}>
                        <h5 className="mb-0" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                            <FaMobile className="me-2" style={{ color: '#007bff' }} />
                            📱 PWA App Icon Settings
                        </h5>
                        <small className="text-muted">Configure how your app icon appears when installed on mobile devices</small>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                        <FaImage className="me-2" />
                                        PWA App Icon URL
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="pwaIcon"
                                        value={formData.pwaIcon}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/icon-512x512.png"
                                        style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                                            border: isDarkMode ? '1px solid #444' : '1px solid #ced4da',
                                            color: isDarkMode ? '#ffffff' : '#000000'
                                        }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Purpose:</strong> Icon shown when users install your app to their home screen<br/>
                                        <strong>💡 Best Size:</strong> 512x512 pixels, PNG format with transparent background<br/>
                                        <strong>🎯 Important:</strong> Different from header logo - this is for PWA installation
                                    </Form.Text>
                                    {formData.pwaIcon && (
                                        <div className="mt-3 p-3 border rounded" style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                                            borderColor: isDarkMode ? '#444' : '#dee2e6'
                                        }}>
                                            <div className="d-flex align-items-center">
                                                <Image
                                                    src={formData.pwaIcon}
                                                    alt="PWA Icon Preview"
                                                    style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                                                    rounded
                                                />
                                                <div className="ms-3">
                                                    <strong>Preview</strong>
                                                    <br/><small className="text-muted">64x64 pixels (scaled down)</small>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                        <FaCog className="me-2" />
                                        Icon Display Style
                                    </Form.Label>
                                    
                                    <ButtonGroup className="w-100 d-block">
                                        <div className="d-grid gap-2">
                                            <Button
                                                variant={formData.pwaIconDisplayStyle === 'container' ? 'primary' : 'outline-secondary'}
                                                onClick={() => setFormData(prev => ({...prev, pwaIconDisplayStyle: 'container'}))}
                                                className="text-start p-3"
                                            >
                                                <div>
                                                    <strong>🔲 Normal look with background container</strong>
                                                    <br/><small className="text-muted">
                                                        Icon appears inside a rounded container - good for simple icons
                                                    </small>
                                                </div>
                                            </Button>
                                            
                                            <Button
                                                variant={formData.pwaIconDisplayStyle === 'full-space' ? 'primary' : 'outline-secondary'}
                                                onClick={() => setFormData(prev => ({...prev, pwaIconDisplayStyle: 'full-space'}))}
                                                className="text-start p-3"
                                            >
                                                <div>
                                                    <strong>🎯 Take the whole space with transparent background</strong>
                                                    <br/><small className="text-muted">
                                                        Icon fills entire space - best for icons with their own design/shape
                                                    </small>
                                                </div>
                                            </Button>
                                        </div>
                                    </ButtonGroup>
                                    
                                    <Alert variant="warning" className="mt-3" size="sm">
                                        <strong>💡 Tip:</strong> Choose "transparent background" if your icon already has its own shape, borders, or background design. 
                                        Choose "normal look" for simple icons that need a container background.
                                    </Alert>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* PWA APP BRANDING */}
                <Card className="mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                    border: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                }}>
                    <Card.Header style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                    }}>
                        <h5 className="mb-0" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                            <FaPalette className="me-2" style={{ color: '#28a745' }} />
                            🎨 PWA App Branding & Colors
                        </h5>
                        <small className="text-muted">Configure app name, colors, and visual appearance</small>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                        App Short Name for PWA
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="pwaShortName"
                                        value={formData.pwaShortName}
                                        onChange={handleInputChange}
                                        placeholder="Grindx"
                                        maxLength={12}
                                        style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                                            border: isDarkMode ? '1px solid #444' : '1px solid #ced4da',
                                            color: isDarkMode ? '#ffffff' : '#000000'
                                        }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Used for:</strong> Home screen app name (keep under 12 characters)<br/>
                                        <strong>💡 Example:</strong> "Grindx", "FITNESS", "GYMAPP"
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                        PWA Theme Color
                                    </Form.Label>
                                    <Form.Control
                                        type="color"
                                        name="pwaThemeColor"
                                        value={formData.pwaThemeColor}
                                        onChange={handleInputChange}
                                        style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                                            border: isDarkMode ? '1px solid #444' : '1px solid #ced4da',
                                            height: '50px'
                                        }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Controls:</strong> Browser UI color (address bar, status bar)<br/>
                                        <strong>💡 Tip:</strong> Use your brand's primary color
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                        PWA Background Color
                                    </Form.Label>
                                    <Form.Control
                                        type="color"
                                        name="pwaBackgroundColor"
                                        value={formData.pwaBackgroundColor}
                                        onChange={handleInputChange}
                                        style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                                            border: isDarkMode ? '1px solid #444' : '1px solid #ced4da',
                                            height: '50px'
                                        }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Used for:</strong> App background while loading<br/>
                                        <strong>💡 Tip:</strong> Usually white (#ffffff) or your app's background color
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* PWA SPLASH SCREEN */}
                <Card className="mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                    border: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                }}>
                    <Card.Header style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                    }}>
                        <h5 className="mb-0" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                            <FaRocket className="me-2" style={{ color: '#ffc107' }} />
                            🚀 PWA Splash Screen (Advanced)
                        </h5>
                        <small className="text-muted">Optional full-screen image shown while PWA is launching</small>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                        <FaImage className="me-2" />
                                        Splash Screen Image URL (Optional)
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="pwaSplashScreenImage"
                                        value={formData.pwaSplashScreenImage}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/splash-screen.png"
                                        style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                                            border: isDarkMode ? '1px solid #444' : '1px solid #ced4da',
                                            color: isDarkMode ? '#ffffff' : '#000000'
                                        }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Purpose:</strong> Full-screen image shown while your PWA launches from home screen<br/>
                                        <strong>💡 Best Size:</strong> 1125x2436 pixels (iPhone X ratio) for universal compatibility<br/>
                                        <strong>🎯 Advanced:</strong> Only needed for premium PWA experience - completely optional<br/>
                                        <strong>⚠️ Note:</strong> Large images may slow down app startup
                                    </Form.Text>
                                    {formData.pwaSplashScreenImage && (
                                        <div className="mt-3 p-3 border rounded" style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                                            borderColor: isDarkMode ? '#444' : '#dee2e6'
                                        }}>
                                            <div className="d-flex align-items-center">
                                                <Image
                                                    src={formData.pwaSplashScreenImage}
                                                    alt="Splash Screen Preview"
                                                    style={{ maxWidth: '100px', height: 'auto', maxHeight: '150px' }}
                                                    rounded
                                                />
                                                <div className="ms-3">
                                                    <strong>Splash Screen Preview</strong>
                                                    <br/><small className="text-muted">Scaled down for preview</small>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* SEO & SOCIAL MEDIA */}
                <Card className="mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                    border: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                }}>
                    <Card.Header style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
                    }}>
                        <h5 className="mb-0" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                            <FaGlobe className="me-2" style={{ color: '#6f42c1' }} />
                            🌐 Social Media Integration
                        </h5>
                        <small className="text-muted">Configure how your app appears when shared on social media</small>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                        <FaImage className="me-2" />
                                        Open Graph Image (Social Media Preview)
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ogImage"
                                        value={formData.ogImage}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/social-preview.jpg"
                                        style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                                            border: isDarkMode ? '1px solid #444' : '1px solid #ced4da',
                                            color: isDarkMode ? '#ffffff' : '#000000'
                                        }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Purpose:</strong> Image shown when your app is shared on Facebook, Twitter, LinkedIn, WhatsApp<br/>
                                        <strong>💡 Best Size:</strong> 1200x630 pixels (Facebook recommended ratio)<br/>
                                        <strong>🎯 Impact:</strong> Makes your app links look professional and increases click-through rates<br/>
                                        <strong>💡 Content:</strong> Should include your app name, key benefits, or attractive visuals
                                    </Form.Text>
                                    {formData.ogImage && (
                                        <div className="mt-3 p-3 border rounded" style={{
                                            backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                                            borderColor: isDarkMode ? '#444' : '#dee2e6'
                                        }}>
                                            <div className="d-flex align-items-center">
                                                <Image
                                                    src={formData.ogImage}
                                                    alt="Social Media Preview"
                                                    style={{ maxWidth: '200px', height: 'auto', maxHeight: '105px' }}
                                                    rounded
                                                />
                                                <div className="ms-3">
                                                    <strong>Social Media Preview</strong>
                                                    <br/><small className="text-muted">How it appears in social media links</small>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* SAVE BUTTON */}
                <div className="text-center">
                    <Button 
                        type="submit"
                        variant="success" 
                        size="lg"
                        disabled={updatingSettings}
                        className="px-5 py-3"
                        style={{
                            background: updatingSettings ? '#6c757d' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '1.1rem'
                        }}
                    >
                        {updatingSettings ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Saving & Applying Changes...
                            </>
                        ) : (
                            <>
                                <FaSave className="me-2" /> 
                                Save & Apply PWA Settings
                            </>
                        )}
                    </Button>
                    
                    <div className="mt-3">
                        <small className="text-muted">
                            <strong>Note:</strong> For basic app name and header logo, edit the <code>.env</code> file and restart the server.
                            These settings are for advanced PWA features and social media integration.
                        </small>
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default SystemGeneralManager;
