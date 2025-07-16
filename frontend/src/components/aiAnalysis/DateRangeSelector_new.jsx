import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const DateRangeSelector = ({ 
  dateRange, 
  onChange, 
  disabled = false 
}) => {
  const handleDatePreset = (preset) => {
    const now = new Date();
    let startDate, endDate = format(now, 'yyyy-MM-dd');
    
    switch (preset) {
      case 'last30days':
        startDate = format(subDays(now, 30), 'yyyy-MM-dd');
        break;
      case 'last90days':
        startDate = format(subDays(now, 90), 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'last6months':
        startDate = format(subDays(now, 180), 'yyyy-MM-dd');
        break;
      default:
        startDate = format(subDays(now, 90), 'yyyy-MM-dd');
    }
    
    onChange({ startDate, endDate, preset });
  };

  const handleDateChange = (field, value) => {
    onChange({
      ...dateRange,
      [field]: value,
      preset: 'custom'
    });
  };

  return (
    <>
      <style>{`
        .date-range-card {
          background: rgba(15, 15, 15, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .date-range-card .card-header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        
        .date-preset-button {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }
        
        .date-preset-button:hover {
          background: rgba(40, 40, 40, 0.9);
          border-color: #f59e0b;
          color: #f59e0b;
          transform: translateY(-1px);
        }
        
        .date-preset-button.active {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-color: #f59e0b;
          color: #000000;
          font-weight: 600;
        }
        
        .date-input {
          background: rgba(30, 30, 30, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-radius: 6px;
        }
        
        .date-input:focus {
          background: rgba(40, 40, 40, 0.9);
          border-color: #f59e0b;
          box-shadow: 0 0 0 0.2rem rgba(245, 158, 11, 0.25);
          color: #ffffff;
        }
        
        .form-label-dark {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          margin-bottom: 0.75rem;
        }
      `}</style>
      
      <Card className="date-range-card mb-4">
        <Card.Header className="p-3">
          <h5 className="mb-0 fw-semibold">
            <FaCalendarAlt className="me-2" />
            Date Range
          </h5>
        </Card.Header>
        <Card.Body className="p-3">
          {/* Preset Buttons */}
          <div className="mb-3">
            <label className="form-label-dark">Quick Select</label>
            <div className="d-flex flex-wrap gap-2">
              {[
                { label: '30 days', value: 'last30days' },
                { label: '90 days', value: 'last90days' },
                { label: 'This month', value: 'thisMonth' },
                { label: '6 months', value: 'last6months' }
              ].map(preset => (
                <Button
                  key={preset.value}
                  className={`date-preset-button ${dateRange.preset === preset.value ? 'active' : ''}`}
                  onClick={() => handleDatePreset(preset.value)}
                  disabled={disabled}
                  size="sm"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div>
            <label className="form-label-dark">Custom Range</label>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted">From</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    disabled={disabled}
                    className="date-input"
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted">To</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    disabled={disabled}
                    className="date-input"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default DateRangeSelector;
