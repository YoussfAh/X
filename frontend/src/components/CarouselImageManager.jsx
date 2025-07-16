import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, InputGroup } from 'react-bootstrap';
import { FaLink, FaTrash, FaGlobe, FaImage, FaPlus, FaSave, FaUpload, FaExternalLinkAlt } from 'react-icons/fa';
import ProductImageUploader from './ProductImageUploader';

const CarouselImageManager = ({ slides = [], onSave }) => {
    const [carouselSlides, setCarouselSlides] = useState(slides);
    const [errors, setErrors] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    const [isSaving, setIsSaving] = useState(false);

    // Update local slides when props change
    useEffect(() => {
        setCarouselSlides(slides);
    }, [slides]);

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

    // Log when slides change for debugging
    useEffect(() => {
        console.log("Carousel slides in component:", carouselSlides);
    }, [carouselSlides]);

    const handleAddSlide = () => {
        const newSlide = {
            image: '',
            link: '/collections',  // Default internal link
            isExternal: false,
            alt: 'Carousel Image'  // Default alt text
        };
        const newSlides = [...carouselSlides, newSlide];
        setCarouselSlides(newSlides);
    };

    const handleRemoveSlide = (index) => {
        const newSlides = carouselSlides.filter((_, i) => i !== index);
        setCarouselSlides(newSlides);
        handleSaveSlides(newSlides);
    };

    const handleImageUpload = (index, imageUrl) => {
        console.log(`Image uploaded for slide ${index}:`, imageUrl);
        const newSlides = [...carouselSlides];
        newSlides[index] = {
            ...newSlides[index],
            image: imageUrl
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

            // When toggling to external, ensure the link has a protocol for validation
            if (value && newSlides[index].link && !newSlides[index].link.startsWith('http://') && !newSlides[index].link.startsWith('https://')) {
                // Don't update the input field here
            } else if (!value && newSlides[index].link && (newSlides[index].link.startsWith('http://') || newSlides[index].link.startsWith('https://'))) {
                // For internal links, you could strip the protocol, but that might not always be desired
            }
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

    const handleSaveSlides = async (slidesToSave = carouselSlides) => {
        console.log("Trying to save slides:", slidesToSave);

        // Process slides before saving to ensure they have correct formats
        const processedSlides = slidesToSave.map(slide => {
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
            setIsSaving(true);
            try {
                await onSave(processedSlides);
                console.log("Slides saved successfully:", processedSlides);
                setIsSaving(false);
            } catch (error) {
                console.error("Error saving slides:", error);
                setIsSaving(false);
                // Error will be handled by the parent component
            }
        } else {
            console.warn("Validation failed for slides");
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

    return (
        <div>
            {carouselSlides.length === 0 ? (
                <div className="text-center mb-4">
                    <Alert variant={isDarkMode ? 'dark' : 'light'}>
                        No carousel slides yet. Click "Add New Slide" to get started.
                    </Alert>
                    <Button
                        variant="primary"
                        onClick={handleAddSlide}
                        className="mt-3"
                    >
                        <FaPlus className="me-2" /> Add First Slide
                    </Button>
                </div>
            ) : (
                <>
                    {carouselSlides.map((slide, index) => (
                        <Card key={index} className="mb-4" bg={isDarkMode ? 'dark' : 'light'}>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Slide {index + 1}</h5>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRemoveSlide(index)}
                                >
                                    <FaTrash /> Remove
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col xs={12} md={6}>
                                        <div className="mb-3">
                                            <Form.Label><FaImage className="me-2" /> Carousel Image</Form.Label>
                                            {slide.image ? (
                                                <div className="position-relative">
                                                    <img
                                                        src={slide.image}
                                                        alt="Preview"
                                                        style={{
                                                            width: '100%',
                                                            height: 'auto',
                                                            borderRadius: '8px',
                                                            border: `1px solid ${isDarkMode ? '#333333' : '#dddddd'}`
                                                        }}
                                                    />
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="position-absolute top-0 end-0 m-2"
                                                        onClick={() => handleImageUpload(index, '')}
                                                    >
                                                        <FaUpload className="me-1" /> Change
                                                    </Button>
                                                </div>
                                            ) : (
                                                <ProductImageUploader
                                                    onImageUploaded={(url) => handleImageUpload(index, url)}
                                                    initialImage={slide.image}
                                                    label="Carousel Image"
                                                />
                                            )}
                                            {errors[`image-${index}`] && (
                                                <Alert variant="danger" className="mt-2">
                                                    {errors[`image-${index}`]}
                                                </Alert>
                                            )}
                                        </div>
                                    </Col>

                                    <Col xs={12} md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                <FaLink className="me-2" />
                                                Link URL
                                            </Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    value={slide.link}
                                                    onChange={(e) => handleInputChange(index, 'link', e.target.value)}
                                                    placeholder={slide.isExternal ? "Enter external URL (e.g., example.com)" : "Enter internal path (e.g., /collections)"}
                                                    isInvalid={!!errors[`link-${index}`]}
                                                />
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => handleTestLink(slide.link, slide.isExternal)}
                                                    disabled={!slide.link}
                                                >
                                                    <FaExternalLinkAlt /> Test
                                                </Button>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors[`link-${index}`]}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                            <Form.Text className="text-muted">
                                                {slide.isExternal
                                                    ? "Enter an external URL (https:// will be added if missing)"
                                                    : "Enter an internal path (/ will be added if missing)"}
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                <FaImage className="me-2" />
                                                Alt Text
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={slide.alt}
                                                onChange={(e) => handleInputChange(index, 'alt', e.target.value)}
                                                placeholder="Enter descriptive alt text"
                                                isInvalid={!!errors[`alt-${index}`]}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors[`alt-${index}`]}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id={`external-link-${index}`}
                                                label={
                                                    <span>
                                                        <FaGlobe className="me-2" />
                                                        External Link
                                                    </span>
                                                }
                                                checked={slide.isExternal}
                                                onChange={(e) => handleInputChange(index, 'isExternal', e.target.checked)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}

                    <div className="d-flex justify-content-between">
                        {carouselSlides.length < 3 && (
                            <Button
                                variant="outline-primary"
                                onClick={handleAddSlide}
                            >
                                <FaPlus className="me-2" /> Add New Slide
                            </Button>
                        )}

                        <Button
                            variant="success"
                            onClick={() => handleSaveSlides()}
                            disabled={isSaving || carouselSlides.some(slide => !slide.image || !slide.link || !slide.alt)}
                            className="ms-auto"
                        >
                            {isSaving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="me-2" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>

                    {carouselSlides.some(slide => !slide.image || !slide.link || !slide.alt) && (
                        <Alert variant="info" className="mt-3">
                            Please complete all required fields for each slide before saving.
                        </Alert>
                    )}
                </>
            )}
        </div>
    );
};

export default CarouselImageManager; 