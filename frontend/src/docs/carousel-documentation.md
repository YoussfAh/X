# Carousel System Documentation

## Overview

This documentation covers the implementation of a responsive, interactive carousel system consisting of two main components:

1. **TopHeroCarousel** - A front-facing component displaying promotional images with navigation links
2. **CarouselImageManager** - An admin interface for managing carousel slides

## TopHeroCarousel Component

### Purpose
The TopHeroCarousel serves as a hero section on the main pages, displaying promotional images with links to internal pages or external websites.

### Features
- Responsive design adapting to different screen sizes
- Touch/drag interaction for mobile users
- 3D transition effects between slides
- Auto-play functionality with 5-second intervals
- Circular navigation button on each slide
- Support for both internal and external links
- Dark/light mode compatibility
- User-specific carousel content (falls back to default if none available)

### Code Structure

#### State Management
```javascript
// Default configuration
const defaultSlides = [
    {
        image: "URL",
        link: "/collections",
        isExternal: false,
        alt: "Description"
    },
    // More slides...
];

const carouselConfig = {
    transitionDuration: 600, // ms
    dragThreshold: 0.2, // percentage of width to trigger slide change
};

// Component state
const [currentSlide, setCurrentSlide] = useState(0);
const [isDarkMode, setIsDarkMode] = useState(...);
const [isVisible, setIsVisible] = useState(false);
const [isDragging, setIsDragging] = useState(false);
const [dragStartX, setDragStartX] = useState(0);
const [dragDelta, setDragDelta] = useState(0);
const [dragVelocity, setDragVelocity] = useState(0);
```

#### Key Functions

##### Slide Management
```javascript
// Determine which slides to use (user's or default)
const hasValidUserSlides = userInfo?.carouselSlides?.length > 0 &&
    userInfo.carouselSlides.every(slide => slide.image && slide.link && slide.alt);
const slides = hasValidUserSlides ? userInfo.carouselSlides : defaultSlides;

// Auto-play functionality
const startAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
};
```

##### Touch and Drag Handling
```javascript
// Start dragging
const handleDragStart = (clientX) => {
    setIsDragging(true);
    setDragStartX(clientX);
    dragPrevXRef.current = clientX;
    dragTimeRef.current = Date.now();
    setDragVelocity(0);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (carouselRef.current) {
        carouselRef.current.style.cursor = 'grabbing';
    }
};

// During drag
const handleDragMove = (clientX) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStartX;
    const currentTime = Date.now();
    const timeDelta = currentTime - dragTimeRef.current;
    const currentVelocity = (clientX - dragPrevXRef.current) / timeDelta;

    setDragDelta(deltaX);
    setDragVelocity(currentVelocity);

    dragPrevXRef.current = clientX;
    dragTimeRef.current = currentTime;
};

// End dragging with slide change logic
const handleDragEnd = () => {
    if (!isDragging) return;

    const containerWidth = carouselRef.current?.offsetWidth || 0;
    const dragPercentage = dragDelta / containerWidth;
    const velocityThreshold = 0.5;
    const shouldSlide = Math.abs(dragPercentage) > carouselConfig.dragThreshold ||
        Math.abs(dragVelocity) > velocityThreshold;

    if (shouldSlide) {
        if (dragDelta > 0 || dragVelocity > velocityThreshold) {
            setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
        } else if (dragDelta < 0 || dragVelocity < -velocityThreshold) {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }
    }

    setIsDragging(false);
    setDragDelta(0);
    setDragVelocity(0);
    if (carouselRef.current) {
        carouselRef.current.style.cursor = 'grab';
    }
    startAutoPlay();
};
```

##### Link Handling
```javascript
// Handle link clicks with special handling for external links
const handleLinkClick = (e, link, isExternal) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDragging) {
        return;
    }

    if (isExternal) {
        // Ensure URL has proper protocol
        let url = link;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        window.open(url, '_blank', 'noopener');
    } else {
        // For internal links, make sure they start with a slash
        let path = link;
        if (path && !path.startsWith('/')) {
            path = '/' + path;
        }
        window.location.href = path;
    }
};
```

#### Responsive Styling
```javascript
const styles = {
    container: {
        position: 'relative',
        width: '100%',
        height: 'min(600px, 50vw)', // Taller on larger screens, responsive on smaller
        minHeight: '350px',
        maxHeight: '600px',
        // Other properties...
        '@media (max-width: 1200px)': {
            height: 'min(500px, 45vw)',
            aspectRatio: '16/11',
        },
        '@media (max-width: 768px)': {
            height: '350px',
            minHeight: '350px',
            borderRadius: '16px',
            aspectRatio: '16/9',
        }
    },
    // Other styles...
};
```

#### Rendering Logic
```javascript
return (
    <div
        style={styles.container}
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        <div style={styles.carouselContainer}>
            {slides.map((slide, index) => {
                // Calculate distance from current slide for 3D effect
                let distance = index - currentSlide;
                const totalSlides = slides.length;
                if (Math.abs(distance) > totalSlides / 2) {
                    distance = distance > 0
                        ? distance - totalSlides
                        : distance + totalSlides;
                }

                // Apply drag offset if currently dragging
                const dragOffset = isDragging ? dragDelta / carouselRef.current?.offsetWidth * 100 : 0;
                
                // Apply 3D transformations for carousel effect
                const slideStyles = {
                    ...styles.slide,
                    transform: `
                        translateX(${(distance * 102) + dragOffset}%) 
                        translateZ(${index === currentSlide ? '0' : '-200px'})
                        rotateY(${(distance * 5) - (dragOffset * 0.05)}deg)
                        scale(${index === currentSlide ? 1 : 0.9})
                    `,
                    opacity: index === currentSlide ? 1 : 0.7,
                    zIndex: index === currentSlide ? 2 : 1,
                };

                return (
                    <div key={index} style={slideStyles}>
                        <div style={styles.imageContainer}>
                            <img
                                src={slide.image}
                                alt={slide.alt || "Carousel image"}
                                style={styles.image}
                                draggable={false}
                                loading="eager"
                            />
                            <div style={styles.buttonWrapper}>
                                {/* Render either external link button or internal link */}
                                {slide.isExternal ? (
                                    <button
                                        style={styles.linkButton}
                                        onClick={(e) => handleLinkClick(e, slide.link, true)}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                        onTouchMove={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                        onTouchEnd={(e) => handleButtonTouch(e, slide.link)}
                                        aria-label={`Open ${slide.alt || 'link'} in new tab`}
                                    >
                                        <FaArrowRight size={16} />
                                    </button>
                                ) : (
                                    <Link
                                        to={slide.link.startsWith('/') ? slide.link : `/${slide.link}`}
                                        style={styles.linkButton}
                                        onClick={(e) => {
                                            if (isDragging) {
                                                e.preventDefault();
                                            }
                                        }}
                                        aria-label={`Go to ${slide.alt || 'page'}`}
                                    >
                                        <FaArrowRight size={16} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
```

## CarouselImageManager Component

### Purpose
The CarouselImageManager provides an admin interface for managing carousel slides, including uploading images, setting links, and configuring slide behavior.

### Features
- Add, remove, and reorder carousel slides
- Image upload functionality
- Toggle between internal and external links
- Form validation
- Preview of current slides
- Link testing
- Dark/light mode compatibility

### Code Structure

#### State Management
```javascript
const [carouselSlides, setCarouselSlides] = useState(slides);
const [errors, setErrors] = useState({});
const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
);
const [isSaving, setIsSaving] = useState(false);
```

#### Key Functions

##### Slide Management
```javascript
// Add a new slide with default values
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

// Remove a slide and save changes
const handleRemoveSlide = (index) => {
    const newSlides = carouselSlides.filter((_, i) => i !== index);
    setCarouselSlides(newSlides);
    handleSaveSlides(newSlides);
};
```

##### Image Upload
```javascript
// Handle image upload for a specific slide
const handleImageUpload = (index, imageUrl) => {
    console.log(`Image uploaded for slide ${index}:`, imageUrl);
    const newSlides = [...carouselSlides];
    newSlides[index] = {
        ...newSlides[index],
        image: imageUrl
    };
    setCarouselSlides(newSlides);
};
```

##### Form Input Handling
```javascript
// Handle changes to form inputs with special handling for links
const handleInputChange = (index, field, value) => {
    const newSlides = [...carouselSlides];

    // Special handling for links
    if (field === 'link') {
        // Store link as entered without automatic URL formatting
        newSlides[index].link = value;
    } else if (field === 'isExternal') {
        newSlides[index].isExternal = value;
    } else {
        newSlides[index][field] = value;
    }

    setCarouselSlides(newSlides);
};
```

##### Validation
```javascript
// Validate slides before saving
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
                // Basic URL validation
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
```

##### Save Functionality
```javascript
// Process and save slides
const handleSaveSlides = async (slidesToSave = carouselSlides) => {
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
            setIsSaving(false);
        } catch (error) {
            console.error("Error saving slides:", error);
            setIsSaving(false);
        }
    }
};
```

#### UI Rendering
```javascript
return (
    <div>
        {carouselSlides.length === 0 ? (
            // Display empty state with "Add First Slide" button
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
            // Display slides with edit forms
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
                                {/* Image upload/preview section */}
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

                                {/* Form fields section */}
                                <Col xs={12} md={6}>
                                    {/* Link URL field */}
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

                                    {/* Alt text field */}
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

                                    {/* External link toggle */}
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

                {/* Bottom action buttons */}
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

                {/* Validation alert */}
                {carouselSlides.some(slide => !slide.image || !slide.link || !slide.alt) && (
                    <Alert variant="info" className="mt-3">
                        Please complete all required fields for each slide before saving.
                    </Alert>
                )}
            </>
        )}
    </div>
);
```

## Integration with User Profile

To integrate the carousel management with the user profile:

1. Store carousel slides in the user model in the database
2. Create an API endpoint to update user's carousel slides
3. In the profile page, add a section for carousel management
4. Use the CarouselImageManager component to handle the UI
5. When loading the TopHeroCarousel, fetch user-specific slides if available

### Database Schema (Example)

```javascript
// User model with carousel slides
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,
  // Other user fields...
  carouselSlides: [
    {
      image: String, // URL to image
      link: String,  // URL or internal path
      isExternal: Boolean,
      alt: String    // Accessibility text
    }
  ]
}
```

### API Endpoints

```
GET /api/users/profile - Fetch user profile including carousel slides
PUT /api/users/profile/carousel - Update user's carousel slides
```

### Implementation Steps

1. Create the carousel slides database schema as part of the user model
2. Implement API endpoints for fetching and updating carousel slides
3. Add the CarouselImageManager component to the profile page
4. Connect the component to the API for fetching and saving slides
5. Ensure the TopHeroCarousel checks for user-specific slides

## Key Technical Considerations

1. **Mobile Responsiveness**: The carousel is designed to work on various screen sizes using responsive sizing techniques.

2. **Performance Optimization**:
   - Image lazy loading 
   - Efficient touch handling
   - Optimized animations with hardware acceleration

3. **Accessibility**:
   - All images have alt text
   - Interactive elements are properly labeled
   - Keyboard navigation is supported

4. **Security**:
   - Input validation for URLs
   - Proper handling of external links

5. **User Experience**:
   - Smooth 3D transitions
   - Intuitive touch interactions
   - Visual feedback during interactions
   - Automatic playback with appropriate timing

## Troubleshooting

### Common Issues

1. **Carousel not displaying user-specific slides**
   - Check if user has valid carousel slides in their profile
   - Verify the hasValidUserSlides logic is working correctly

2. **Touch/drag not working on mobile**
   - Ensure touch event handlers are properly attached
   - Check that preventDefault() is called appropriately

3. **Images not loading**
   - Verify image URLs are valid and accessible
   - Check for CORS issues if images are from external domains

4. **Link navigation issues**
   - Ensure proper URL formatting for both internal and external links
   - Verify event propagation is handled correctly

5. **Styling inconsistencies**
   - Check for proper responsive design implementation
   - Verify styles are applied consistently across light/dark modes
``` 