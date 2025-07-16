import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Image } from 'react-bootstrap';
import { FaSave, FaUpload, FaImage, FaMobile } from 'react-icons/fa';
import { useUpdateGeneralSettingsMutation, useGetGeneralSettingsQuery } from '../../slices/systemApiSlice';
import { toast } from 'react-toastify';
import Loader from '../Loader';

const SystemPWAManager = () => {
  const [pwaSettings, setPwaSettings] = useState({
    pwaIcon: '',
    pwaIconWithoutBackground: false,
    pwaShortName: '',
    pwaThemeColor: '',
    pwaBackgroundColor: '',
    pwaSplashScreenImage: ''
  });

  const [isDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const { data: generalSettings, isLoading: isLoadingSettings, refetch } = useGetGeneralSettingsQuery();
  const [updateGeneralSettings, { isLoading: isUpdating }] = useUpdateGeneralSettingsMutation();

  useEffect(() => {
    if (generalSettings) {
      setPwaSettings({
        pwaIcon: generalSettings.pwaIcon || '',
        pwaIconWithoutBackground: generalSettings.pwaIconWithoutBackground || false,
        pwaShortName: generalSettings.pwaShortName || 'GRINDX',
        pwaThemeColor: generalSettings.pwaThemeColor || '#4F46E5',
        pwaBackgroundColor: generalSettings.pwaBackgroundColor || '#ffffff',
        pwaSplashScreenImage: generalSettings.pwaSplashScreenImage || ''
      });
    }
  }, [generalSettings]);

  const handleInputChange = (field, value) => {
    setPwaSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateGeneralSettings(pwaSettings).unwrap();
      toast.success('PWA settings updated successfully!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update PWA settings');
    }
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

  if (isLoadingSettings) return <Loader />;

  return (
    <div>
      <Alert variant="info" className="mb-4">
        <strong>📱 PWA Settings:</strong> Configure your Progressive Web App (PWA) settings including icons, splash screens, and app behavior.
      </Alert>

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={6}>
            <Card style={cardStyle} className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaMobile className="me-2" />
                  App Icon Settings
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>PWA App Icon</Form.Label>
                  <Form.Control
                    type="text"
                    value={pwaSettings.pwaIcon}
                    onChange={(e) => handleInputChange('pwaIcon', e.target.value)}
                    style={inputStyle}
                    placeholder="Enter PWA icon URL or path"
                  />
                  <Form.Text className="text-muted">
                    Image should be 512x512 pixels for best results
                  </Form.Text>
                  {pwaSettings.pwaIcon && (
                    <div className="mt-2">
                      <Image
                        src={pwaSettings.pwaIcon}
                        alt="PWA Icon Preview"
                        style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                        rounded
                      />
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="pwaIconWithoutBackground"
                    label="Icon without background container"
                    checked={pwaSettings.pwaIconWithoutBackground}
                    onChange={(e) => handleInputChange('pwaIconWithoutBackground', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Check this if your icon should take the full space without a background container (transparent background recommended)
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card style={cardStyle} className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaImage className="me-2" />
                  App Appearance
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>App Short Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={pwaSettings.pwaShortName}
                    onChange={(e) => handleInputChange('pwaShortName', e.target.value)}
                    style={inputStyle}
                    placeholder="Short app name (12 chars max)"
                    maxLength={12}
                  />
                  <Form.Text className="text-muted">
                    Short name shown on home screen (keep it under 12 characters)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Theme Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={pwaSettings.pwaThemeColor}
                    onChange={(e) => handleInputChange('pwaThemeColor', e.target.value)}
                    style={inputStyle}
                  />
                  <Form.Text className="text-muted">
                    Primary theme color for the app
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Background Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={pwaSettings.pwaBackgroundColor}
                    onChange={(e) => handleInputChange('pwaBackgroundColor', e.target.value)}
                    style={inputStyle}
                  />
                  <Form.Text className="text-muted">
                    Background color used while app is loading
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card style={cardStyle} className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Splash Screen</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Splash Screen Image (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={pwaSettings.pwaSplashScreenImage}
                onChange={(e) => handleInputChange('pwaSplashScreenImage', e.target.value)}
                style={inputStyle}
                placeholder="Enter splash screen image URL"
              />
              <Form.Text className="text-muted">
                Image shown while app is loading (recommended: 1125x2436 pixels)
              </Form.Text>
              {pwaSettings.pwaSplashScreenImage && (
                <div className="mt-2">
                  <Image
                    src={pwaSettings.pwaSplashScreenImage}
                    alt="Splash Screen Preview"
                    style={{ maxWidth: '100px', height: 'auto' }}
                    rounded
                  />
                </div>
              )}
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="text-center">
          <Button 
            type="submit"
            variant="success" 
            size="lg"
            disabled={isUpdating}
            className="px-5"
          >
            {isUpdating ? (
              <>
                <Loader size="sm" /> Saving...
              </>
            ) : (
              <>
                <FaSave className="me-2" /> 
                Save PWA Settings
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SystemPWAManager;
