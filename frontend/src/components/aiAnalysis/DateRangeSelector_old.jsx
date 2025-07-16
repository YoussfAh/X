import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const DateRangeSelector = ({ 
  dateRange, 
  onDateRangeChange, 
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
    
    onDateRangeChange({ startDate, endDate, preset });
  };

  if (disabled) return null;

  return (
    <Form.Group className="mb-3">
      <Form.Label>
        <FaCalendarAlt className="me-2" />
        Date Range
      </Form.Label>
      <div className="mb-2">
        {[
          { label: 'Last 30 days', value: 'last30days' },
          { label: 'Last 90 days', value: 'last90days' },
          { label: 'This month', value: 'thisMonth' },
          { label: 'Last 6 months', value: 'last6months' }
        ].map(preset => (
          <Button
            key={preset.value}
            variant={dateRange.preset === preset.value ? 'primary' : 'outline-secondary'}
            size="sm"
            className="me-2 mb-2"
            onClick={() => handleDatePreset(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Row>
        <Col>
          <Form.Control
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onDateRangeChange({
              ...dateRange,
              startDate: e.target.value,
              preset: 'custom'
            })}
          />
        </Col>
        <Col>
          <Form.Control
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onDateRangeChange({
              ...dateRange,
              endDate: e.target.value,
              preset: 'custom'
            })}
          />
        </Col>
      </Row>
    </Form.Group>
  );
};

export default DateRangeSelector;
