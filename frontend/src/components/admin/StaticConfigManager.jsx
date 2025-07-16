import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaSave, FaRedo, FaRocket } from 'react-icons/fa';
import { STATIC_APP_CONFIG, updateStaticConfig, getActiveConfigSync } from '../../config/staticAppConfig';

const StaticConfigManager = () => {
    const [config, setConfig] = useState(() => {
        const initialConfig = getActiveConfigSync();
        // Ensure colorScheme is never undefined
        return {
            ...initialConfig,
            colorScheme: initialConfig?.colorScheme || {
                primaryColor: '#4F46E5',
                secondaryColor: '#7C3AED'
            }
        };
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    // Safe colorScheme access to prevent undefined errors
    const safeColorScheme = config?.colorScheme || {
        primaryColor: '#4F46E5',
        secondaryColor: '#7C3AED'
    };

    // Safe access to all config properties
    const safeConfig = {
        siteName: config?.siteName || '',
        siteDescription: config?.siteDescription || '',
        siteKeywords: config?.siteKeywords || '',
        headerImage: config?.headerImage || '',
        faviconImage: config?.faviconImage || '',
        faviconSvgCode: config?.faviconSvgCode || '',
        ogImage: config?.ogImage || '',
        pwaShortName: config?.pwaShortName || '',
        pwaThemeColor: config?.pwaThemeColor || '#4F46E5',
        pwaBackgroundColor: config?.pwaBackgroundColor || '#ffffff',
        ...config
    };

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            // Handle nested objects like colorScheme.primaryColor
            const [parent, child] = field.split('.');
            setConfig(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSave = async () => {
        try {
            // Use the built-in updateStaticConfig which handles both local and API updates
            await updateStaticConfig(config);
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
            // Broadcast to all users via custom events
            broadcastConfigChange(config);
            
            // Force immediate refresh for instant changes
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error('Error saving config:', error);
        }
    };

    // Broadcast config changes to all users
    const broadcastConfigChange = (newConfig) => {
        // Store the timestamp of the change for polling detection
        localStorage.setItem('LAST_CONFIG_UPDATE', Date.now().toString());
        
        // Trigger immediate update event for current window
        window.dispatchEvent(new CustomEvent('instantConfigUpdate', { 
            detail: newConfig 
        }));
        
        // Also trigger the static config update event
        window.dispatchEvent(new CustomEvent('staticConfigUpdate', { 
            detail: newConfig 
        }));
        
        // Trigger storage event for cross-tab updates
        localStorage.setItem('STATIC_CONFIG_BROADCAST', JSON.stringify({
            config: newConfig,
            timestamp: Date.now()
        }));
        
        console.log('🔄 Broadcasting config changes to all users...', newConfig);
    };

    const handleReset = () => {
        setConfig(STATIC_APP_CONFIG);
        localStorage.removeItem('STATIC_CONFIG_OVERRIDE');
    };

    const cardStyle = {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        border: isDarkMode ? '1px solid #333' : '1px solid #dee2e6',
        color: isDarkMode ? '#ffffff' : '#000000'
    };

    const inputStyle = {
        backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
        border: isDarkMode ? '1px solid #444' : '1px solid #ced4da',
        color: isDarkMode ? '#ffffff' : '#000000'
    };

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-white d-flex align-items-center">
                    <FaRocket className="me-2" style={{ color: safeColorScheme.primaryColor }} />
                    Static Config Manager - INSTANT LOADING
                </h3>
                <div>
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="me-2"
                        onClick={handleReset}
                    >
                        <FaRedo className="me-1" /> Reset to Default
                    </Button>
                    <Button 
                        variant="success" 
                        size="sm"
                        onClick={handleSave}
                    >
                        <FaSave className="me-1" /> Save & Apply Instantly
                    </Button>
                </div>
            </div>

            {showSuccess && (
                <Alert variant="success" className="mb-3">
                    ✅ Settings saved! Page will refresh automatically for instant changes.
                </Alert>
            )}

            <Alert variant="info" className="mb-4">
                <strong>⚡ INSTANT LOADING:</strong> These settings are built into the app for maximum performance. 
                No API calls, no loading spinners - everything loads instantly!
            </Alert>

            <Alert variant="success" className="mb-4">
                <strong>🆕 NEW USER GUARANTEE:</strong> When you save changes here, ALL users (including brand new visitors) 
                will see your updates immediately. Use the testing tools below to verify this works perfectly.
            </Alert>

            <Row>
                <Col lg={6}>
                    <Card style={cardStyle} className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Basic App Settings</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Site Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={safeConfig.siteName}
                                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                                    style={inputStyle}
                                    placeholder="Enter site name"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Site Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={safeConfig.siteDescription}
                                    onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                                    style={inputStyle}
                                    placeholder="Enter site description"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Keywords</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={safeConfig.siteKeywords}
                                    onChange={(e) => handleInputChange('siteKeywords', e.target.value)}
                                    style={inputStyle}
                                    placeholder="fitness, gym, workout, health"
                                />
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={6}>
                    <Card style={cardStyle} className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Color Scheme</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Primary Color</Form.Label>
                                <div className="d-flex align-items-center">
                                    <Form.Control
                                        type="color"
                                        value={safeColorScheme.primaryColor}
                                        onChange={(e) => handleInputChange('colorScheme.primaryColor', e.target.value)}
                                        style={{ width: '60px', height: '40px', marginRight: '10px' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={safeColorScheme.primaryColor}
                                        onChange={(e) => handleInputChange('colorScheme.primaryColor', e.target.value)}
                                        style={inputStyle}
                                        placeholder="#4F46E5"
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Secondary Color</Form.Label>
                                <div className="d-flex align-items-center">
                                    <Form.Control
                                        type="color"
                                        value={safeColorScheme.secondaryColor}
                                        onChange={(e) => handleInputChange('colorScheme.secondaryColor', e.target.value)}
                                        style={{ width: '60px', height: '40px', marginRight: '10px' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={safeColorScheme.secondaryColor}
                                        onChange={(e) => handleInputChange('colorScheme.secondaryColor', e.target.value)}
                                        style={inputStyle}
                                        placeholder="#7C3AED"
                                    />
                                </div>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={6}>
                    <Card style={cardStyle} className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Images (Use URLs or Local Paths)</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Header Logo</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={safeConfig.headerImage}
                                    onChange={(e) => handleInputChange('headerImage', e.target.value)}
                                    style={inputStyle}
                                    placeholder="/images/header-logo.png"
                                />
                                <Form.Text className="text-muted">
                                    Place images in public/images/ for instant loading
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Favicon URL</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={safeConfig.faviconImage}
                                    onChange={(e) => handleInputChange('faviconImage', e.target.value)}
                                    style={inputStyle}
                                    placeholder="/favicon.ico"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>OG Image</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={safeConfig.ogImage}
                                    onChange={(e) => handleInputChange('ogImage', e.target.value)}
                                    style={inputStyle}
                                    placeholder="/images/og-image.png"
                                />
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={6}>
                    <Card style={cardStyle} className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">PWA Settings</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>PWA Short Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={safeConfig.pwaShortName}
                                    onChange={(e) => handleInputChange('pwaShortName', e.target.value)}
                                    style={inputStyle}
                                    placeholder="GRINDX"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>PWA Theme Color</Form.Label>
                                <div className="d-flex align-items-center">
                                    <Form.Control
                                        type="color"
                                        value={safeConfig.pwaThemeColor}
                                        onChange={(e) => handleInputChange('pwaThemeColor', e.target.value)}
                                        style={{ width: '60px', height: '40px', marginRight: '10px' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={safeConfig.pwaThemeColor}
                                        onChange={(e) => handleInputChange('pwaThemeColor', e.target.value)}
                                        style={inputStyle}
                                        placeholder="#4F46E5"
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>PWA Background Color</Form.Label>
                                <div className="d-flex align-items-center">
                                    <Form.Control
                                        type="color"
                                        value={safeConfig.pwaBackgroundColor}
                                        onChange={(e) => handleInputChange('pwaBackgroundColor', e.target.value)}
                                        style={{ width: '60px', height: '40px', marginRight: '10px' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={safeConfig.pwaBackgroundColor}
                                        onChange={(e) => handleInputChange('pwaBackgroundColor', e.target.value)}
                                        style={inputStyle}
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card style={cardStyle} className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">Custom SVG Favicon Code</h5>
                </Card.Header>
                <Card.Body>
                    <Form.Group>
                        <Form.Label>SVG Code (Optional - Override favicon image)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={8}
                            value={safeConfig.faviconSvgCode}
                            onChange={(e) => handleInputChange('faviconSvgCode', e.target.value)}
                            style={inputStyle}
                            placeholder="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>...</svg>"
                        />
                        <Form.Text className="text-muted">
                            Custom SVG favicon for maximum flexibility and instant loading
                        </Form.Text>
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* New User Experience Testing Section */}
            <Card style={cardStyle} className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">🧪 Test New User Experience</h5>
                </Card.Header>
                <Card.Body>
                    <Alert variant="warning" className="mb-3">
                        <strong>Test if new users see your changes:</strong> Use these tools to verify that users who visit your app for the first time (or in private/incognito mode) will see your latest settings.
                    </Alert>
                    
                    <Row>
                        <Col md={6} className="mb-3">
                            <Button 
                                variant="outline-primary" 
                                onClick={() => window.simulateNewUserInNewTab?.()}
                                className="w-100"
                            >
                                🆕 Open New Tab (Simulate New User)
                            </Button>
                            <small className="text-muted d-block mt-1">
                                Opens a new tab without cached config to test new user experience
                            </small>
                        </Col>
                        <Col md={6} className="mb-3">
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => window.debugConfigState?.()}
                                className="w-100"
                            >
                                🔍 Debug Config State
                            </Button>
                            <small className="text-muted d-block mt-1">
                                Check console for current config loading status
                            </small>
                        </Col>
                    </Row>
                    
                    <hr />
                    
                    <Button 
                        variant="outline-danger" 
                        onClick={() => window.clearAllConfigCache?.()}
                        size="sm"
                    >
                        🧹 Clear All Cache & Reload (Full New User Test)
                    </Button>
                    <small className="text-muted d-block mt-1">
                        Completely clears all cached settings and reloads to simulate a brand new user
                    </small>
                </Card.Body>
            </Card>

            <div className="text-center">
                <Button 
                    variant="success" 
                    size="lg"
                    onClick={handleSave}
                    className="px-5"
                >
                    <FaSave className="me-2" /> 
                    Save & Apply Changes Instantly
                </Button>
            </div>
        </div>
    );
};

export default StaticConfigManager; 