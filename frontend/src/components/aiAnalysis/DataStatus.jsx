import React from 'react';
import { Alert, Badge, Row, Col } from 'react-bootstrap';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaChartLine,
  FaDumbbell,
  FaUtensils,
  FaBed,
  FaWeight,
  FaClipboardCheck,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from 'react-icons/fa';

const DataStatus = ({ isLoadingData, dataError, userData, selectedUser = null }) => {
  if (isLoadingData) {
    return (
      <>
        <style>{`
          .loading-alert {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #3b82f6;
            border-radius: 8px;
          }
          
          .loading-spinner {
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <Alert className="loading-alert mb-0">
          <div className="d-flex align-items-center">
            <div className="loading-spinner me-2"></div>
            Loading {selectedUser ? `${selectedUser.name}'s` : 'your'} data...
          </div>
        </Alert>
      </>
    );
  }

  if (dataError) {
    return (
      <>
        <style>{`
          .error-alert {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            border-radius: 8px;
          }
        `}</style>
        <Alert className="error-alert mb-0">
          <FaExclamationTriangle className="me-2" />
          Error loading data. Please try again.
        </Alert>
      </>
    );
  }

  if (userData) {
    const summary = userData.summary || {};
    const timespan = summary.timespan;
    
    // Calculate data quality and insights
    const getDataQualityBadge = (quality) => {
      if (quality >= 70) return <Badge className="quality-excellent">Excellent</Badge>;
      if (quality >= 40) return <Badge className="quality-good">Good</Badge>;
      return <Badge className="quality-needs-data">Needs More Data</Badge>;
    };

    const getTrendIcon = (trend) => {
      if (trend === 'improving' || trend === 'increasing') return <FaArrowUp className="text-success" />;
      if (trend === 'declining' || trend === 'decreasing') return <FaArrowDown className="text-danger" />;
      return <FaMinus className="text-muted" />;
    };

    return (
      <>
        <style>{`
          .data-status-container {
            color: rgba(255, 255, 255, 0.9);
          }
          
          .success-alert {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
            border-radius: 8px;
          }
          
          .quality-excellent {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            border-radius: 12px;
            padding: 4px 12px;
            font-weight: 600;
            font-size: 0.75rem;
          }
          
          .quality-good {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000000;
            border-radius: 12px;
            padding: 4px 12px;
            font-weight: 600;
            font-size: 0.75rem;
          }
          
          .quality-needs-data {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            color: #ffffff;
            border-radius: 12px;
            padding: 4px 12px;
            font-weight: 600;
            font-size: 0.75rem;
          }
          
          .data-metric-card {
            background: rgba(30, 30, 30, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.3s ease;
            height: 100%;
          }
          
          .data-metric-card:hover {
            background: rgba(40, 40, 40, 0.8);
            border-color: rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
          }
          
          .metric-icon {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
            color: #ffffff;
          }
          
          .metric-icon.workouts {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }
          
          .metric-icon.diet {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          
          .metric-icon.sleep {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          }
          
          .metric-icon.weight {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }
          
          .metric-icon.quizzes {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          
          .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 0.25rem;
          }
          
          .metric-label {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 0;
          }
          
          .timespan-info {
            background: rgba(20, 20, 20, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
          }
        `}</style>
        
        <div className="data-status-container">
          {/* Data Quality Overview */}
          <Alert className="success-alert mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <FaCheckCircle className="me-2" />
                Data loaded successfully!
              </div>
              {summary.dataQuality && getDataQualityBadge(summary.dataQuality.overall)}
            </div>
          </Alert>

          {/* Data Metrics Grid */}
          <Row className="g-3 mb-3">
            <Col md={6} lg={12} xl={6}>
              <div className="data-metric-card">
                <div className="metric-icon workouts">
                  <FaDumbbell size={16} />
                </div>
                <div className="metric-value">{summary.totalWorkouts || 0}</div>
                <div className="metric-label">Workouts</div>
              </div>
            </Col>
            <Col md={6} lg={12} xl={6}>
              <div className="data-metric-card">
                <div className="metric-icon diet">
                  <FaUtensils size={16} />
                </div>
                <div className="metric-value">{summary.totalDietEntries || 0}</div>
                <div className="metric-label">Diet Entries</div>
              </div>
            </Col>
            <Col md={6} lg={12} xl={6}>
              <div className="data-metric-card">
                <div className="metric-icon sleep">
                  <FaBed size={16} />
                </div>
                <div className="metric-value">{summary.totalSleepRecords || 0}</div>
                <div className="metric-label">Sleep Records</div>
              </div>
            </Col>
            <Col md={6} lg={12} xl={6}>
              <div className="data-metric-card">
                <div className="metric-icon weight">
                  <FaWeight size={16} />
                </div>
                <div className="metric-value">{summary.totalWeightRecords || 0}</div>
                <div className="metric-label">Weight Entries</div>
              </div>
            </Col>
            <Col md={6} lg={12} xl={6}>
              <div className="data-metric-card">
                <div className="metric-icon quizzes">
                  <FaClipboardCheck size={16} />
                </div>
                <div className="metric-value">{summary.completedQuizzes || 0}</div>
                <div className="metric-label">Assessments</div>
              </div>
            </Col>
          </Row>

          {/* Timespan Information */}
          {timespan && (
            <div className="timespan-info">
              <div className="d-flex align-items-center mb-2">
                <FaChartLine className="me-2 text-primary" />
                <strong>Data Timespan</strong>
              </div>
              <div className="small">
                <div><strong>{timespan.days}</strong> days of data ({timespan.weeks} weeks)</div>
                {timespan.earliest && timespan.latest && (
                  <div className="mt-1 text-muted">
                    From {new Date(timespan.earliest).toLocaleDateString()} to {new Date(timespan.latest).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <Alert variant="secondary" className="mb-0">
      No data available for analysis.
    </Alert>
  );
};

export default DataStatus;
