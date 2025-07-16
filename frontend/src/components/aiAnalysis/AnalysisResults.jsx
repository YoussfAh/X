import React, { useState } from 'react';
import { Card, Button, Alert, Badge } from 'react-bootstrap';
import { 
  FaLightbulb, 
  FaCopy, 
  FaDownload, 
  FaShare,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaWhatsapp
} from 'react-icons/fa';
import { format } from 'date-fns';
import AIResponseRenderer from './AIResponseRenderer';

const AnalysisResults = ({ analysisResults }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!analysisResults) return null;

  const handleCopyAnalysis = async () => {
    try {
      await navigator.clipboard.writeText(analysisResults.analysis);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadAnalysis = () => {
    const element = document.createElement('a');
    const file = new Blob([analysisResults.analysis], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `fitness-analysis-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleWhatsAppShare = () => {
    // Format the analysis text for WhatsApp
    const formattedText = `🏋️ *FITNESS ANALYSIS REPORT* 🏋️\n${'═'.repeat(35)}\n\n${analysisResults.analysis}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(formattedText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaLightbulb className="me-2" />
          Analysis Results
        </h5>
        <small className="text-muted">
          Generated: {format(new Date(analysisResults.metadata.generatedAt), 'MMM dd, yyyy HH:mm')}
        </small>
      </Card.Header>
      <Card.Body>
        {/* Save Status Alert */}
        {analysisResults.id ? (
          <Alert variant="success" className="d-flex align-items-center mb-3">
            <FaCheckCircle className="me-2" />
            <div>
              <strong>Analysis Saved Successfully!</strong>
              <small className="d-block text-muted">
                You can find this analysis in your History tab. Analysis ID: {analysisResults.id}
              </small>
            </div>
          </Alert>
        ) : (
          <Alert variant="warning" className="d-flex align-items-center mb-3">
            <FaExclamationTriangle className="me-2" />
            <div>
              <strong>Analysis Generated</strong>
              <small className="d-block text-muted">
                {analysisResults.metadata.saveError 
                  ? 'Unable to save to history due to an error, but analysis is available below.'
                  : 'Analysis generated but not saved to history.'}
              </small>
            </div>
          </Alert>
        )}

        <div className="mb-3">
          {/* Data Points Summary */}
          <Alert variant="info" className="mb-3">
            <FaInfoCircle className="me-2" />
            <div>
              <strong>Data Points Analyzed:</strong> {' '}
              {Object.entries(analysisResults.metadata.dataPointsAnalyzed)
                .filter(([key, value]) => value > 0)
                .map(([key, value]) => (
                  <Badge key={key} bg="secondary" className="me-2">
                    {value} {key}
                  </Badge>
                ))}
              {analysisResults.metadata.dateRange && (
                <div className="mt-2">
                  <small className="text-muted">
                    <strong>Date Range:</strong> {' '}
                    {format(new Date(analysisResults.metadata.dateRange.startDate), 'MMM dd, yyyy')} - {' '}
                    {format(new Date(analysisResults.metadata.dateRange.endDate), 'MMM dd, yyyy')}
                    {analysisResults.metadata.dateRange.preset && analysisResults.metadata.dateRange.preset !== 'custom' && (
                      <span className="ms-2">({analysisResults.metadata.dateRange.preset})</span>
                    )}
                  </small>
                </div>
              )}
            </div>
          </Alert>
          
          {/* Enhanced Analysis Content with new renderer */}
          <div className="analysis-content">
            <AIResponseRenderer 
              analysisText={analysisResults.analysis} 
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 pt-3 border-top">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleCopyAnalysis}
            disabled={copySuccess}
          >
            <FaCopy className="me-1" />
            {copySuccess ? 'Copied!' : 'Copy Analysis'}
          </Button>
          
          <Button
            variant="success"
            size="sm"
            onClick={handleWhatsAppShare}
            className="text-white"
          >
            <FaWhatsapp className="me-1" />
            WhatsApp
          </Button>
          
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleDownloadAnalysis}
          >
            <FaDownload className="me-1" />
            Download
          </Button>
          
          <Button
            variant="outline-info"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'My Fitness Analysis',
                  text: analysisResults.analysis.substring(0, 200) + '...',
                });
              }
            }}
          >
            <FaShare className="me-1" />
            Share
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AnalysisResults;
