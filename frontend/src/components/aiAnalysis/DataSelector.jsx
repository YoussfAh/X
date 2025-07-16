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
        // Add the new type if not already present
        if (!newSelection.includes(dataType)) {
          newSelection.push(dataType);
        }
      } else {
        // Remove the type
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
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: none;
          box-shadow: none;
        }
        
        .data-selector-card .card-header {
          background: rgba(20, 20, 20, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          padding: 0.75rem 1rem;
        }
        
        .data-selector-card .card-body {
          padding: 0.75rem 1rem;
        }
        
        .data-type-checkbox {
          background: rgba(20, 20, 20, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 0.4rem 0.5rem;
          margin-bottom: 0.3rem;
          transition: all 0.2s ease;
          cursor: pointer;
          height: 100%;
        }
        
        .data-type-checkbox:hover {
          background: rgba(30, 30, 30, 0.6);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .data-type-checkbox.selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
        }
        
        .data-type-label {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          margin-bottom: 0;
          font-size: 0.8rem;
        }
        
        .data-count-badge {
          background: rgba(59, 130, 246, 0.6);
          color: #ffffff;
          border-radius: 10px;
          padding: 1px 6px;
          font-size: 0.65rem;
          font-weight: 600;
        }
        
        .form-check-input {
          background-color: rgba(20, 20, 20, 0.6);
          border-color: rgba(255, 255, 255, 0.2);
          width: 0.9rem;
          height: 0.9rem;
        }
        
        .form-check-input:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        
        .form-check-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.15rem rgba(59, 130, 246, 0.2);
        }
        
        @media (max-width: 576px) {
          .data-selector-card .card-header {
            padding: 0.5rem 0.75rem;
          }
          
          .data-selector-card .card-header h5 {
            font-size: 0.9rem;
          }
          
          .data-selector-card .card-body {
            padding: 0.5rem 0.75rem;
          }
          
          .data-type-checkbox {
            padding: 0.3rem 0.4rem;
            margin-bottom: 0.25rem;
          }
          
          .data-type-label {
            font-size: 0.75rem;
          }
          
          .data-count-badge {
            font-size: 0.6rem;
            padding: 1px 4px;
          }
          
          .form-check-input {
            width: 0.8rem;
            height: 0.8rem;
          }
          
          .form-label {
            font-size: 0.8rem;
            margin-bottom: 0.5rem !important;
          }
        }
        
        @media (max-width: 400px) {
          .data-selector-card .card-header {
            padding: 0.375rem 0.5rem;
          }
          
          .data-selector-card .card-header h5 {
            font-size: 0.85rem;
          }
          
          .data-selector-card .card-body {
            padding: 0.375rem 0.5rem;
          }
          
          .data-type-checkbox {
            padding: 0.25rem 0.3rem;
            margin-bottom: 0.2rem;
          }
          
          .data-type-label {
            font-size: 0.7rem;
          }
          
          .data-count-badge {
            font-size: 0.55rem;
            padding: 1px 3px;
          }
          
          .form-label {
            font-size: 0.75rem;
            margin-bottom: 0.375rem !important;
          }
        }
      `}</style>
      
      <Card className="data-selector-card mb-3">
        <Card.Header>
          <h5 className="mb-0 fw-semibold">
            <FaChartLine className="me-2" size={14} />
            Data Selection
          </h5>
        </Card.Header>
        <Card.Body>
          <div>
            <label className="form-label text-light mb-2">Select data to analyze:</label>
            <div className="row g-1">
              {dataTypeOptions.map((option) => (
                <div key={option.value} className="col-6">
                  <div
                    className={`data-type-checkbox ${
                      selectedDataTypes.includes(option.value) || 
                      (selectedDataTypes.includes('all') && option.value !== 'all') 
                        ? 'selected' : ''
                    }`}
                    onClick={() => {
                      const isCurrentlySelected = selectedDataTypes.includes(option.value) || 
                        (selectedDataTypes.includes('all') && option.value !== 'all');
                      handleDataTypeChange(option.value, !isCurrentlySelected);
                    }}
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
                          className="me-1"
                          style={{ pointerEvents: 'none' }}
                        />
                        <option.icon 
                          className="me-1" 
                          style={{ color: option.color }} 
                          size={12}
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
                </div>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default DataSelector;
