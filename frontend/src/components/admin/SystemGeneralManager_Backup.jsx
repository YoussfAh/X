import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaCheck, FaTimes, FaImage, FaGlobe, FaPalette } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetGeneralSettingsQuery, useUpdateGeneralSettingsMutation } from '../../slices/systemApiSlice';
import { getEffectiveIconUrl } from '../../utils/iconUtils';
import ImageUploader from './ImageUploader';

const SystemGeneralManager = () => {
    const [formData, setFormData] = useState({
        preserveIconRatio: true,
        pwaIconWithoutBackground: false,
        pwaSplashScreenImage: '',
        ogImage: ''
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
                siteName: settings.siteName || '',
                siteDescription: settings.siteDescription || '',
                siteKeywords: settings.siteKeywords || '',
                headerImage: settings.headerImage || '',
                faviconImage: settings.faviconImage || '',
                faviconSvgCode: settings.faviconSvgCode || '',
                preserveIconRatio: settings.preserveIconRatio !== undefined ? settings.preserveIconRatio : true,
                pwaIconWithoutBackground: settings.pwaIconWithoutBackground || false,
                pwaShortName: settings.pwaShortName || '',
                pwaThemeColor: settings.pwaThemeColor || '#000000',
                pwaBackgroundColor: settings.pwaBackgroundColor || '#ffffff',
                pwaSplashScreenImage: settings.pwaSplashScreenImage || '',
                ogImage: settings.ogImage || '',
                colorScheme: settings.colorScheme || {
                    primaryColor: '#4F46E5',
                    secondaryColor: '#7C3AED'
                }
            });
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith('colorScheme.')) {
            const colorProperty = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                colorScheme: {
                    ...prev.colorScheme,
                    [colorProperty]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            console.log('Form data being submitted:', formData);
            console.log('SVG Code length:', formData.faviconSvgCode?.length || 0);
            await updateSettings(formData).unwrap();
            
            // Force immediate refetch to ensure new data overrides old data
            await refetch();
            
            // Force update browser tab elements with new data immediately
            if (typeof window !== 'undefined') {
                // Import and use favicon utils to immediately update
                const { updateDynamicFavicon, updateTabTitle } = await import('../../utils/faviconUtils');
                
                // Immediately update tab title if siteName changed
                if (formData.siteName) {
                    updateTabTitle(formData.siteName, true); // Force update
                }
                
                // Immediately update favicon if changed
                updateDynamicFavicon(formData.faviconImage, formData.faviconSvgCode, formData.preserveIconRatio, true); // Force update
                
                console.log('🎯 Browser elements updated immediately with new data');
            }
            
            toast.success('General settings updated successfully!');
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error(error?.data?.message || 'Failed to update settings');
        }
    };

    // Helper function to get the icon source (either URL or SVG blob)
    const getIconSource = () => {
        return getEffectiveIconUrl(formData.faviconImage, formData.faviconSvgCode);
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
                    Loading general settings...
                </p>
            </div>
        );
    }

    if (settingsError) {
        return (
            <Alert variant="danger">
                <FaTimes className="me-2" />
                Failed to load general settings: {settingsError?.data?.message || 'Unknown error'}
            </Alert>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <h4 className="mb-2" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                    <FaGlobe className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#7952b3' }} />
                    System Settings - Advanced Configuration
                </h4>
                
                {/* INSTANT CONFIG REDIRECT NOTICE */}
                <Alert variant="warning" className="mb-4" style={{ 
                    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.1)' : '#fff3cd',
                    borderColor: isDarkMode ? 'rgba(255, 193, 7, 0.3)' : '#ffeaa7',
                    color: isDarkMode ? '#ffda6a' : '#856404'
                }}>
                    <div className="d-flex align-items-center">
                        <FaRocket className="me-2" style={{ fontSize: '1.2rem' }} />
                        <div>
                            <strong>⚡ INSTANT UPDATES AVAILABLE!</strong>
                            <p className="mb-2 mt-1">
                                For <strong>instant loading</strong> and <strong>real-time updates</strong> that apply to all users immediately, 
                                use the <strong>Static Config</strong> page instead of this section.
                            </p>
                            <small>
                                <strong>Static Config handles:</strong> Site name, description, keywords, logos, favicons, colors, PWA settings
                                <br/><strong>Benefits:</strong> ⚡ Instant loading • 🔄 Real-time updates • 👥 All users see changes immediately
                            </small>
                        </div>
                    </div>
                </Alert>

                <p className="text-muted mb-2">
                    This section contains legacy settings and advanced configurations that require database updates.
                    Most common branding settings have been moved to Static Config for better performance.
                </p>
            </div>

            <Card style={cardStyle} className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        {/* SECTION: Advanced PWA & Mobile Settings */}
                        <Row>
                            <Col xs={12}>
                                <h5 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    <FaImage className="me-2" />
                                    📱 Advanced PWA & Mobile Settings
                                </h5>
                                <p className="text-muted small mb-3">
                                    <strong>Advanced settings that complement the instant Static Config setup.</strong>
                                </p>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        <FaImage className="me-2" />
                                        🎯 Preserve Icon Aspect Ratio
                                    </Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="preserveIconRatio"
                                        name="preserveIconRatio"
                                        checked={formData.preserveIconRatio}
                                        onChange={handleInputChange}
                                        label="Maintain original icon proportions"
                                        style={{ color: isDarkMode ? '#ffffff' : '#212529' }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Effect:</strong> Prevents icon stretching on different screen sizes
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        <FaImage className="me-2" />
                                        � PWA Icon Without Background
                                    </Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="pwaIconWithoutBackground"
                                        name="pwaIconWithoutBackground"
                                        checked={formData.pwaIconWithoutBackground}
                                        onChange={handleInputChange}
                                        label="Use transparent background for PWA icons"
                                        style={{ color: isDarkMode ? '#ffffff' : '#212529' }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Effect:</strong> Makes PWA home screen icon transparent
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-4">
                                    <ImageUploader
                                        name="pwaSplashScreenImage"
                                        value={formData.pwaSplashScreenImage}
                                        onChange={handleInputChange}
                                        isDarkMode={isDarkMode}
                                        label={
                                            <span>
                                                <FaImage className="me-2" />
                                                🚀 PWA Splash Screen Image (Advanced)
                                            </span>
                                        }
                                        placeholder="Upload PWA splash screen or enter URL"
                                        helpText={
                                            <span>
                                                <strong>📍 Appears:</strong> When users launch your PWA from home screen
                                                <br/><strong>💡 Tip:</strong> Use a vertical image, recommended size 1242x2688px
                                                <br/><strong>🎯 Advanced Feature:</strong> Only needed for premium PWA experience
                                            </span>
                                        }
                                        previewSize={{ width: '100px', height: '180px' }}
                                        maxSizeInMB={3}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="my-4" style={{ borderColor: isDarkMode ? '#333' : '#dee2e6' }} />

                        {/* SECTION: Social Media & SEO */}
                        <Row>
                            <Col xs={12}>
                                <h5 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    <FaGlobe className="me-2" />
                                    🌐 Social Media & SEO (Advanced)
                                </h5>
                                <p className="text-muted small mb-3">
                                    <strong>Advanced social sharing and SEO configurations.</strong>
                                </p>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-4">
                                    <ImageUploader
                                        name="ogImage"
                                        value={formData.ogImage}
                                        onChange={handleInputChange}
                                        isDarkMode={isDarkMode}
                                        label={
                                            <span>
                                                <FaGlobe className="me-2" />
                                                📤 Open Graph (Social Share) Image
                                            </span>
                                        }
                                        placeholder="Upload social sharing image or enter URL"
                                        helpText={
                                            <span>
                                                <strong>📍 Appears in:</strong> Facebook, Twitter, LinkedIn, WhatsApp link previews
                                                <br/><strong>� Tip:</strong> Use 1200x630px for best results across all platforms
                                                <br/><strong>🎯 Advanced:</strong> Different from favicon - specifically for social sharing
                                            </span>
                                        }
                                        previewSize={{ width: '200px', height: '105px' }}
                                        maxSizeInMB={2}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                                    <small className="text-muted">
                                        <strong>🎯 Universal Icon Coverage:</strong><br/>
                                        • 🌐 Browser tab favicons (16x16, 32x32)<br/>
                                        • 📱 PWA home screen icons (192x192, 512x512)<br/>
                                        • 🚀 App launcher icons (all sizes)<br/>
                                        • 📊 Social media previews (when no OG image)<br/>
                                        • ⚙️ Admin interface branding<br/>
                                        <br/><strong>💎 Perfect Icon Specs:</strong><br/>
                                        • ✅ <strong>Size:</strong> 512x512px minimum<br/>
                                        • ✅ <strong>Format:</strong> PNG with transparency<br/>
                                        • ✅ <strong>Design:</strong> Simple, bold, recognizable<br/>
                                        • ❌ <strong>Avoid:</strong> Text-heavy or complex details
                                    </small>
                                </div>
                            </Col>
                        </Row>

                        <div className="text-center my-4 p-3" style={{ 
                            backgroundColor: isDarkMode ? 'rgba(108, 117, 125, 0.1)' : 'rgba(248, 249, 250, 0.8)',
                            borderRadius: '8px',
                            border: isDarkMode ? '1px dashed #495057' : '1px dashed #dee2e6'
                        }}>
                            <small className="text-muted">
                                <strong>🔄 ALTERNATIVE METHOD (Higher Priority)</strong><br/>
                                <span className="small">SVG code below will override any URL above</span>
                            </small>
                        </div>

                        <Row>
                            <Col xs={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        <FaImage className="me-2" />
                                        🏆 Premium SVG Logo Code (HIGHEST PRIORITY)
                                        {formData.faviconSvgCode && (
                                            <span className="badge bg-success ms-2">🎯 ACTIVE - THIS WILL BE USED</span>
                                        )}
                                        {!formData.faviconSvgCode && formData.faviconImage && (
                                            <span className="badge bg-info ms-2">📄 URL above will be used</span>
                                        )}
                                        {!formData.faviconSvgCode && !formData.faviconImage && (
                                            <span className="badge bg-secondary ms-2">🔄 Using defaults</span>
                                        )}
                                    </Form.Label>
                                    <div className="d-flex flex-column gap-2">
                                        <Form.Control
                                            as="textarea"
                                            rows={8}
                                            name="faviconSvgCode"
                                            value={formData.faviconSvgCode}
                                            onChange={handleInputChange}
                                            placeholder='Paste your SVG code here (e.g., <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#4F46E5"/></svg>)'
                                            style={{
                                                ...inputStyle,
                                                fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                                                fontSize: '0.85rem',
                                                lineHeight: '1.4',
                                                borderColor: formData.faviconSvgCode 
                                                    ? (isDarkMode ? '#28a745' : '#28a745') 
                                                    : inputStyle.borderColor,
                                                fontWeight: formData.faviconSvgCode ? '500' : 'normal'
                                            }}
                                            disabled={false}
                                        />
                                        {formData.faviconSvgCode && (
                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className="text-success">
                                                    ✅ {formData.faviconSvgCode.length} characters • SVG detected
                                                </small>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => setFormData(prev => ({ ...prev, faviconSvgCode: '' }))}
                                                    style={{ minWidth: '90px' }}
                                                >
                                                    🗑️ Clear SVG
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <Form.Text className="text-muted">
                                        {formData.faviconSvgCode 
                                            ? '🎯 <strong>PRIORITY ACTIVE:</strong> This SVG code will be used for ALL app icons, overriding any URL above and all old favicons.'
                                            : formData.faviconImage 
                                                ? '📄 The URL above will be used. Paste SVG code here to override it with vector graphics.'
                                                : '🎨 <strong>Premium Option:</strong> SVG code gives you complete control and perfect scaling at any size.'
                                        }
                                        <br/><strong>💡 SVG Benefits:</strong> Perfect quality at any size, smaller file size, customizable colors
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check 
                                        type="checkbox"
                                        id="preserveIconRatio"
                                        name="preserveIconRatio"
                                        checked={formData.preserveIconRatio}
                                        onChange={handleInputChange}
                                        label="Preserve Icon Aspect Ratio"
                                        style={{ color: isDarkMode ? '#ffffff' : '#212529' }}
                                    />
                                    <Form.Text className="text-muted">
                                        When enabled, icons maintain their original proportions. When disabled, icons fill the container completely.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <div className="mt-3">
                                    <small className="text-muted">
                                        <strong>Icon Aspect Ratio:</strong><br/>
                                        • ✅ <strong>Preserve</strong>: Icon keeps original shape, centered in container<br/>
                                        • ❌ <strong>Fill</strong>: Icon stretches to fill entire container<br/>
                                        • Best for most logos: Keep this checked
                                    </small>
                                </div>
                            </Col>
                        </Row>

                        {/* Social Media & SEO Preview Section */}
                        <Row>
                            <Col xs={12}>
                                <h6 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    📊 Social Media & SEO Preview Image
                                </h6>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploader
                                        name="ogImage"
                                        value={formData.ogImage}
                                        onChange={handleInputChange}
                                        isDarkMode={isDarkMode}
                                        label={
                                            <span>
                                                <FaImage className="me-2" />
                                                🌍 Open Graph Image (Social Sharing)
                                            </span>
                                        }
                                        placeholder="Upload social preview image or enter URL"
                                        helpText={
                                            <span>
                                                <strong>📍 Appears when sharing on:</strong> Facebook, Twitter, LinkedIn, WhatsApp, Discord
                                                <br/><strong>🔄 Fallback:</strong> Uses app icon above if empty
                                                <br/><strong>🔄 Replaces:</strong> REACT_APP_OG_IMAGE environment variable
                                                <br/><strong>🎯 Local Storage:</strong> Upload files for reliable social media previews
                                                <br/><strong>💡 Recommended:</strong> 1200x630px image for best results
                                            </span>
                                        }
                                        previewSize={{ width: '120px', height: '63px' }}
                                        maxSizeInMB={3}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <div className="mt-4 pt-2">
                                    <div className="p-3 rounded" style={{ 
                                        backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.05)',
                                        border: isDarkMode ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(255, 193, 7, 0.2)'
                                    }}>
                                        <small className="text-muted">
                                            <strong>📱 Social Media Coverage:</strong><br/>
                                            • 📘 Facebook link previews<br/>
                                            • 🐦 Twitter card images<br/>
                                            • 💼 LinkedIn article shares<br/>
                                            • 💬 WhatsApp chat previews<br/>
                                            • 🎮 Discord embeds<br/>
                                            • 📧 Email client previews<br/>
                                            <br/><strong>🎯 Perfect Size:</strong> 1200x630px (PNG/JPG)<br/>
                                            <strong>💡 Tip:</strong> Include your logo, app name, and key message
                                        </small>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <hr className="my-4" style={{ borderColor: isDarkMode ? '#333' : '#dee2e6' }} />
                        
                        {/* SECTION 3: PWA & Mobile Experience */}
                        <Row>
                            <Col xs={12}>
                                <h5 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    <FaGlobe className="me-2" />
                                    📱 PWA (Progressive Web App) Settings
                                </h5>
                                <div className="alert alert-success" style={{ 
                                    backgroundColor: isDarkMode ? 'rgba(25, 135, 84, 0.1)' : 'rgba(25, 135, 84, 0.1)',
                                    borderColor: isDarkMode ? 'rgba(25, 135, 84, 0.3)' : 'rgba(25, 135, 84, 0.3)',
                                    color: isDarkMode ? '#75b798' : '#0f5132'
                                }}>
                                    <small>
                                        <strong>🚀 PWA POWER:</strong> Transform your web app into a native-like mobile experience!
                                        Control home screen icons, app names, splash screens, and mobile browser themes.
                                    </small>
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        📱 PWA Home Screen Name
                                        <span className="small text-muted ms-2">({formData.pwaShortName.length}/12)</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="pwaShortName"
                                        value={formData.pwaShortName}
                                        onChange={handleInputChange}
                                        placeholder="Short name (e.g., GRINDX, FitPro, GymX)"
                                        style={{
                                            ...inputStyle,
                                            borderColor: formData.pwaShortName && formData.pwaShortName.length <= 12 
                                                ? '#28a745' 
                                                : formData.pwaShortName.length > 12 
                                                    ? '#dc3545' 
                                                    : inputStyle.borderColor
                                        }}
                                        maxLength={15}
                                    />
                                    <Form.Text className={formData.pwaShortName.length > 12 ? "text-danger" : "text-muted"}>
                                        <strong>📍 Appears under:</strong> Home screen icon when app is installed
                                        <br/><strong>📏 Limit:</strong> 12 characters max for best display
                                        {formData.pwaShortName.length > 12 && <><br/><strong>⚠️ Warning:</strong> Too long! May be truncated on some devices</>}
                                        <br/><strong>🔄 Replaces:</strong> REACT_APP_PWA_SHORT_NAME environment variable
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        🎨 PWA Theme Color (Mobile Status Bar)
                                    </Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <Form.Control
                                            type="color"
                                            name="pwaThemeColor"
                                            value={formData.pwaThemeColor}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '60px',
                                                height: '45px',
                                                border: '2px solid ' + (isDarkMode ? '#444' : '#ddd'),
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Form.Control
                                            type="text"
                                            name="pwaThemeColor"
                                            value={formData.pwaThemeColor}
                                            onChange={handleInputChange}
                                            placeholder="#000000"
                                            style={inputStyle}
                                            className="flex-grow-1"
                                        />
                                    </div>
                                    <Form.Text className="text-muted">
                                        <strong>📍 Controls:</strong> Mobile browser status bar, PWA title bar, system UI theming
                                        <br/><strong>📱 Visible on:</strong> iOS Safari address bar, Android Chrome status bar
                                        <br/><strong>🔄 Replaces:</strong> REACT_APP_PWA_THEME_COLOR environment variable
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        🌈 PWA Background Color (Splash Screen)
                                    </Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <Form.Control
                                            type="color"
                                            name="pwaBackgroundColor"
                                            value={formData.pwaBackgroundColor}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '60px',
                                                height: '45px',
                                                border: '2px solid ' + (isDarkMode ? '#444' : '#ddd'),
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Form.Control
                                            type="text"
                                            name="pwaBackgroundColor"
                                            value={formData.pwaBackgroundColor}
                                            onChange={handleInputChange}
                                            placeholder="#ffffff"
                                            style={inputStyle}
                                            className="flex-grow-1"
                                        />
                                    </div>
                                    <Form.Text className="text-muted">
                                        <strong>📍 Controls:</strong> App splash screen background when launching
                                        <br/><strong>🎯 Best practice:</strong> Match your app's main background color
                                        <br/><strong>🔄 Replaces:</strong> REACT_APP_PWA_BACKGROUND_COLOR environment variable
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <div className="mt-4 pt-2">
                                    <div className="p-3 rounded" style={{ 
                                        backgroundColor: isDarkMode ? 'rgba(13, 110, 253, 0.1)' : 'rgba(13, 110, 253, 0.05)',
                                        border: isDarkMode ? '1px solid rgba(13, 110, 253, 0.3)' : '1px solid rgba(13, 110, 253, 0.2)'
                                    }}>
                                        <small className="text-muted">
                                            <strong>🚀 Complete PWA Control:</strong><br/>
                                            • 📱 Home screen app name & icon<br/>
                                            • 🎨 Mobile status bar theming<br/>
                                            • 🌟 App launch splash screen<br/>
                                            • 🏠 App launcher branding<br/>
                                            • 📲 Install banner appearance<br/>
                                            • 🌐 Mobile browser integration<br/>
                                            <br/><strong>💡 Result:</strong> Your web app looks and feels like a native mobile app!
                                        </small>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check 
                                        type="checkbox"
                                        id="pwaIconWithoutBackground"
                                        name="pwaIconWithoutBackground"
                                        checked={formData.pwaIconWithoutBackground}
                                        onChange={handleInputChange}
                                        label={
                                            <span style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                                📱 Show Full Icon in PWA (No Background)
                                            </span>
                                        }
                                        style={{ color: isDarkMode ? '#ffffff' : '#212529' }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>✅ Enabled:</strong> Icon fills entire PWA launcher space without background color
                                        <br/><strong>❌ Disabled:</strong> Icon sits on background color with padding
                                        <br/><strong>💡 Best for:</strong> Icons with built-in backgrounds or full-coverage designs
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploader
                                        name="pwaSplashScreenImage"
                                        value={formData.pwaSplashScreenImage}
                                        onChange={handleInputChange}
                                        isDarkMode={isDarkMode}
                                        label="🌟 Splash Screen Logo (Optional)"
                                        placeholder="Upload splash logo or enter URL"
                                        helpText={
                                            <span>
                                                <strong>📍 Appears on:</strong> PWA splash screen when app is launching
                                                <br/><strong>🔄 Fallback:</strong> Uses main app icon if empty
                                                <br/><strong>💡 Tip:</strong> Use a larger, more detailed version of your logo
                                                <br/><strong>🎯 Local Storage:</strong> Upload files for instant loading without internet
                                            </span>
                                        }
                                        previewSize={{ width: '80px', height: '80px' }}
                                        maxSizeInMB={2}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="my-4" style={{ borderColor: isDarkMode ? '#333' : '#dee2e6' }} />

                        {/* SECTION 4: App Color Scheme */}
                        <Row>
                            <Col xs={12}>
                                <h5 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    <FaPalette className="me-2" />
                                    🎨 App Color Scheme & Theming
                                </h5>
                                <div className="alert alert-info" style={{ 
                                    backgroundColor: isDarkMode ? 'rgba(13, 110, 253, 0.1)' : 'rgba(13, 110, 253, 0.1)',
                                    borderColor: isDarkMode ? 'rgba(13, 110, 253, 0.3)' : 'rgba(13, 110, 253, 0.3)',
                                    color: isDarkMode ? '#6ea8fe' : '#084298'
                                }}>
                                    <small>
                                        <strong>🌈 GLOBAL COLOR CONTROL:</strong> These colors will replace ALL old theme colors throughout your app.
                                        Headers, buttons, links, and interactive elements will use these colors in both light and dark modes.
                                    </small>
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        🎯 Primary Color (BRAND MAIN)
                                        <span className="badge bg-primary ms-2 small">OVERRIDES ALL</span>
                                    </Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <Form.Control
                                            type="color"
                                            name="colorScheme.primaryColor"
                                            value={formData.colorScheme.primaryColor}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '60px',
                                                height: '45px',
                                                border: '2px solid ' + (isDarkMode ? '#444' : '#ddd'),
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Form.Control
                                            type="text"
                                            name="colorScheme.primaryColor"
                                            value={formData.colorScheme.primaryColor}
                                            onChange={handleInputChange}
                                            placeholder="#4F46E5"
                                            style={{
                                                ...inputStyle,
                                                fontFamily: 'monospace',
                                                fontWeight: '500'
                                            }}
                                            className="flex-grow-1"
                                        />
                                    </div>
                                    <Form.Text className="text-muted">
                                        <strong>📍 Controls:</strong> Header buttons, primary CTAs, active states, profile buttons
                                        <br/><strong>🎨 Used in:</strong> Navigation, main buttons, links, icons, progress bars
                                        <br/><strong>💡 Tip:</strong> Choose your main brand color that represents your app
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        ✨ Secondary Color (ACCENT)
                                        <span className="badge bg-secondary ms-2 small">GRADIENTS</span>
                                    </Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <Form.Control
                                            type="color"
                                            name="colorScheme.secondaryColor"
                                            value={formData.colorScheme.secondaryColor}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '60px',
                                                height: '45px',
                                                border: '2px solid ' + (isDarkMode ? '#444' : '#ddd'),
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Form.Control
                                            type="text"
                                            name="colorScheme.secondaryColor"
                                            value={formData.colorScheme.secondaryColor}
                                            onChange={handleInputChange}
                                            placeholder="#7C3AED"
                                            style={{
                                                ...inputStyle,
                                                fontFamily: 'monospace',
                                                fontWeight: '500'
                                            }}
                                            className="flex-grow-1"
                                        />
                                    </div>
                                    <Form.Text className="text-muted">
                                        <strong>📍 Controls:</strong> Gradient effects, hover states, accent elements, shadows
                                        <br/><strong>🎨 Used in:</strong> Button gradients, card shadows, animated effects
                                        <br/><strong>💡 Tip:</strong> Choose a complementary color that pairs well with primary
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="my-4" style={{ borderColor: isDarkMode ? '#333' : '#dee2e6' }} />
                        
                        {/* SECTION 5: Advanced Metadata & SEO */}
                        <Row>
                            <Col xs={12}>
                                <h6 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    🔍 Advanced SEO & Browser Metadata
                                </h6>
                                <div className="p-3 rounded" style={{ 
                                    backgroundColor: isDarkMode ? 'rgba(108, 117, 125, 0.1)' : 'rgba(248, 249, 250, 0.8)',
                                    border: isDarkMode ? '1px solid rgba(108, 117, 125, 0.3)' : '1px solid rgba(222, 226, 230, 0.6)'
                                }}>
                                    <small className="text-muted">
                                        <strong>🤖 Automatic Enhancements Applied:</strong><br/>
                                        • ✅ <strong>SEO Meta Tags:</strong> Author, robots, viewport optimization<br/>
                                        • ✅ <strong>Social Media:</strong> Enhanced Open Graph & Twitter Cards<br/>
                                        • ✅ <strong>PWA Integration:</strong> Mobile theme colors, app capabilities<br/>
                                        • ✅ <strong>Multi-Platform Icons:</strong> Apple Touch Icons, Android shortcuts<br/>
                                        • ✅ <strong>Browser Optimization:</strong> Multiple favicon sizes, mobile web app settings<br/>
                                        <br/><strong>💡 No Additional Configuration Needed:</strong> All metadata is automatically generated from your settings above.
                                    </small>
                                </div>
                            </Col>
                        </Row>

                        <hr className="my-4" style={{ borderColor: isDarkMode ? '#333' : '#dee2e6' }} />
                        
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3" 
                             style={{ 
                                backgroundColor: isDarkMode ? 'rgba(25, 135, 84, 0.1)' : 'rgba(25, 135, 84, 0.05)',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: isDarkMode ? '1px solid rgba(25, 135, 84, 0.3)' : '1px solid rgba(25, 135, 84, 0.2)'
                             }}>
                            <div className="text-center text-md-start">
                                <div className="small" style={{ color: isDarkMode ? '#75b798' : '#0f5132', fontWeight: '500' }}>
                                    🚀 <strong>READY TO APPLY CHANGES?</strong>
                                </div>
                                <div className="small text-muted mt-1">
                                    Your new branding will override all old settings and appear instantly across:<br/>
                                    Browser tabs • PWA apps • Social shares • Headers • Mobile themes
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={updatingSettings}
                                size="lg"
                                style={{
                                    background: updatingSettings 
                                        ? (isDarkMode ? '#666' : '#ccc')
                                        : (isDarkMode 
                                            ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                                            : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'),
                                    border: 'none',
                                    minWidth: '160px',
                                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                                    fontWeight: '600'
                                }}
                                className="px-4"
                            >
                                {updatingSettings ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Applying Changes...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="me-2" />
                                        🎯 Apply All Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {formData.headerImage && (
                <Card style={cardStyle} className="border-0 shadow-sm mt-3">
                    <Card.Body className="p-4">
                        <h6 style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>Header Image Preview</h6>
                        <div className="text-center">
                            <img
                                src={formData.headerImage}
                                alt="Header preview"
                                style={{
                                    maxHeight: '60px',
                                    maxWidth: '200px',
                                    objectFit: 'contain'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    </Card.Body>
                </Card>
            )}

            {(formData.faviconImage || formData.faviconSvgCode) && (
                <Card style={cardStyle} className="border-0 shadow-sm mt-3">
                    <Card.Body className="p-4">
                        <h6 style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                            <FaImage className="me-2" />
                            App Icon Preview
                        </h6>
                        <div className="text-center">
                            <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap">
                                {/* Browser Favicon Size */}
                                <div className="text-center">
                                    <div className="small text-muted mb-2">Browser Tab (32px)</div>
                                    <div 
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            border: isDarkMode ? '2px solid #444' : '2px solid #ddd',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isDarkMode ? '#2d3748' : '#f8f9fa',
                                            padding: '4px'
                                        }}
                                    >
                                        <img
                                            src={getIconSource()}
                                            alt="Favicon preview"
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                objectFit: formData.preserveIconRatio ? 'contain' : 'cover',
                                                borderRadius: '4px'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* PWA Home Screen Size */}
                                <div className="text-center">
                                    <div className="small text-muted mb-2">PWA Home Screen (192px)</div>
                                    <div 
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            border: isDarkMode ? '2px solid #444' : '2px solid #ddd',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: formData.pwaIconWithoutBackground 
                                                ? 'transparent' 
                                                : (formData.pwaBackgroundColor || '#ffffff'),
                                            padding: formData.pwaIconWithoutBackground ? '0px' : '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <img
                                            src={getIconSource()}
                                            alt="PWA icon preview"
                                            style={{
                                                width: formData.pwaIconWithoutBackground ? '80px' : '64px',
                                                height: formData.pwaIconWithoutBackground ? '80px' : '64px',
                                                objectFit: formData.preserveIconRatio ? 'contain' : 'cover',
                                                borderRadius: formData.pwaIconWithoutBackground ? '16px' : '8px'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="small text-muted mt-1">
                                        {formData.pwaShortName || formData.siteName || 'App'}
                                        {formData.pwaIconWithoutBackground && (
                                            <span className="text-success"> (Full)</span>
                                        )}
                                    </div>
                                </div>

                                {/* App Store Size */}
                                <div className="text-center">
                                    <div className="small text-muted mb-2">App Store (512px)</div>
                                    <div 
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            border: isDarkMode ? '2px solid #444' : '2px solid #ddd',
                                            borderRadius: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: formData.pwaBackgroundColor || '#ffffff',
                                            padding: '10px',
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        <img
                                            src={getIconSource()}
                                            alt="App store icon preview"
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                objectFit: formData.preserveIconRatio ? 'contain' : 'cover',
                                                borderRadius: '12px'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            )}

            <Card style={cardStyle} className="border-0 shadow-sm mt-3">
                <Card.Body className="p-4">
                    <h6 style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                        <FaPalette className="me-2" />
                        Color Scheme Preview
                    </h6>
                    <div className="d-flex gap-3 flex-wrap align-items-center">
                        <div className="text-center">
                            <div className="small text-muted mb-2">Profile Button</div>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: isDarkMode 
                                        ? `linear-gradient(135deg, rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.2) 0%, rgba(${parseInt(formData.colorScheme.secondaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(5, 7), 16)}, 0.15) 100%)`
                                        : `linear-gradient(135deg, rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.12) 0%, rgba(${parseInt(formData.colorScheme.secondaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(5, 7), 16)}, 0.08) 100%)`,
                                    boxShadow: isDarkMode 
                                        ? `0 2px 8px rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.2), 0 1px 4px rgba(${parseInt(formData.colorScheme.secondaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(5, 7), 16)}, 0.15)`
                                        : `0 2px 6px rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.1), 0 1px 3px rgba(${parseInt(formData.colorScheme.secondaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(5, 7), 16)}, 0.08)`,
                                    border: isDarkMode 
                                        ? `1px solid rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.3)`
                                        : `1px solid rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.15)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}
                            >
                                <FaGlobe 
                                    size={20} 
                                    color={isDarkMode 
                                        ? `rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.9)`
                                        : `rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.85)`
                                    }
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, calc(-50% + 1px))',
                                        filter: `drop-shadow(0 1px 2px rgba(${parseInt(formData.colorScheme.secondaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.secondaryColor.slice(5, 7), 16)}, 0.4))`
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <div className="small text-muted mb-2">Primary Button</div>
                            <div
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: `linear-gradient(135deg, ${formData.colorScheme.primaryColor}E6 0%, ${formData.colorScheme.secondaryColor}E6 100%)`,
                                    color: 'white',
                                    fontWeight: '500',
                                    border: 'none',
                                    fontSize: '14px',
                                    boxShadow: `0 2px 6px ${formData.colorScheme.primaryColor}30`
                                }}
                            >
                                Sample Button
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="small text-muted mb-2">Outline Button</div>
                            <div
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: `rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.05)`,
                                    color: `rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.8)`,
                                    fontWeight: '500',
                                    border: `1px solid rgba(${parseInt(formData.colorScheme.primaryColor.slice(1, 3), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(3, 5), 16)}, ${parseInt(formData.colorScheme.primaryColor.slice(5, 7), 16)}, 0.3)`,
                                    fontSize: '14px'
                                }}
                            >
                                Outline Button
                            </div>
                        </div>

                        <div className="ms-auto">
                            <div className="small text-muted mb-2">Colors</div>
                            <div className="d-flex gap-2">
                                <div
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        backgroundColor: formData.colorScheme.primaryColor,
                                        border: '1px solid rgba(0,0,0,0.1)'
                                    }}
                                    title={`Primary: ${formData.colorScheme.primaryColor}`}
                                />
                                <div
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        backgroundColor: formData.colorScheme.secondaryColor,
                                        border: '1px solid rgba(0,0,0,0.1)'
                                    }}
                                    title={`Secondary: ${formData.colorScheme.secondaryColor}`}
                                />
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default SystemGeneralManager; 