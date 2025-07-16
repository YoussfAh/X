import React from 'react';
import { Button } from 'react-bootstrap';
import { 
  FaLightbulb, 
  FaWhatsapp,
  FaCopy
} from 'react-icons/fa';
import './AIResponseRenderer.css';

/**
 * Clean AI Response Renderer
 * Simple, readable formatting for AI analysis responses
 */
const AIResponseRenderer = ({ analysisText }) => {
  const [copySuccess, setCopySuccess] = React.useState('');

  if (!analysisText) return null;

  // WhatsApp formatting function
  const formatForWhatsApp = (text) => {
    let whatsappText = "🏋️ *FITNESS ANALYSIS REPORT* 🏋️\n";
    whatsappText += "═".repeat(35) + "\n\n";

    // Format main content
    const sections = parseResponse(text);
    sections.forEach(section => {
      whatsappText += `📋 *${section.title.toUpperCase()}*\n`;
      whatsappText += "─".repeat(section.title.length + 5) + "\n";
      
      // Clean and format content
      let content = section.content
        .replace(/\*\*([^*]+)\*\*/g, '*$1*') // Convert ** to *
        .replace(/•/g, '▪️') // Convert bullets to WhatsApp style
        .replace(/💡 \*Recommendation:\*/g, '💡 *Tip:*'); // Shorten recommendation text
      
      whatsappText += content + "\n\n";
    });

    return whatsappText;
  };

  // Copy to clipboard functions
  const handleRegularCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysisText);
      setCopySuccess('regular');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleWhatsAppCopy = async () => {
    try {
      const whatsappFormatted = formatForWhatsApp(analysisText);
      await navigator.clipboard.writeText(whatsappFormatted);
      setCopySuccess('whatsapp');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy WhatsApp text: ', err);
    }
  };

  // Parse the analysis text into structured sections
  const parseResponse = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if line is a header (starts with ##)
      if (trimmedLine.startsWith('## ')) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        // Start new section
        currentSection = trimmedLine.replace('## ', '');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });

    // Add the last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.join('\n').trim()
      });
    }

    return sections;
  };

  // Format content within sections - Simple and clean
  const formatContent = (content) => {
    // Split into paragraphs and lists
    const parts = content.split('\n\n').filter(part => part.trim());
    
    return parts.map((part, index) => {
      const trimmedPart = part.trim();
      
      // Handle bullet lists
      if (trimmedPart.includes('•') || trimmedPart.includes('▪️')) {
        const items = trimmedPart.split('\n').filter(line => 
          line.trim().startsWith('•') || line.trim().startsWith('▪️')
        );
        
        if (items.length > 0) {
          return (
            <div key={index} className="mb-3">
              <ul className="custom-list">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="custom-list-item">
                    <span className="list-bullet">▪️</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(item.replace(/^[•▪️]\s*/, '').trim()) }} />
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }
      
      // Regular paragraph
      return (
        <p key={index} className="analysis-paragraph">
          <span dangerouslySetInnerHTML={{ __html: formatInlineText(trimmedPart) }} />
        </p>
      );
    });
  };

  // Format inline text - Clean and simple
  const formatInlineText = (text) => {
    // Remove ALL asterisks and markdown formatting
    let formatted = text.replace(/\*+/g, '');
    
    // Clean up any other markdown symbols
    formatted = formatted.replace(/[_~`]/g, '');
    
    // Format numbers that look like metrics
    formatted = formatted.replace(/(\d+(?:\.\d+)?(?:%|kg|lbs|lb|cal|calories|minutes?|mins?|hours?|hrs?|days?))/gi, 
      '<span class="metric-highlight">$1</span>');
    
    return formatted;
  };

  const sections = parseResponse(analysisText);

  return (
    <div className="ai-response-renderer">
      {/* Copy Buttons with Better Spacing */}
      <div className="copy-buttons-container">
        <Button
          variant="success"
          size="md"
          onClick={handleWhatsAppCopy}
          className="whatsapp-btn"
          disabled={copySuccess === 'whatsapp'}
        >
          <FaWhatsapp className="me-2" />
          {copySuccess === 'whatsapp' ? 'Copied for WhatsApp!' : 'Copy for WhatsApp'}
        </Button>
        
        <Button
          variant="outline-secondary"
          size="md"
          onClick={handleRegularCopy}
          className="copy-btn"
          disabled={copySuccess === 'regular'}
        >
          <FaCopy className="me-2" />
          {copySuccess === 'regular' ? 'Copied!' : 'Copy Text'}
        </Button>
      </div>

      {/* Main Analysis Content - Clean and Simple */}
      <div className="analysis-content-container">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <div key={index} className="analysis-section">
              <h2 className="section-title">{section.title}</h2>
              <div className="section-content">
                {formatContent(section.content)}
              </div>
            </div>
          ))
        ) : (
          <div className="analysis-section">
            <div className="section-content">
              {formatContent(analysisText)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIResponseRenderer;
