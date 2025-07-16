import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, InputGroup, Tab, Nav } from 'react-bootstrap';
import { FaLink, FaTrash, FaGlobe, FaImage, FaPlus, FaSave, FaUpload, FaExternalLinkAlt, FaImages, FaMobile, FaCrop, FaExpand, FaCog, FaClock, FaTachometerAlt } from 'react-icons/fa';
import ProductImageUploader from '../ProductImageUploader';
import { useGetCarouselSlidesQuery, useUpdateCarouselSlidesMutation, useGetCarouselSettingsQuery, useUpdateCarouselSettingsMutation } from '../../slices/systemApiSlice';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import Loader from '../Loader';

const SystemCarouselManager = () => {
    const { data: systemSlides, isLoading: isLoadingSlides, refetch } = useGetCarouselSlidesQuery();
    const [updateCarouselSlides, { isLoading: isUpdating }] = useUpdateCarouselSlidesMutation();
    const { data: carouselSettings, isLoading: isLoadingSettings, refetch: refetchSettings } = useGetCarouselSettingsQuery();
    const [updateCarouselSettings, { isLoading: isUpdatingSettings }] = useUpdateCarouselSettingsMutation();

    const [carouselSlides, setCarouselSlides] = useState([]);
    const [errors, setErrors] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    const [uploadMethod, setUploadMethod] = useState({});
    const [mobileUploadMethod, setMobileUploadMethod] = useState({});
    
    // Carousel settings state
    const [autoPlayInterval, setAutoPlayInterval] = useState(5000);
    const [transitionDuration, setTransitionDuration] = useState(200);

    // Update local slides when system slides data loads
    useEffect(() => {
        if (systemSlides) {
            // Ensure all slides have the mobileDisplayMode field with default value
            const slidesWithDefaults = systemSlides.map(slide => ({
                ...slide,
                mobileDisplayMode: slide.mobileDisplayMode || 'crop'
            }));
            setCarouselSlides(slidesWithDefaults);

            // Initialize upload methods
            const initialUploadMethods = {};
            const initialMobileUploadMethods = {};
            systemSlides.forEach((slide, index) => {
                initialUploadMethods[index] = 'uploader';
                initialMobileUploadMethods[index] = 'uploader';
            });
            setUploadMethod(initialUploadMethods);
            setMobileUploadMethod(initialMobileUploadMethods);
        }
    }, [systemSlides]);

    // Update carousel settings when data loads
    useEffect(() => {
        if (carouselSettings) {
            console.log('Loading carousel settings:', carouselSettings);
            setAutoPlayInterval(carouselSettings.autoPlayInterval || 5000);
            setTransitionDuration(carouselSettings.transitionDuration || 200);
        } else {
            // Set defaults if no settings are loaded
            console.log('No carousel settings found, using defaults');
            setAutoPlayInterval(5000);
            setTransitionDuration(200);
        }
    }, [carouselSettings]);

    // Detect theme changes
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
        return () => observer.disconnect();
    }, []);

    // Force initial fetch of settings
    useEffect(() => {
        refetchSettings();
    }, [refetchSettings]);

    const handleAddSlide = () => {
        const newSlide = {
            image: '',
            mobileImage: '',
            mobileDisplayMode: 'crop',  // Default to crop mode
            link: '/collections',  // Default internal link
            isExternal: false,
            alt: 'Carousel Image'  // Default alt text
        };
        const newSlides = [...carouselSlides, newSlide];
        setCarouselSlides(newSlides);
        setUploadMethod({ ...uploadMethod, [carouselSlides.length]: 'uploader' });
        setMobileUploadMethod({ ...mobileUploadMethod, [carouselSlides.length]: 'uploader' });
    };

    const handleRemoveSlide = (index) => {
        const newSlides = carouselSlides.filter((_, i) => i !== index);
        setCarouselSlides(newSlides);

        // Update uploadMethod to remove the deleted index
        const newUploadMethod = { ...uploadMethod };
        const newMobileUploadMethod = { ...mobileUploadMethod };
        delete newUploadMethod[index];
        delete newMobileUploadMethod[index];

        // Adjust indexes for the remaining slides
        const updatedUploadMethod = {};
        const updatedMobileUploadMethod = {};
        newSlides.forEach((_, i) => {
            const originalIndex = carouselSlides.findIndex((slide, j) => j !== index && slide === newSlides[i]);
            if (originalIndex !== -1 && newUploadMethod[originalIndex]) {
                updatedUploadMethod[i] = newUploadMethod[originalIndex];
                updatedMobileUploadMethod[i] = newMobileUploadMethod[originalIndex];
            } else {
                updatedUploadMethod[i] = 'uploader';
                updatedMobileUploadMethod[i] = 'uploader';
            }
        });

        setUploadMethod(updatedUploadMethod);
        setMobileUploadMethod(updatedMobileUploadMethod);
    };

    const handleImageUpload = (index, imageUrl) => {
        const newSlides = [...carouselSlides];
        newSlides[index] = {
            ...newSlides[index],
            image: imageUrl
        };
        setCarouselSlides(newSlides);
    };

    const handleMobileImageUpload = (index, imageUrl) => {
        const newSlides = [...carouselSlides];
        newSlides[index] = {
            ...newSlides[index],
            mobileImage: imageUrl
        };
        setCarouselSlides(newSlides);
    };

    const handleDirectImageUrl = (index, imageUrl) => {
        const newSlides = [...carouselSlides];
        newSlides[index] = {
            ...newSlides[index],
            image: imageUrl
        };
        setCarouselSlides(newSlides);
    };

    const handleDirectMobileImageUrl = (index, imageUrl) => {
        const newSlides = [...carouselSlides];
        newSlides[index] = {
            ...newSlides[index],
            mobileImage: imageUrl
        };
        setCarouselSlides(newSlides);
    };

    const handleInputChange = (index, field, value) => {
        const newSlides = [...carouselSlides];

        // Special handling for links
        if (field === 'link') {
            // If it's an external link, make sure it has a protocol
            if (newSlides[index].isExternal && value && !value.startsWith('http://') && !value.startsWith('https://')) {
                // Don't automatically add protocol in the input field - just for validation
                newSlides[index].link = value;
            } else {
                newSlides[index].link = value;
            }
        } else if (field === 'isExternal') {
            newSlides[index].isExternal = value;
        } else {
            newSlides[index][field] = value;
        }

        setCarouselSlides(newSlides);
    };

    const validateSlides = (slidesToValidate) => {
        const newErrors = {};
        let isValid = true;

        slidesToValidate.forEach((slide, index) => {
            if (!slide.image) {
                newErrors[`image-${index}`] = 'Image is required';
                isValid = false;
            }

            if (!slide.link) {
                newErrors[`link-${index}`] = 'Link is required';
                isValid = false;
            } else if (slide.isExternal) {
                // For external links, validate URL format
                try {
                    // Just doing a basic check - a full URL validation would be more complex
                    const url = slide.link.startsWith('http') ? slide.link : `https://${slide.link}`;
                    new URL(url);
                } catch (e) {
                    newErrors[`link-${index}`] = 'Invalid URL format';
                    isValid = false;
                }
            }

            if (!slide.alt) {
                newErrors[`alt-${index}`] = 'Alt text is required';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSaveSlides = async () => {
        // Process slides before saving to ensure they have correct formats
        const processedSlides = carouselSlides.map(slide => {
            let processedSlide = { ...slide };

            // Ensure external links have a protocol
            if (processedSlide.isExternal && processedSlide.link && !processedSlide.link.startsWith('http')) {
                processedSlide.link = `https://${processedSlide.link}`;
            }

            // Ensure internal links start with a slash
            if (!processedSlide.isExternal && processedSlide.link && !processedSlide.link.startsWith('/')) {
                processedSlide.link = `/${processedSlide.link}`;
            }

            return processedSlide;
        });

        if (validateSlides(processedSlides)) {
            try {
                await updateCarouselSlides(processedSlides).unwrap();
                showSuccessToast('System carousel slides updated successfully');
                // Refresh the data
                refetch();
            } catch (error) {
                console.error("Error saving slides:", error);
                showErrorToast(error?.data?.message || error.error || 'Failed to update carousel slides');
            }
        } else {
            showErrorToast('Please fix the validation errors before saving');
        }
    };

    // Function to test a link
    const handleTestLink = (link, isExternal) => {
        // Format the link properly first
        let formattedLink = link;

        if (isExternal && !link.startsWith('http')) {
            formattedLink = `https://${link}`;
        } else if (!isExternal && !link.startsWith('/')) {
            formattedLink = `/${link}`;
        }

        // Open the link in a new tab
        window.open(formattedLink, '_blank', 'noopener');
    };

    const handleSaveCarouselSettings = async () => {
        try {
            const settings = {
                autoPlayInterval: Math.max(1000, Math.min(30000, autoPlayInterval)),
                transitionDuration: Math.max(50, Math.min(3000, transitionDuration))
            };
            
            console.log('Saving carousel settings:', settings);
            const result = await updateCarouselSettings(settings).unwrap();
            console.log('Saved carousel settings result:', result);
            
            // Update local state with the saved values to ensure consistency
            setAutoPlayInterval(result.autoPlayInterval);
            setTransitionDuration(result.transitionDuration);
            
            showSuccessToast(`Carousel settings updated: ${(result.autoPlayInterval/1000).toFixed(1)}s autoplay, ${result.transitionDuration}ms transition`);
            
            // Force refetch to ensure UI reflects saved data
            await refetchSettings();
        } catch (error) {
            console.error("Error saving carousel settings:", error);
            showErrorToast(error?.data?.message || error.error || 'Failed to update carousel settings');
        }
    };

    // Define theme-based styles
    const cardStyle = {
        background: isDarkMode ? '#000000' : '#fff',
        borderColor: isDarkMode ? '#222222' : '#dee2e6',
        boxShadow: isDarkMode ? '0 4px 8px rgba(0, 0, 0, 0.5)' : '0 4px 8px rgba(0, 0, 0, 0.05)',
    };

    const cardHeaderStyle = {
        background: isDarkMode ? '#111111' : '#f8f9fa',
        borderBottomColor: isDarkMode ? '#222222' : '#dee2e6',
        color: isDarkMode ? '#FFFFFF' : '#333'
    };

    const tabNavStyle = {
        borderBottom: isDarkMode ? '1px solid #222222' : '1px solid #dee2e6',
    };

    const activeTabStyle = {
        background: isDarkMode ? '#222222' : '#ffffff',
        borderColor: isDarkMode ? '#9966FF' : '#dee2e6',
        color: isDarkMode ? '#FFFFFF' : '#495057',
    };

    const inactiveTabStyle = {
        background: 'transparent',
        borderColor: 'transparent',
        color: isDarkMode ? '#9966FF' : '#6c757d',
    };

    const primaryButtonStyle = {
        background: isDarkMode ? '#9966FF' : '#6f42c1',
        borderColor: isDarkMode ? '#8855EE' : '#6610f2',
    };

    const secondaryButtonStyle = {
        background: isDarkMode ? '#222222' : '#e9ecef',
        borderColor: isDarkMode ? '#333333' : '#ced4da',
        color: isDarkMode ? '#FFFFFF' : '#495057',
    };

    const dangerButtonStyle = {
        background: isDarkMode ? '#FF3333' : '#dc3545',
        borderColor: isDarkMode ? '#EE2222' : '#dc3545',
    };

    const successButtonStyle = {
        background: isDarkMode ? '#00AA66' : '#28a745',
        borderColor: isDarkMode ? '#009955' : '#28a745',
    };

    if (isLoadingSlides || isLoadingSettings) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Loader />
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                <div>
                    <h3 className="mb-1 d-flex align-items-center fs-4">
                        <FaImages className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#6f42c1' }} />
                        System Carousel
                    </h3>
                    <p className="text-muted mb-0 small" style={{ color: isDarkMode ? '#AAAAAA' : '#6c757d' }}>
                        These slides will be shown to all users.
                    </p>
                </div>
                <Button
                    onClick={handleSaveSlides}
                    disabled={isUpdating}
                    style={successButtonStyle}
                    className="d-flex align-items-center"
                    size="sm"
                >
                    {isUpdating ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <FaSave className="me-2" /> Save All
                        </>
                    )}
                </Button>
            </div>

            {/* Carousel Settings Section */}
            <Card className="mb-4" style={cardStyle}>
                <Card.Header style={cardHeaderStyle} className="py-3">
                    <h5 className="mb-0 d-flex align-items-center fs-6">
                        <FaCog className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#6f42c1' }} />
                        Carousel Settings
                    </h5>
                    <small className="text-muted">
                        Current: {(autoPlayInterval / 1000).toFixed(1)}s autoplay, {transitionDuration}ms transition
                    </small>
                </Card.Header>
                <Card.Body className="p-3">
                    <Row className="g-3">
                        <Col xs={12} lg={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="d-flex align-items-center justify-content-between mb-2">
                                    <span className="d-flex align-items-center">
                                        <FaClock className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#6f42c1' }} />
                                        <span className="fw-semibold">Auto-play Speed</span>
                                    </span>
                                    <span style={{ 
                                        color: isDarkMode ? '#9966FF' : '#6f42c1',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: isDarkMode ? 'rgba(153, 102, 255, 0.1)' : 'rgba(111, 66, 193, 0.1)'
                                    }}>
                                        {(autoPlayInterval / 1000).toFixed(1)}s
                                    </span>
                                </Form.Label>
                                <div className="mb-2">
                                    <Form.Range
                                        min="1000"
                                        max="30000"
                                        step="500"
                                        value={autoPlayInterval}
                                        onChange={(e) => {
                                            const newValue = parseInt(e.target.value);
                                            console.log('Auto-play interval changed to:', newValue);
                                            setAutoPlayInterval(newValue);
                                        }}
                                        className="w-100"
                                        style={{
                                            height: '8px',
                                            background: isDarkMode ? '#222' : '#e9ecef'
                                        }}
                                    />
                                    <div className="d-flex justify-content-between mt-1">
                                        <small className="text-muted">1s</small>
                                        <small className="text-muted">15s</small>
                                        <small className="text-muted">30s</small>
                                    </div>
                                </div>
                                <Form.Text className="text-muted small">
                                    ⏱️ How long each slide is displayed before automatically advancing
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col xs={12} lg={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="d-flex align-items-center justify-content-between mb-2">
                                    <span className="d-flex align-items-center">
                                        <FaTachometerAlt className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#6f42c1' }} />
                                        <span className="fw-semibold">Transition Speed</span>
                                    </span>
                                    <span style={{ 
                                        color: isDarkMode ? '#9966FF' : '#6f42c1',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: isDarkMode ? 'rgba(153, 102, 255, 0.1)' : 'rgba(111, 66, 193, 0.1)'
                                    }}>
                                        {transitionDuration < 1000 ? `${transitionDuration}ms` : `${(transitionDuration / 1000).toFixed(1)}s`}
                                    </span>
                                </Form.Label>
                                <div className="mb-2">
                                    <Form.Range
                                        min="50"
                                        max="3000"
                                        step="50"
                                        value={transitionDuration}
                                        onChange={(e) => {
                                            const newValue = parseInt(e.target.value);
                                            console.log('Transition duration changed to:', newValue);
                                            setTransitionDuration(newValue);
                                        }}
                                        className="w-100"
                                        style={{
                                            height: '8px',
                                            background: isDarkMode ? '#222' : '#e9ecef'
                                        }}
                                    />
                                    <div className="d-flex justify-content-between mt-1">
                                        <small className="text-muted">50ms</small>
                                        <small className="text-muted">1.5s</small>
                                        <small className="text-muted">3s</small>
                                    </div>
                                </div>
                                <Form.Text className="text-muted small">
                                    ⚡ How fast slides animate between each other (Lower = snappy, Higher = smooth)
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 pt-2">
                        <div className="d-flex flex-wrap gap-2 small text-muted">
                            <span>💡 <strong>Tip:</strong> Changes apply instantly to live carousels</span>
                        </div>
                        <Button
                            onClick={handleSaveCarouselSettings}
                            disabled={isUpdatingSettings}
                            style={primaryButtonStyle}
                            className="d-flex align-items-center"
                            size="sm"
                        >
                            {isUpdatingSettings ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="me-2" /> Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {carouselSlides.length === 0 ? (
                <div className="text-center py-4" style={{
                    background: isDarkMode ? '#000000' : '#f8f9fa',
                    borderRadius: '8px',
                    padding: '1.5rem 1rem',
                    marginBottom: '1rem',
                    border: isDarkMode ? '1px solid #222222' : '1px solid #dee2e6'
                }}>
                    <FaImages size={48} style={{ color: isDarkMode ? '#9966FF' : '#6f42c1', opacity: 0.7, marginBottom: '1rem' }} />
                    <h4 className="fs-5">No carousel slides yet</h4>
                    <p style={{ color: isDarkMode ? '#AAAAAA' : '#6c757d' }} className="small">
                        Create hero images for all users.
                    </p>
                    <Button
                        style={primaryButtonStyle}
                        onClick={handleAddSlide}
                        className="mt-2"
                        size="sm"
                    >
                        <FaPlus className="me-2" /> Add First Slide
                    </Button>
                </div>
            ) : (
                <>
                    {carouselSlides.map((slide, index) => (
                        <Card key={index} className="mb-3" style={cardStyle}>
                            <Card.Header style={cardHeaderStyle} className="d-flex justify-content-between align-items-center py-2">
                                <h5 className="mb-0 d-flex align-items-center fs-6">
                                    <FaImage className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#6f42c1' }} />
                                    Slide {index + 1}
                                </h5>
                                <Button
                                    style={dangerButtonStyle}
                                    size="sm"
                                    onClick={() => handleRemoveSlide(index)}
                                    className="d-flex align-items-center py-1 px-2"
                                >
                                    <FaTrash className="me-1" />
                                    <span className="d-none d-sm-inline">Remove</span>
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <Row>
                                    {/* Desktop/Main Image Section */}
                                    <Col xs={12} lg={6} className="mb-3">
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center flex-wrap mb-2">
                                                <Form.Label className="mb-0">
                                                    <span><FaImage className="me-1" /> Desktop Image</span>
                                                </Form.Label>
                                                <div className="d-flex mt-1 mt-sm-0">
                                                    <Button
                                                        variant={uploadMethod[index] === 'uploader' ? 'primary' : 'outline-primary'}
                                                        size="sm"
                                                        className="me-2 py-1 px-2"
                                                        style={uploadMethod[index] === 'uploader' ? primaryButtonStyle : {}}
                                                        onClick={() => setUploadMethod({ ...uploadMethod, [index]: 'uploader' })}
                                                    >
                                                        <FaUpload className="me-1" />
                                                        <span className="d-none d-sm-inline">Upload</span>
                                                    </Button>
                                                    <Button
                                                        variant={uploadMethod[index] === 'url' ? 'primary' : 'outline-primary'}
                                                        size="sm"
                                                        className="py-1 px-2"
                                                        style={uploadMethod[index] === 'url' ? primaryButtonStyle : {}}
                                                        onClick={() => setUploadMethod({ ...uploadMethod, [index]: 'url' })}
                                                    >
                                                        <FaLink className="me-1" />
                                                        <span className="d-none d-sm-inline">URL</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            {uploadMethod[index] === 'url' ? (
                                                <div>
                                                    <InputGroup className="mb-3">
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="https://example.com/image.jpg"
                                                            value={slide.image}
                                                            onChange={(e) => handleDirectImageUrl(index, e.target.value)}
                                                            isInvalid={!!errors[`image-${index}`]}
                                                            size="sm"
                                                        />
                                                        {slide.image && (
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => window.open(slide.image, '_blank')}
                                                            >
                                                                <FaExternalLinkAlt />
                                                                <span className="d-none d-sm-inline">View</span>
                                                            </Button>
                                                        )}
                                                    </InputGroup>

                                                    {slide.image && (
                                                        <div className="mt-2 mb-3">
                                                            <img
                                                                src={slide.image}
                                                                alt="Desktop Preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: 'auto',
                                                                    borderRadius: '8px',
                                                                    border: `1px solid ${isDarkMode ? '#222222' : '#dee2e6'}`
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {slide.image ? (
                                                        <div className="position-relative">
                                                            <img
                                                                src={slide.image}
                                                                alt="Desktop Preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: 'auto',
                                                                    borderRadius: '8px',
                                                                    border: `1px solid ${isDarkMode ? '#222222' : '#dee2e6'}`
                                                                }}
                                                            />
                                                            <Button
                                                                style={secondaryButtonStyle}
                                                                size="sm"
                                                                className="position-absolute top-0 end-0 m-2 py-1 px-2"
                                                                onClick={() => handleImageUpload(index, '')}
                                                            >
                                                                <FaUpload className="me-1" />
                                                                <span className="d-none d-sm-inline">Change</span>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <ProductImageUploader
                                                            onImageUploaded={(url) => handleImageUpload(index, url)}
                                                            initialImage={slide.image}
                                                            label="Desktop Carousel Image"
                                                        />
                                                    )}
                                                </>
                                            )}

                                            {errors[`image-${index}`] && (
                                                <Alert variant="danger" className="mt-2 py-1 px-2 small">
                                                    {errors[`image-${index}`]}
                                                </Alert>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Mobile Image Section */}
                                    <Col xs={12} lg={6} className="mb-3">
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center flex-wrap mb-2">
                                                <Form.Label className="mb-0">
                                                    <span><FaMobile className="me-1" /> Mobile Image <span className="text-muted small">(Optional)</span></span>
                                                </Form.Label>
                                                <div className="d-flex mt-1 mt-sm-0">
                                                    <Button
                                                        variant={mobileUploadMethod[index] === 'uploader' ? 'primary' : 'outline-primary'}
                                                        size="sm"
                                                        className="me-2 py-1 px-2"
                                                        style={mobileUploadMethod[index] === 'uploader' ? primaryButtonStyle : {}}
                                                        onClick={() => setMobileUploadMethod({ ...mobileUploadMethod, [index]: 'uploader' })}
                                                    >
                                                        <FaUpload className="me-1" />
                                                        <span className="d-none d-sm-inline">Upload</span>
                                                    </Button>
                                                    <Button
                                                        variant={mobileUploadMethod[index] === 'url' ? 'primary' : 'outline-primary'}
                                                        size="sm"
                                                        className="py-1 px-2"
                                                        style={mobileUploadMethod[index] === 'url' ? primaryButtonStyle : {}}
                                                        onClick={() => setMobileUploadMethod({ ...mobileUploadMethod, [index]: 'url' })}
                                                    >
                                                        <FaLink className="me-1" />
                                                        <span className="d-none d-sm-inline">URL</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            {mobileUploadMethod[index] === 'url' ? (
                                                <div>
                                                    <InputGroup className="mb-3">
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="https://example.com/mobile-image.jpg"
                                                            value={slide.mobileImage || ''}
                                                            onChange={(e) => handleDirectMobileImageUrl(index, e.target.value)}
                                                            size="sm"
                                                        />
                                                        {slide.mobileImage && (
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => window.open(slide.mobileImage, '_blank')}
                                                            >
                                                                <FaExternalLinkAlt />
                                                                <span className="d-none d-sm-inline">View</span>
                                                            </Button>
                                                        )}
                                                    </InputGroup>

                                                    {slide.mobileImage && (
                                                        <div className="mt-2 mb-3">
                                                            <img
                                                                src={slide.mobileImage}
                                                                alt="Mobile Preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: 'auto',
                                                                    borderRadius: '8px',
                                                                    border: `1px solid ${isDarkMode ? '#222222' : '#dee2e6'}`,
                                                                    aspectRatio: '9/16',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {slide.mobileImage ? (
                                                        <div className="position-relative">
                                                            <img
                                                                src={slide.mobileImage}
                                                                alt="Mobile Preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: 'auto',
                                                                    borderRadius: '8px',
                                                                    border: `1px solid ${isDarkMode ? '#222222' : '#dee2e6'}`,
                                                                    aspectRatio: '9/16',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                            <Button
                                                                style={secondaryButtonStyle}
                                                                size="sm"
                                                                className="position-absolute top-0 end-0 m-2 py-1 px-2"
                                                                onClick={() => handleMobileImageUpload(index, '')}
                                                            >
                                                                <FaUpload className="me-1" />
                                                                <span className="d-none d-sm-inline">Change</span>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <ProductImageUploader
                                                                onImageUploaded={(url) => handleMobileImageUpload(index, url)}
                                                                initialImage={slide.mobileImage}
                                                                label="Mobile Carousel Image"
                                                            />
                                                            <Form.Text className="text-muted small mt-1">
                                                                Optimized for phone screens (taller aspect ratio). If not provided, desktop image will be used.
                                                            </Form.Text>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Mobile Display Mode Control */}
                                            <div className="mt-3">
                                                <Form.Label className="mb-2 small">
                                                    <FaMobile className="me-1" /> Mobile Display Mode
                                                </Form.Label>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant={slide.mobileDisplayMode === 'crop' ? 'primary' : 'outline-primary'}
                                                        size="sm"
                                                        className="d-flex align-items-center"
                                                        style={slide.mobileDisplayMode === 'crop' ? primaryButtonStyle : {}}
                                                        onClick={() => handleInputChange(index, 'mobileDisplayMode', 'crop')}
                                                    >
                                                        <FaCrop className="me-1" />
                                                        <span>Crop to Fill</span>
                                                    </Button>
                                                    <Button
                                                        variant={slide.mobileDisplayMode === 'fit' ? 'primary' : 'outline-primary'}
                                                        size="sm"
                                                        className="d-flex align-items-center"
                                                        style={slide.mobileDisplayMode === 'fit' ? primaryButtonStyle : {}}
                                                        onClick={() => handleInputChange(index, 'mobileDisplayMode', 'fit')}
                                                    >
                                                        <FaExpand className="me-1" />
                                                        <span>Show Full Image</span>
                                                    </Button>
                                                </div>
                                                <Form.Text className="text-muted small mt-1">
                                                    <strong>Crop to Fill:</strong> Image fills screen but may be cropped. <strong>Show Full:</strong> Entire image visible with no distortion.
                                                </Form.Text>
                                            </div>

                                            {/* Image Size Guidance */}
                                            <div className="mt-3 p-3 rounded" style={{
                                                background: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                                                border: `1px solid ${isDarkMode ? '#333' : '#e9ecef'}`
                                            }}>
                                                <div className="d-flex align-items-center mb-2">
                                                    <FaImage className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#6f42c1' }} />
                                                    <small className="fw-bold">📱 Optimal Mobile Image Sizes</small>
                                                </div>
                                                <div className="small text-muted">
                                                    <div className="mb-1">
                                                        <strong>For "Crop to Fill" mode:</strong>
                                                        <br />• Best: 1080×1920px (9:16 ratio - Instagram Story size)
                                                        <br />• Good: 720×1280px or 1125×2000px
                                                    </div>
                                                    <div>
                                                        <strong>For "Show Full Image" mode:</strong>
                                                        <br />• Square: 1080×1080px (Instagram Post size)
                                                        <br />• Landscape: 1200×800px (3:2 ratio)
                                                        <br />• Portrait: Any ratio - image will scale perfectly
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col xs={12} md={6}>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="mb-1 small">
                                                <FaLink className="me-1" /> Link
                                            </Form.Label>
                                            <InputGroup size="sm">
                                                <Form.Control
                                                    type="text"
                                                    placeholder={slide.isExternal ? "https://example.com" : "/collections/123"}
                                                    value={slide.link}
                                                    onChange={(e) => handleInputChange(index, 'link', e.target.value)}
                                                    isInvalid={!!errors[`link-${index}`]}
                                                    size="sm"
                                                />
                                                {slide.link && (
                                                    <Button
                                                        style={secondaryButtonStyle}
                                                        size="sm"
                                                        onClick={() => handleTestLink(slide.link, slide.isExternal)}
                                                    >
                                                        <FaExternalLinkAlt />
                                                        <span className="d-none d-sm-inline ms-1">Test</span>
                                                    </Button>
                                                )}
                                            </InputGroup>
                                            <Form.Control.Feedback type="invalid" className="small">
                                                {errors[`link-${index}`]}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Form.Group className="mb-2">
                                            <Form.Check
                                                type="switch"
                                                id={`external-${index}`}
                                                label={<><FaGlobe className="me-1" /> <span className="small">External Link</span></>}
                                                checked={slide.isExternal}
                                                onChange={(e) => handleInputChange(index, 'isExternal', e.target.checked)}
                                                size="sm"
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-0">
                                            <Form.Label className="mb-1 small">Alt Text</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Describe image content"
                                                value={slide.alt}
                                                onChange={(e) => handleInputChange(index, 'alt', e.target.value)}
                                                isInvalid={!!errors[`alt-${index}`]}
                                                size="sm"
                                            />
                                            <Form.Control.Feedback type="invalid" className="small">
                                                {errors[`alt-${index}`]}
                                            </Form.Control.Feedback>
                                            <Form.Text className="text-muted small">
                                                Text for screen readers
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}

                    <div className="d-flex flex-column flex-sm-row justify-content-between mb-4 gap-2">
                        <Button
                            style={primaryButtonStyle}
                            onClick={handleAddSlide}
                            className="d-flex align-items-center justify-content-center"
                            size="sm"
                        >
                            <FaPlus className="me-2" /> Add Slide
                        </Button>

                        <Button
                            style={successButtonStyle}
                            onClick={handleSaveSlides}
                            disabled={isUpdating}
                            className="d-flex align-items-center justify-content-center"
                            size="sm"
                        >
                            {isUpdating ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="me-2" /> Save All Slides
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SystemCarouselManager; 