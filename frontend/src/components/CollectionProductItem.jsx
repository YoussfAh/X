import { useState, useEffect } from 'react';
import { FaQuoteLeft } from 'react-icons/fa';
import Loader from './Loader';

// Utility function to parse description text with link syntax
// Format: [visible text](url)
const parseDescriptionWithLinks = (description) => {
  if (!description) return '';

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(description)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: description.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'link',
      text: match[1],
      url: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < description.length) {
    parts.push({
      type: 'text',
      content: description.substring(lastIndex),
    });
  }

  return parts;
};

// Function to render text with proper paragraph formatting
const renderTextWithParagraphs = (text) => {
  if (!text) return null;
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((paragraph, i) => (
    <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? '1rem' : 0 }}>
      {paragraph.replace(/\n/g, ' ')}
    </p>
  ));
};

const CollectionProductItem = ({ product }) => {
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDescHovered, setIsDescHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        }
      });
    });

    window.addEventListener('resize', handleResize);
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);
  
  if (!product) {
    return null;
  }
  
  const accentColor = '#9d4edd';
  const secondaryAccent = '#7b2cbf';
  const trueBlack = '#000000';

  const cardStyle = {
    backgroundColor: isDarkMode ? trueBlack : 'rgba(255, 255, 255, 0.9)',
    borderRadius: '0',
    overflow: 'hidden',
    boxShadow: isDarkMode
      ? '0 10px 25px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(157, 78, 221, 0.15)'
      : '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: 'none',
    width: '100%',
    marginBottom: '0',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.3s ease',
    maxWidth: '100%',
    padding: '0',
  };

  const titleStyle = {
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#1e293b',
    fontSize: isMobile ? '1.9rem' : '2.2rem',
    lineHeight: '1.2',
    marginBottom: '1rem',
    position: 'relative',
    display: 'inline-block',
    fontFamily: "'Poppins', sans-serif",
    textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
    letterSpacing: '0.01em',
    padding: '0 2px 8px 2px',
  };

  const responsiveStyles = {
    imageContainer: {
      width: '100%',
      height: isMobile ? '350px' : '500px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '12px',
      backgroundColor: isDarkMode ? trueBlack : 'rgba(241, 245, 249, 0.4)',
      margin: '8px auto',
      transition: 'all 0.3s ease',
      maxWidth: 'calc(100% - 16px)',
      border: isDarkMode ? '1px solid rgba(157, 78, 221, 0.2)' : 'none',
      boxShadow: isDarkMode ? '0 5px 15px rgba(0, 0, 0, 0.4)' : '0 5px 15px rgba(0, 0, 0, 0.1)',
    },
  };

  const descriptionStyle = {
    padding: '25px',
    backgroundColor: isDarkMode ? 'rgba(8, 8, 15, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: isDarkMode
      ? '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      : '0 6px 20px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.02)',
    minHeight: isMobile ? 'auto' : '250px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: 'calc(100% - 16px)',
    margin: '8px auto',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
  };

  const descriptionTextStyle = {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
    fontSize: '1.05rem',
    lineHeight: '1.8',
    fontWeight: '400',
    margin: 0,
    letterSpacing: '0.01em',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    position: 'relative',
    padding: '0 4px',
  };

  const premiumLinkStyle = {
    color: accentColor,
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    borderBottom: `2px solid ${accentColor}`,
    padding: '0 2px 1px 2px',
    display: 'inline-block',
  };
  
  const parsedDescription = parseDescriptionWithLinks(product.description);

  return (
    <div className="w-100 p-0" style={{ background: isDarkMode ? trueBlack : 'inherit' }}>
      <div className='product-main' style={cardStyle}>
        <div className='row g-0 w-100 mx-0'>
          <div className='col-12 px-4 pt-4 pb-2'>
            <div className="d-flex flex-wrap align-items-center mb-4">
              <h1 style={titleStyle}>
                {product.name}
                <div style={{
                  height: '2px',
                  width: '100%',
                  background: `linear-gradient(to right, ${accentColor} 0%, #9d4edd88 60%, transparent 100%)`,
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  borderRadius: '2px',
                  boxShadow: isDarkMode ? `0 1px 3px #9d4edd66` : 'none',
                }}></div>
              </h1>
            </div>
          </div>

          {!imageError && product.image ? (
            <div className='container-fluid p-0'>
              <div className='row g-0 m-0 w-100 flex-column'>
                <div className='col-12 p-0'>
                  <div className='product-image-container' style={{ ...responsiveStyles.imageContainer }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`product-main-image ${imageLoaded ? 'fade-in' : 'invisible'}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease, opacity 0.5s ease',
                        borderRadius: '12px',
                        opacity: imageLoaded ? 1 : 0,
                        maxWidth: '100%',
                      }}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    {!imageLoaded && !imageError && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                        <Loader />
                      </div>
                    )}
                  </div>
                </div>

                <div className='col-12 p-0'>
                  <div
                    style={{
                      ...descriptionStyle,
                      transform: isDescHovered ? 'translateY(-3px)' : 'translateY(0)',
                      boxShadow: isDescHovered
                        ? (isDarkMode
                          ? '0 10px 25px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                          : '0 10px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)')
                        : descriptionStyle.boxShadow
                    }}
                    onMouseEnter={() => setIsDescHovered(true)}
                    onMouseLeave={() => setIsDescHovered(false)}
                  >
                    <div style={{
                      width: isDescHovered ? '60px' : '40px',
                      height: '5px',
                      background: `linear-gradient(to right, ${accentColor}, transparent)`,
                      borderRadius: '3px',
                      marginBottom: '15px',
                      transition: 'width 0.3s ease'
                    }}></div>

                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      opacity: 0.15,
                      transform: isDescHovered ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.3s ease'
                    }}>
                      <FaQuoteLeft size={20} color={isDarkMode ? '#ffffff' : '#000000'} />
                    </div>

                    <div style={descriptionTextStyle}>
                      {parsedDescription.map((part, index) =>
                        part.type === 'text' ?
                          renderTextWithParagraphs(part.content) :
                          <a
                            key={index}
                            href={part.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={premiumLinkStyle}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = secondaryAccent;
                              e.currentTarget.style.borderBottomColor = secondaryAccent;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = accentColor;
                              e.currentTarget.style.borderBottomColor = accentColor;
                            }}
                          >
                            {part.text}
                          </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='container-fluid p-0'>
                <div className='row g-0 m-0 w-100'>
                    <div className='col-12 px-4 pb-4'>
                        <div style={descriptionStyle}>
                            <div style={descriptionTextStyle}>
                                {parsedDescription.map((part, index) =>
                                    part.type === 'text' ?
                                    renderTextWithParagraphs(part.content) :
                                        <a
                                            key={index}
                                            href={part.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: accentColor,
                                                textDecoration: 'underline',
                                                fontWeight: '500',
                                                transition: 'color 0.2s ease'
                                            }}
                                        >
                                            {part.text}
                                        </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .fade-in {
            animation: fadeIn 0.5s ease forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .invisible {
            opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default CollectionProductItem;