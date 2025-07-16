# Create New Hero Template Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Template Creation](#step-by-step-template-creation)
4. [Template Component Structure](#template-component-structure)
5. [Backend Configuration](#backend-configuration)
6. [Frontend Integration](#frontend-integration)
7. [Testing Your Template](#testing-your-template)
8. [AI Template Generation Prompts](#ai-template-generation-prompts)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

## Overview

This guide walks you through creating a new hero template for the Main Hero Section system. You'll learn how to:
- Create a React component for your template
- Add it to the system's template registry
- Configure backend support
- Make it available in the admin interface
- Generate templates using AI assistance

## Prerequisites

Before creating a new template, ensure you have:
- ✅ Understanding of React and JSX
- ✅ Basic knowledge of CSS styling
- ✅ Access to the project codebase
- ✅ Admin access to the application
- ✅ Node.js development environment

## Step-by-Step Template Creation

### Step 1: Plan Your Template

**Define your template requirements:**
```markdown
Template Name: [e.g., "Professional Hero"]
Template Code: [e.g., "professional"] 
Description: [e.g., "Corporate design with testimonials"]
Key Features:
- [ ] Background video/image support
- [ ] Statistics display
- [ ] Multiple buttons
- [ ] Custom animations
- [ ] Social proof elements
- [ ] Newsletter signup
```

### Step 2: Create Template Component

Create a new file: `frontend/src/components/hero/templates/[YourTemplate]HeroTemplate.jsx`

**Basic Template Structure:**
```jsx
import React, { memo, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const YourTemplateHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    
    // Theme observer for dark/light mode
    useEffect(() => {
        const checkTheme = () => {
            setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        };
        const interval = setInterval(checkTheme, 1000);
        return () => clearInterval(interval);
    }, []);

    // Ensure we have template data
    if (!templateData || !templateData.content) {
        return (
            <div style={{ 
                height: '400px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
            }}>
                <h1>Loading...</h1>
            </div>
        );
    }

    const { content } = templateData;

    // Extract content with fallbacks
    const displayTitle = content.title || 'Default Title';
    const displaySubtitle = content.subtitle || 'Default subtitle';
    const displayButtonText = content.buttonText || content.primaryButton?.text || 'Default Button';
    const displayButtonLink = content.buttonLink || content.primaryButton?.link || '/';

    // Your template styles
    const templateStyles = {
        container: {
            position: 'relative',
            padding: '4rem 2rem',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            background: isDarkMode 
                ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff'
        },
        title: {
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        },
        subtitle: {
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            marginBottom: '2rem',
            maxWidth: '600px',
            opacity: 0.9
        },
        button: {
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '50px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer'
        }
    };

    return (
        <div style={templateStyles.container}>
            <h1 style={templateStyles.title}>
                {displayTitle}
            </h1>
            
            <p style={templateStyles.subtitle}>
                {displaySubtitle}
            </p>
            
            <Link 
                to={displayButtonLink}
                style={templateStyles.button}
                onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.3)';
                    e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.transform = 'translateY(0)';
                }}
            >
                {displayButtonText}
            </Link>
        </div>
    );
});

YourTemplateHeroTemplate.displayName = 'YourTemplateHeroTemplate';

export default YourTemplateHeroTemplate;
```

### Step 3: Add Template to Default Templates

Edit `backend/controllers/systemSettingsController.js`:

**Find the `getDefaultTemplates()` function and add your template:**
```javascript
const getDefaultTemplates = () => ({
    original: { /* existing */ },
    classic: { /* existing */ },
    minimal: { /* existing */ },
    custom: { /* existing */ },
    
    // Add your new template
    yourtemplate: {
        code: 'yourtemplate',
        name: 'Your Template Name',
        description: 'Description of your template functionality and design',
        content: {
            title: 'YOUR TEMPLATE TITLE',
            subtitle: 'Your compelling subtitle that describes the value proposition.',
            buttonText: 'Get Started',
            buttonLink: '/collections',
            backgroundImage: '', // Optional
            showStats: false, // Set to true if your template supports stats
            stats: [], // Array of stat objects if showStats is true
            
            // Add any custom fields your template needs
            customField: 'custom value',
            specialConfig: {
                animation: 'fadeIn',
                duration: 1000
            }
        }
    }
});
```

### Step 4: Register Template in Frontend

Edit `frontend/src/components/hero/MainHeroSection.jsx`:

**Add your template to the imports:**
```javascript
// Add this import
const YourTemplateHeroTemplate = lazy(() => import('./templates/YourTemplateHeroTemplate'));
```

**Add your template to the switch statement:**
```javascript
const TemplateComponent = useMemo(() => {
    if (!isEnabled) return null;
    
    switch (selectedTemplate) {
        case 'original':
            return OriginalHeroTemplate;
        case 'classic':
            return ClassicHeroTemplate;
        case 'minimal':
            return MinimalHeroTemplate;
        case 'custom':
            return CustomHeroTemplate;
        case 'yourtemplate': // Add this case
            return YourTemplateHeroTemplate;
        default:
            return OriginalHeroTemplate;
    }
}, [selectedTemplate, isEnabled]);
```

### Step 5: Test Your Template

1. **Start your development servers:**
   ```bash
   npm run dev
   ```

2. **Access admin panel:**
   - Go to `http://localhost:3000/admin/system-settings`
   - Click "Main Hero" tab

3. **Select your template:**
   - Find your template in the dropdown
   - Select it and save
   - Visit `http://localhost:3000/home` to see it

## Template Component Structure

### Required Props
```javascript
{
  templateData: {
    code: "yourtemplate",
    name: "Your Template Name", 
    description: "Template description",
    content: {
      title: "Main title",
      subtitle: "Subtitle text",
      buttonText: "Button text", // OR primaryButton.text
      buttonLink: "Button link", // OR primaryButton.link
      // ... other content fields
    }
  },
  userInfo: {
    // User data if needed for personalization
    _id: "user_id",
    name: "User Name",
    // ... other user fields
  },
  forceRefreshKey: 123 // Changes when content updates
}
```

### Essential Template Features

#### 1. **Responsive Design**
```javascript
const responsiveStyles = {
    container: {
        padding: 'clamp(2rem, 5vw, 4rem)',
        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)'
    },
    title: {
        fontSize: 'clamp(2rem, 5vw, 4rem)'
    }
};
```

#### 2. **Dark Mode Support**
```javascript
const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
);

useEffect(() => {
    const checkTheme = () => {
        setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    const interval = setInterval(checkTheme, 1000);
    return () => clearInterval(interval);
}, []);
```

#### 3. **Loading State**
```javascript
if (!templateData || !templateData.content) {
    return (
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1>Loading...</h1>
        </div>
    );
}
```

#### 4. **Content Fallbacks**
```javascript
const displayTitle = content.title || 'Default Title';
const displaySubtitle = content.subtitle || 'Default subtitle';
const displayButtonText = content.buttonText || content.primaryButton?.text || 'Default Button';
const displayButtonLink = content.buttonLink || content.primaryButton?.link || '/';
```

## Backend Configuration

### Custom Content Fields

If your template needs special fields, add them to the admin interface:

**Edit `frontend/src/components/admin/SystemMainHeroManager.jsx`:**

```javascript
// Add custom fields in the template editor modal
{editingTemplate.code === 'yourtemplate' && (
    <>
        <Form.Group className="mb-3">
            <Form.Label>Custom Field</Form.Label>
            <Form.Control
                type="text"
                value={editingTemplate.content.customField || ''}
                onChange={(e) => handleTemplateFieldChange('content.customField', e.target.value)}
                style={formControlStyle}
            />
        </Form.Group>
        
        <Form.Group className="mb-3">
            <Form.Label>Animation Type</Form.Label>
            <Form.Select
                value={editingTemplate.content.specialConfig?.animation || 'fadeIn'}
                onChange={(e) => handleTemplateFieldChange('content.specialConfig.animation', e.target.value)}
                style={formControlStyle}
            >
                <option value="fadeIn">Fade In</option>
                <option value="slideUp">Slide Up</option>
                <option value="zoomIn">Zoom In</option>
            </Form.Select>
        </Form.Group>
    </>
)}
```

### Database Schema Extensions

For complex templates, you might need to extend the schema:

```javascript
// In systemSettingsModel.js
const heroTemplateSchema = mongoose.Schema({
    // ... existing fields
    
    // Add custom content structure
    content: {
        // ... existing content fields
        
        customField: {
            type: String,
            default: ''
        },
        specialConfig: {
            animation: {
                type: String,
                default: 'fadeIn'
            },
            duration: {
                type: Number,
                default: 1000
            }
        }
    }
}, { _id: false });
```

## Frontend Integration

### Performance Optimization

#### 1. **Lazy Loading**
```javascript
// Always use lazy loading for templates
const YourTemplateHeroTemplate = lazy(() => import('./templates/YourTemplateHeroTemplate'));
```

#### 2. **Memoization**
```javascript
// Wrap your template with React.memo
const YourTemplateHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
    // Your component code
});
```

#### 3. **Style Optimization**
```javascript
// Use useMemo for complex style calculations
const templateStyles = useMemo(() => ({
    container: {
        // Complex style calculations
    }
}), [isDarkMode, templateData]);
```

### Animation Support

```javascript
// Add CSS animations
const animationStyles = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.template-container {
    animation: fadeInUp 0.8s ease-out;
}
`;

// Inject styles
useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = animationStyles;
    document.head.appendChild(styleSheet);
    
    return () => {
        document.head.removeChild(styleSheet);
    };
}, []);
```

## Testing Your Template

### 1. **Manual Testing Checklist**

```markdown
- [ ] Template appears in admin dropdown
- [ ] Can select and save template
- [ ] Template displays on home page
- [ ] All content fields are editable
- [ ] Changes save and persist
- [ ] Template works in dark mode
- [ ] Template is responsive on mobile
- [ ] All buttons/links work correctly
- [ ] Loading states work properly
- [ ] No console errors
```

### 2. **Test Different Content Scenarios**

```javascript
// Test with minimal content
const minimalContent = {
    title: "Test",
    subtitle: "Test subtitle",
    buttonText: "Test Button",
    buttonLink: "/test"
};

// Test with maximum content
const maximalContent = {
    title: "Very Long Title That Might Wrap Multiple Lines",
    subtitle: "Very long subtitle with lots of text that describes many features and benefits...",
    buttonText: "Very Long Button Text",
    buttonLink: "/very-long-url-path",
    backgroundImage: "https://example.com/very-long-image-url.jpg",
    showStats: true,
    stats: [
        { label: "Stat 1", value: "100%", icon: "star" },
        { label: "Stat 2", value: "1000+", icon: "users" }
    ]
};
```

### 3. **Performance Testing**

```javascript
// Test lazy loading
console.time('Template Load Time');
// Navigate to your template
console.timeEnd('Template Load Time');

// Test re-render performance
console.time('Template Re-render');
// Change template content
console.timeEnd('Template Re-render');
```

## AI Template Generation Prompts

### Basic Template Creation Prompt

```
I need you to create a new hero template component for a React-based hero section system. 

REQUIREMENTS:
- Template name: [YOUR_TEMPLATE_NAME]
- Template style: [MODERN/CLASSIC/MINIMAL/CORPORATE/CREATIVE]
- Key features: [LIST_YOUR_FEATURES]
- Color scheme: [YOUR_COLORS]
- Target audience: [YOUR_AUDIENCE]

TECHNICAL REQUIREMENTS:
- React functional component with memo
- Responsive design using clamp() for font sizes
- Dark mode support using isDarkMode state
- Props: { templateData, userInfo, forceRefreshKey }
- Must handle missing templateData gracefully
- Use inline styles (no external CSS)
- Include hover effects for interactive elements
- Support standard content fields: title, subtitle, buttonText, buttonLink
- Modern CSS features: gradients, backdrop-filter, box-shadow

DESIGN SPECIFICATIONS:
[Describe your visual design here - layout, typography, spacing, effects, etc.]

Please provide:
1. Complete React component code
2. Default template data for backend
3. Any special content fields needed
4. Brief description of the design features

Make it production-ready with proper error handling and performance optimization.
```

### Advanced Feature Prompt

```
I need to enhance an existing hero template with advanced features:

CURRENT TEMPLATE: [template_name]
NEW FEATURES TO ADD:
- [ ] Animated background particles
- [ ] Video background support  
- [ ] Parallax scrolling effects
- [ ] Multi-step animation sequence
- [ ] Interactive elements (hover states, micro-interactions)
- [ ] Statistics counter animations
- [ ] Social proof elements (testimonials, logos)
- [ ] Newsletter signup integration
- [ ] Multi-language support
- [ ] Advanced button configurations (multiple CTAs)

TECHNICAL CONSTRAINTS:
- Must maintain performance (lazy loading, memoization)
- Mobile-first responsive design
- Dark/light mode compatibility
- Accessibility compliance (ARIA labels, keyboard navigation)
- SEO optimization (semantic HTML)

ANIMATION PREFERENCES:
- Animation library: [CSS/Framer Motion/GSAP/None]
- Animation style: [Smooth/Bouncy/Quick/Subtle]
- Performance target: 60fps

Please provide enhanced component code with the requested features, maintaining the existing prop interface and adding any new configuration options needed.
```

### Style-Specific Prompts

#### **Modern Tech Startup Style**
```
Create a hero template for a modern tech startup with:
- Glassmorphism design elements
- Neon accent colors (#00ff88, #0099ff)
- Animated gradient backgrounds
- Floating elements and depth
- Bold, futuristic typography
- Micro-interactions on hover
- Stats showcase with animated counters
- Dual CTA buttons (primary: solid, secondary: outline)
```

#### **Corporate Professional Style**
```
Create a hero template for a corporate business with:
- Clean, professional aesthetic
- Corporate blue color scheme (#003366, #0066cc)
- Subtle animations and transitions
- Trust indicators (awards, certifications)
- Executive headshot integration
- Company stats display
- Conservative typography
- Single prominent CTA
```

#### **Creative Agency Style**
```
Create a hero template for a creative agency with:
- Bold, artistic design
- Vibrant color combinations
- Creative typography mixing
- Portfolio preview elements
- Animated shape backgrounds
- Interactive hover effects
- Showcase of creativity indicators
- Multiple portfolio CTAs
```

#### **E-commerce Style**
```
Create a hero template for an e-commerce store with:
- Product-focused design
- Shopping-friendly colors
- Featured product highlights
- Trust badges and ratings
- Promotional banner support
- Multiple CTAs (Shop Now, View Categories)
- Sale/discount emphasis areas
- Customer testimonial integration
```

### Customization Prompt

```
I have a specific design in mind for a hero template. Here's what I want:

VISUAL DESIGN:
[Attach image or describe in detail]

LAYOUT STRUCTURE:
- Header position: [top/center/left/right]
- Content alignment: [left/center/right/justify]
- Button placement: [below text/inline/floating/bottom]
- Background treatment: [solid/gradient/image/video/pattern]

INTERACTIVE ELEMENTS:
- Hover effects: [describe desired effects]
- Loading animations: [describe entrance animations]
- Scroll behavior: [fixed/parallax/fade/none]
- Click interactions: [button effects, transitions]

CONTENT STRUCTURE:
- Title: [styling preferences]
- Subtitle: [length and formatting]
- Buttons: [number, styles, purposes]
- Additional elements: [stats, social proof, etc.]

BRAND REQUIREMENTS:
- Primary colors: [color codes]
- Secondary colors: [color codes]
- Font preferences: [font families or styles]
- Brand personality: [professional/playful/bold/minimal]

Please create a React component that matches this design vision while maintaining the technical requirements of the hero template system.
```

## Advanced Features

### Video Background Support

```javascript
const VideoHeroTemplate = memo(({ templateData }) => {
    const { content } = templateData;
    
    return (
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            {content.backgroundVideo && (
                <video
                    autoPlay
                    muted
                    loop
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: -1
                    }}
                >
                    <source src={content.backgroundVideo} type="video/mp4" />
                </video>
            )}
            
            <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'rgba(0,0,0,0.4)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Your content here */}
            </div>
        </div>
    );
});
```

### Statistics Counter Animation

```javascript
const AnimatedCounter = ({ value, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const target = parseInt(value.replace(/\D/g, ''));
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [isVisible, value, duration]);

    return (
        <span ref={ref}>
            {count}{value.replace(/\d/g, '')}
        </span>
    );
};
```

### Parallax Scrolling Effect

```javascript
const ParallaxHeroTemplate = memo(({ templateData }) => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{
            position: 'relative',
            height: '100vh',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '120%',
                backgroundImage: `url(${templateData.content.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `translateY(${scrollY * 0.5}px)`,
                zIndex: -1
            }} />
            
            <div style={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(${scrollY * 0.2}px)`
            }}>
                {/* Your content here */}
            </div>
        </div>
    );
});
```

## Best Practices

### 1. **Code Organization**
```javascript
// Group related functionality
const YourTemplateHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
    // 1. State declarations
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // 2. Effects
    useEffect(() => {
        // Theme management
    }, []);
    
    // 3. Computed values
    const displayContent = useMemo(() => {
        // Content processing
    }, [templateData]);
    
    // 4. Styles
    const styles = useMemo(() => ({
        // Style definitions
    }), [isDarkMode]);
    
    // 5. Early returns
    if (!templateData) return <LoadingState />;
    
    // 6. Render
    return (
        <div>
            {/* Template JSX */}
        </div>
    );
});
```

### 2. **Performance Optimization**
```javascript
// Use React.memo with custom comparison
const YourTemplateHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
    // Component code
}, (prevProps, nextProps) => {
    // Custom comparison logic
    return (
        prevProps.templateData?.content?.title === nextProps.templateData?.content?.title &&
        prevProps.forceRefreshKey === nextProps.forceRefreshKey
    );
});

// Debounce expensive operations
const debouncedCalculation = useMemo(() => {
    return debounce((value) => {
        // Expensive calculation
    }, 300);
}, []);
```

### 3. **Accessibility**
```javascript
<div
    role="banner"
    aria-label="Hero section"
    style={styles.container}
>
    <h1 
        id="hero-title"
        aria-describedby="hero-subtitle"
        style={styles.title}
    >
        {displayTitle}
    </h1>
    
    <p 
        id="hero-subtitle"
        style={styles.subtitle}
    >
        {displaySubtitle}
    </p>
    
    <Link
        to={displayButtonLink}
        aria-label={`${displayButtonText} - Navigate to ${displayButtonLink}`}
        style={styles.button}
    >
        {displayButtonText}
    </Link>
</div>
```

### 4. **Error Handling**
```javascript
const YourTemplateHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
    try {
        // Component logic
        
        if (!templateData) {
            throw new Error('Template data is required');
        }
        
        return (
            <ErrorBoundary fallback={<ErrorFallback />}>
                {/* Template content */}
            </ErrorBoundary>
        );
    } catch (error) {
        console.error('Template error:', error);
        return <ErrorFallback error={error} />;
    }
});

const ErrorFallback = ({ error }) => (
    <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        background: '#fee',
        border: '1px solid #fcc'
    }}>
        <h2>Template Error</h2>
        <p>There was an error loading this hero template.</p>
        {process.env.NODE_ENV === 'development' && (
            <pre>{error?.message}</pre>
        )}
    </div>
);
```

### 5. **Content Validation**
```javascript
const validateContent = (content) => {
    const required = ['title', 'subtitle'];
    const missing = required.filter(field => !content[field]);
    
    if (missing.length > 0) {
        console.warn('Missing required fields:', missing);
    }
    
    return {
        isValid: missing.length === 0,
        missing
    };
};

// Use in component
const contentValidation = useMemo(() => 
    validateContent(templateData?.content || {}), 
    [templateData]
);
```

This guide provides everything needed to create professional, performant hero templates that integrate seamlessly with the existing system. Use the AI prompts to accelerate development while following the best practices for maintainable, accessible code. 