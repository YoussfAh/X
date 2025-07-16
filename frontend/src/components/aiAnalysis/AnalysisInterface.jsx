import React from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { FaBrain, FaSpinner, FaLightbulb } from 'react-icons/fa';
import PromptPresets from './PromptPresets';

const AnalysisInterface = ({
  analysisPrompt,
  setAnalysisPrompt,
  analysisType,
  setAnalysisType,
  onAnalyze,
  isAnalyzing,
  disabled,
  selectedUser = null
}) => {
  return (
    <>
      {/* Dark Theme Styles */}
      <style>{`
        .analysis-interface-card {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: none;
          box-shadow: none;
        }
        
        .analysis-interface-card .card-header {
          background: rgba(124, 58, 237, 0.1);
          border-bottom: 1px solid rgba(124, 58, 237, 0.2);
          color: #a855f7;
          padding: 0.4rem;
        }
        
        .analysis-form-select {
          background: rgba(20, 20, 20, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 0.375rem 0.5rem;
          font-size: 0.8rem;
        }
        
        .analysis-form-select:focus {
          background: rgba(30, 30, 30, 0.6);
          border-color: #7c3aed;
          box-shadow: 0 0 0 0.15rem rgba(124, 58, 237, 0.2);
          color: #ffffff;
        }
        
        .analysis-form-select option {
          background: #1a1a1a;
          color: #ffffff;
        }
        
        .analysis-textarea {
          background: rgba(20, 20, 20, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border-radius: 4px;
          min-height: 80px;
          resize: vertical;
          font-size: 0.8rem;
        }
        
        .analysis-textarea:focus {
          background: rgba(30, 30, 30, 0.6);
          border-color: #7c3aed;
          box-shadow: 0 0 0 0.15rem rgba(124, 58, 237, 0.2);
          color: #ffffff;
        }
        
        .analysis-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        
        .analysis-submit-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          border: none;
          color: white;
          font-weight: 500;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
        }
        
        .analysis-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);
          transform: translateY(-1px);
        }
        
        .analysis-submit-btn:disabled {
          background: rgba(124, 58, 237, 0.3);
          cursor: not-allowed;
        }
        
        @media (max-width: 576px) {
          .analysis-interface-card .card-header {
            padding: 0.25rem !important;
          }
          
          .analysis-interface-card .card-header h5 {
            font-size: 0.7rem;
            margin-bottom: 0;
            font-weight: 600;
          }
          
          .analysis-interface-card .card-body {
            padding: 0.375rem !important;
          }
          
          .analysis-form-select {
            padding: 0.25rem 0.35rem;
            font-size: 0.7rem;
          }
          
          .analysis-textarea {
            min-height: 50px;
            font-size: 0.7rem;
            padding: 0.3rem 0.4rem;
          }
          
          .analysis-submit-btn {
            padding: 0.3rem 0.6rem;
            font-size: 0.7rem;
            width: 100%;
            border-radius: 3px;
          }
          
          .form-label {
            font-size: 0.7rem;
            margin-bottom: 0.15rem;
          }
        }
        
        @media (max-width: 400px) {
          .analysis-interface-card .card-header {
            padding: 0.25rem !important;
          }
          
          .analysis-interface-card .card-header h5 {
            font-size: 0.75rem;
          }
          
          .analysis-interface-card .card-body {
            padding: 0.375rem !important;
          }
          
          .analysis-form-select {
            padding: 0.25rem 0.35rem;
            font-size: 0.7rem;
          }
          
          .analysis-textarea {
            min-height: 50px;
            font-size: 0.7rem;
            padding: 0.3rem 0.4rem;
          }
          
          .analysis-submit-btn {
            padding: 0.3rem 0.6rem;
            font-size: 0.75rem;
          }
        }
        
        .analysis-textarea {
          background: rgba(30, 30, 30, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          resize: vertical;
        }
        
        .analysis-textarea:focus {
          background: rgba(40, 40, 40, 0.9);
          border-color: #7c3aed;
          box-shadow: 0 0 0 0.2rem rgba(124, 58, 237, 0.25);
          color: #ffffff;
        }
        
        .analysis-textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .analysis-button {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          border: none;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
          transition: all 0.3s ease;
        }
        
        .analysis-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
          transform: translateY(-2px);
        }
        
        .analysis-button:disabled {
          background: rgba(124, 58, 237, 0.3);
          color: rgba(255, 255, 255, 0.5);
        }
        
        .form-label-dark {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
        
        .form-text-dark {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
      
      <Card className="analysis-interface-card mb-3">
        <Card.Header className="p-2">
          <h5 className="mb-0 fw-semibold">
            <FaBrain className="me-1" size={14} />
            AI Analysis Request
          </h5>
        </Card.Header>
        <Card.Body className="p-2">
          {/* Analysis Type Selector */}
          <Form.Group className="mb-2">
            <Form.Label className="form-label-dark">
              <FaLightbulb className="me-1" size={12} />
              <span className="d-none d-sm-inline">Analysis Focus</span>
              <span className="d-sm-none">Focus</span>
            </Form.Label>
            <Form.Select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              disabled={disabled}
              className="analysis-form-select"
            >
              <option value="comprehensive">Complete Analysis</option>
              <option value="performance">Performance</option>
              <option value="nutrition">Nutrition</option>
              <option value="recovery">Recovery</option>
              <option value="progress">Progress</option>
              <option value="consistency">Habits</option>
              <option value="troubleshooting">Issues</option>
              <option value="motivation">Motivation</option>
              <option value="custom">Custom</option>
            </Form.Select>
            <Form.Text className="form-text-dark" style={{ fontSize: '0.7rem' }}>
              {analysisType === 'custom' 
                ? "Your exact prompt will be used"
                : "Guides the AI's analysis approach"
              }
            </Form.Text>
          </Form.Group>

          {/* Preset Prompts - Only show if not custom */}
          {analysisType !== 'custom' && (
            <PromptPresets onSelectPrompt={setAnalysisPrompt} />
          )}

          {/* Custom Prompt */}
          <Form.Group className="mb-2">
            <Form.Label className="form-label-dark">
              {analysisType === 'custom' 
                ? <>
                    <span className="d-none d-sm-inline">Custom Request:</span>
                    <span className="d-sm-none">Custom:</span>
                  </>
                : <>
                    <span className="d-none d-sm-inline">Your Question:</span>
                    <span className="d-sm-none">Question:</span>
                  </>
              }
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={analysisType === 'custom' ? 4 : 3}
              value={analysisPrompt || ''}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              placeholder={
                analysisType === 'custom'
                  ? "Enter your complete analysis request..."
                  : "Ask about your fitness data..."
              }
              disabled={disabled}
              className="analysis-textarea"
            />
            <Form.Text className="form-text-dark" style={{ fontSize: '0.7rem' }}>
              {analysisType === 'custom' 
                ? "Your prompt will be used exactly as written"
                : "Be specific for better insights"
              }
            </Form.Text>
          </Form.Group>

          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || disabled || !analysisPrompt?.trim()}
            className="analysis-submit-btn w-100"
          >
            {isAnalyzing ? (
              <>
                <FaSpinner className="me-1" spin size={12} />
                <span className="d-none d-sm-inline">Analyzing...</span>
                <span className="d-sm-none">...</span>
              </>
            ) : (
              <>
                <FaBrain className="me-1" size={12} />
                <span className="d-none d-sm-inline">Analyze Data</span>
                <span className="d-sm-none">Analyze</span>
              </>
            )}
          </Button>
        </Card.Body>
      </Card>
    </>
  );
};

export default AnalysisInterface;
