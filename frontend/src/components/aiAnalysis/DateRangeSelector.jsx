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
      case 'last7days':
        startDate = format(subDays(now, 7), 'yyyy-MM-dd');
        break;
      case 'last14days':
        startDate = format(subDays(now, 14), 'yyyy-MM-dd');
        break;
      case 'last30days':
        startDate = format(subDays(now, 30), 'yyyy-MM-dd');
        break;
      case 'last60days':
        startDate = format(subDays(now, 60), 'yyyy-MM-dd');
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
      case 'lastYear':
        startDate = format(subDays(now, 365), 'yyyy-MM-dd');
        break;
      case 'all':
        startDate = '2020-01-01'; // Far back date for all data
        break;
      default:
        startDate = format(subDays(now, 90), 'yyyy-MM-dd');
    }
    
    onChange({ startDate, endDate, preset });
  };

  const handleDateChange = (field, value) => {
    // Validate that end date is not before start date
    const newDateRange = {
      ...dateRange,
      [field]: value,
      preset: 'custom'
    };
    
    // If changing start date and it's after end date, update end date
    if (field === 'startDate' && value > dateRange.endDate) {
      newDateRange.endDate = value;
    }
    
    // If changing end date and it's before start date, update start date
    if (field === 'endDate' && value < dateRange.startDate) {
      newDateRange.startDate = value;
    }
    
    onChange(newDateRange);
  };

  return (
    <>
      <style>{`
        .date-range-card {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: none;
          box-shadow: none;
        }
        
        .date-range-card .card-header {
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 0.4rem;
        }
        
        .date-preset-button {
          background: rgba(30, 30, 30, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          margin-bottom: 0.25rem;
          transition: all 0.2s ease;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .date-preset-button:hover {
          background: rgba(60, 60, 60, 0.8);
          border-color: rgba(255, 255, 255, 0.3);
          color: #ffffff;
          transform: translateY(-1px);
        }
        
        .date-preset-button.active {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .date-input {
          background: rgba(30, 30, 30, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-radius: 6px;
          padding: 0.375rem 0.5rem;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }
        
        .date-input:focus {
          background: rgba(40, 40, 40, 0.8);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 0 0.15rem rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        
        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.8;
        }
        
        .form-label-dark {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }
        
        @media (max-width: 576px) {
          .date-range-card .card-header {
            padding: 0.25rem !important;
          }
          
          .date-range-card .card-header h5 {
            font-size: 0.7rem;
            margin-bottom: 0;
            font-weight: 600;
          }
          
          .date-range-card .card-body {
            padding: 0.375rem !important;
          }
          
          .date-preset-button {
            padding: 0.15rem 0.3rem;
            font-size: 0.65rem;
            margin-bottom: 0.15rem;
            border-radius: 4px;
            margin-right: 0.1rem;
          }
          
          .date-input {
            padding: 0.25rem 0.35rem;
            font-size: 0.7rem;
            border-radius: 4px;
          }
          
          .form-label-dark {
            font-size: 0.7rem;
            margin-bottom: 0.15rem;
          }
        }
        
        @media (max-width: 400px) {
          .date-range-card .card-header {
            padding: 0.25rem !important;
          }
          
          .date-range-card .card-header h5 {
            font-size: 0.75rem;
          }
          
          .date-range-card .card-body {
            padding: 0.375rem !important;
          }
          
          .date-preset-button {
            padding: 0.15rem 0.3rem;
            font-size: 0.65rem;
          }
          
          .date-input {
            padding: 0.25rem 0.35rem;
            font-size: 0.7rem;
          }
        }
          font-weight: 500;
          margin-bottom: 0.75rem;
        }
      `}</style>
      
      <Card className="date-range-card mb-3">
        <Card.Header className="p-2">
          <h5 className="mb-0 fw-semibold">
            <FaCalendarAlt className="me-1" size={14} />
            Date Range
          </h5>
        </Card.Header>
        <Card.Body className="p-2">
          {/* Preset Buttons */}
          <div className="mb-2">
            <label className="form-label-dark">
              <span className="d-none d-sm-inline">Quick Select</span>
              <span className="d-sm-none">Quick</span>
            </label>
            <div className="d-flex flex-wrap gap-1">
              {[
                { label: '7d', value: 'last7days' },
                { label: '2w', value: 'last14days' },
                { label: '30d', value: 'last30days' },
                { label: '60d', value: 'last60days' },
                { label: '90d', value: 'last90days' },
                { label: 'This Month', value: 'thisMonth' },
                { label: '6m', value: 'last6months' },
                { label: '1y', value: 'lastYear' },
                { label: 'All Data', value: 'all' }
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
            <label className="form-label-dark">
              <span className="d-none d-sm-inline">Custom Range</span>
              <span className="d-sm-none">Custom</span>
            </label>
            <Row className="g-1">
              <Col xs={6}>
                <Form.Group className="mb-1">
                  <Form.Label className="form-label-dark" style={{ fontSize: '0.7rem' }}>
                    <span className="d-none d-sm-inline">From Date</span>
                    <span className="d-sm-none">From</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    disabled={disabled}
                    className="date-input"
                    max={dateRange.endDate} // Prevent start date after end date
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-1">
                  <Form.Label className="form-label-dark" style={{ fontSize: '0.7rem' }}>
                    <span className="d-none d-sm-inline">To Date</span>
                    <span className="d-sm-none">To</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    disabled={disabled}
                    className="date-input"
                    min={dateRange.startDate} // Prevent end date before start date
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
