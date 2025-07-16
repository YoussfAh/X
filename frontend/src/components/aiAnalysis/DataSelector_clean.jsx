import React from 'react';
import { Card, Form } from 'react-bootstrap';
import { 
  FaBrain, 
  FaDumbbell, 
  FaUtensils, 
  FaMoon, 
  FaWeight, 
  FaQuestionCircle,
  FaChartLine 
} from 'react-icons/fa';

const DataSelector = ({ 
  selectedDataTypes, 
  onChange, 
  userData, 
  isLoading 
}) => {
  const dataTypeOptions = [
    { value: 'all', label: 'All Data', icon: FaBrain, color: '#6366f1' },
    { value: 'workouts', label: 'Workouts', icon: FaDumbbell, color: '#059669' },
    { value: 'diet', label: 'Nutrition', icon: FaUtensils, color: '#f59e0b' },
    { value: 'sleep', label: 'Sleep', icon: FaMoon, color: '#4f46e5' },
    { value: 'weight', label: 'Weight', icon: FaWeight, color: '#db2777' },
    { value: 'quizzes', label: 'Assessments', icon: FaQuestionCircle, color: '#7c3aed' }
  ];

  const handleDataTypeChange = (dataType, checked) => {
    if (dataType === 'all') {
      if (checked) {
        onChange(['all']);
      } else {
        onChange([]);
      }
    } else {
      let newSelection = [...selectedDataTypes];
      
      // Remove 'all' if it's selected and we're selecting a specific type
      if (newSelection.includes('all')) {
        newSelection = newSelection.filter(type => type !== 'all');
      }
      
      if (checked) {
        newSelection.push(dataType);
      } else {
        newSelection = newSelection.filter(type => type !== dataType);
      }
      
      onChange(newSelection);
    }
  };

  const getDataCount = (dataType) => {
    if (!userData?.summary) return 0;
    
    switch (dataType) {
      case 'workouts': return userData.summary.totalWorkouts || 0;
      case 'diet': return userData.summary.totalDietEntries || 0;
      case 'sleep': return userData.summary.totalSleepRecords || 0;
      case 'weight': return userData.summary.totalWeightRecords || 0;
      case 'quizzes': return userData.summary.completedQuizzes || 0;
      default: return 0;
    }
  };

  return (
    <>
      <style>{`
        .data-selector-card {
          background: rgba(15, 15, 15, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .data-selector-card .card-header {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        
        .data-type-checkbox {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .data-type-checkbox:hover {
          background: rgba(40, 40, 40, 0.9);
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateX(2px);
        }
        
        .data-type-checkbox.selected {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        
        .data-type-label {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          margin-bottom: 0;
        }
        
        .data-count-badge {
          background: rgba(59, 130, 246, 0.8);
          color: #ffffff;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .form-check-input {
          background-color: rgba(30, 30, 30, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        .form-check-input:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        
        .form-check-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
        }
      `}</style>
      
      <Card className="data-selector-card mb-4">
        <Card.Header className="p-3">
          <h5 className="mb-0 fw-semibold">
            <FaChartLine className="me-2" />
            Data Selection
          </h5>
        </Card.Header>
        <Card.Body className="p-3">
          <div className="mb-3">
            <label className="form-label text-light mb-3">What data should we analyze?</label>
            {dataTypeOptions.map((option) => (
              <div
                key={option.value}
                className={`data-type-checkbox ${
                  selectedDataTypes.includes(option.value) || 
                  (selectedDataTypes.includes('all') && option.value !== 'all') 
                    ? 'selected' : ''
                }`}
                onClick={() => handleDataTypeChange(
                  option.value,
                  !selectedDataTypes.includes(option.value) && 
                  !(selectedDataTypes.includes('all') && option.value !== 'all')
                )}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      id={`data-${option.value}`}
                      checked={
                        selectedDataTypes.includes(option.value) || 
                        (selectedDataTypes.includes('all') && option.value !== 'all')
                      }
                      onChange={(e) => handleDataTypeChange(option.value, e.target.checked)}
                      className="me-3"
                      style={{ pointerEvents: 'none' }}
                    />
                    <option.icon 
                      className="me-2" 
                      style={{ color: option.color }} 
                      size={16}
                    />
                    <span className="data-type-label">{option.label}</span>
                  </div>
                  {option.value !== 'all' && (
                    <span className="data-count-badge">
                      {isLoading ? '...' : getDataCount(option.value)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default DataSelector;
