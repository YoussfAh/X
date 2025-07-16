/**
 * AI Response Formatter
 * Cleans up and improves the formatting of AI-generated responses
 * for better readability in the frontend UI.
 */

class ResponseFormatter {
  /**
   * Main formatting function - cleans and structures AI responses
   * @param {string} rawResponse - Raw AI response text
   * @returns {string} - Formatted response text
   */
  static formatResponse(rawResponse) {
    if (!rawResponse || typeof rawResponse !== 'string') {
      return '';
    }

    let formatted = rawResponse;

    // Step 1: Basic cleanup
    formatted = this.basicCleanup(formatted);

    // Step 2: Convert headers
    formatted = this.convertHeaders(formatted);

    // Step 3: Format lists
    formatted = this.formatBulletLists(formatted);

    // Step 4: Clean up bold formatting
    formatted = this.cleanBoldFormatting(formatted);

    // Step 5: Add proper spacing
    formatted = this.improveSpacing(formatted);

    // Step 6: Format metrics
    formatted = this.formatMetrics(formatted);

    return formatted.trim();
  }

  /**
   * Basic text cleanup
   */
  static basicCleanup(text) {
    // Normalize line breaks
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove excessive whitespace
    text = text.replace(/[ \t]+$/gm, ''); // trailing spaces
    text = text.replace(/\n{4,}/g, '\n\n\n'); // excessive line breaks
    
    return text;
  }

  /**
   * Convert headers to consistent format
   */
  static convertHeaders(text) {
    // Convert various header formats to ## format
    
    // Handle lines that are clearly headers (all caps, bold, ending with colon)
    text = text.replace(/^\*{2,3}([A-Z][A-Z\s&-]{5,})\*{2,3}:?\s*$/gm, '## $1');
    
    // Handle lines that look like headers (title case, bold)
    text = text.replace(/^\*{2,3}([A-Z][a-zA-Z\s&'-]{8,})\*{2,3}:?\s*$/gm, '## $1');
    
    // Handle common section headers
    const commonHeaders = [
      'Key Findings',
      'Performance Analysis', 
      'Recommendations',
      'Next Steps',
      'Summary',
      'Conclusion',
      'Action Items',
      'Goals',
      'Progress Review',
      'Immediate Actions',
      'Monthly Objectives',
      'Weekly Focus',
      'Long.Term Strategy',
      'Recovery Patterns',
      'Training Metrics',
      'Nutrition Analysis'
    ];
    
    commonHeaders.forEach(header => {
      const regex = new RegExp(`^\\*{0,3}(${header.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(?:\\s*[:])?(?:\\s*\\*{0,3})?)\\s*$`, 'gmi');
      text = text.replace(regex, `## $1`);
    });
    
    return text;
  }

  /**
   * Format bullet lists
   */
  static formatBulletLists(text) {
    // Convert * bullets to •
    text = text.replace(/^\*\s+([^*\n].+)$/gm, '• $1');
    
    // Clean up any remaining asterisks that aren't part of bold formatting
    text = text.replace(/^\*\s*$/gm, '');
    
    return text;
  }

  /**
   * Clean up bold formatting
   */
  static cleanBoldFormatting(text) {
    // Remove excessive asterisks (***text*** -> **text**)
    text = text.replace(/\*{3,}([^*]+)\*{3,}/g, '**$1**');
    
    // Clean up standalone asterisks
    text = text.replace(/\*{2,}\s*\*{2,}/g, '**');
    
    // Remove bold from very short words unless they contain numbers or units
    text = text.replace(/\*\*([^*\n]{1,4})\*\*/g, (match, content) => {
      // Keep bold if it contains numbers, units, or percentage
      if (/\d|kg|lb|%|cal|hour|min|day|week|month|am|pm/i.test(content)) {
        return match;
      }
      // Keep bold for important keywords
      if (/goal|key|important|critical|recommendation/i.test(content)) {
        return match;
      }
      // Otherwise, remove bold formatting
      return content;
    });
    
    return text;
  }

  /**
   * Improve spacing
   */
  static improveSpacing(text) {
    // Add space after headers
    text = text.replace(/^(## .+)$/gm, '$1\n');
    
    // Ensure proper spacing between sections
    text = text.replace(/\n(## .+)/g, '\n\n$1');
    
    // Clean up excessive spacing
    text = text.replace(/\n{4,}/g, '\n\n\n');
    
    return text;
  }

  /**
   * Format metrics and numbers
   */
  static formatMetrics(text) {
    // Format common metrics with bold
    text = text.replace(/(\d+(?:\.\d+)?)\s*(kg|lbs?|calories?|cal|kcal|hours?|hrs?|minutes?|mins?|days?|weeks?|months?)/gi, '**$1 $2**');
    
    // Format percentages
    text = text.replace(/(\d+(?:\.\d+)?)%/g, '**$1%**');
    
    // Format workout notations (sets x reps)
    text = text.replace(/(\d+)\s*[x×]\s*(\d+)/g, '**$1×$2**');
    
    return text;
  }

  /**
   * Extract key insights from formatted response
   */
  static extractKeyInsights(formattedResponse) {
    const insights = [];
    
    // Look for sections that contain insights
    const keyFindingsMatch = formattedResponse.match(/## Key Findings?\s*\n([\s\S]*?)(?=\n##|\n\n[A-Z]|$)/i);
    if (keyFindingsMatch) {
      const bullets = keyFindingsMatch[1].match(/• .+/g);
      if (bullets) {
        insights.push(...bullets.map(b => b.replace('• ', '').trim()).slice(0, 3));
      }
    }
    
    // Look for recommendation patterns
    const recommendations = formattedResponse.match(/💡\s*\*\*[^:]+:\*\*([^•\n]+)/gi);
    if (recommendations) {
      insights.push(...recommendations.map(rec => rec.replace(/💡\s*\*\*[^:]+:\*\*\s*/, '').trim()).slice(0, 2));
    }
    
    return insights.filter(insight => insight.length > 10).slice(0, 5);
  }

  /**
   * Create a structured summary
   */
  static createSummary(formattedResponse) {
    const summary = {
      keyInsights: this.extractKeyInsights(formattedResponse),
      sections: [],
      recommendations: [],
      metrics: []
    };

    // Extract sections
    const sectionMatches = formattedResponse.match(/## (.+)/g);
    if (sectionMatches) {
      summary.sections = sectionMatches.map(s => s.replace('## ', '').trim()).slice(0, 6);
    }

    // Extract recommendations  
    const recMatches = formattedResponse.match(/💡\s*\*\*[^:]+:\*\*([^•\n]+)/gi);
    if (recMatches) {
      summary.recommendations = recMatches.map(r => 
        r.replace(/💡\s*\*\*[^:]+:\*\*\s*/, '').trim()
      ).slice(0, 3);
    }

    // Extract metrics
    const metricMatches = formattedResponse.match(/\*\*(\d+(?:\.\d+)?(?:%|×?\d*|[\w\s]+))\*\*/gi);
    if (metricMatches) {
      summary.metrics = [...new Set(metricMatches.map(m => 
        m.replace(/\*\*/g, '')
      ))].slice(0, 8);
    }

    return summary;
  }
}

export default ResponseFormatter;
