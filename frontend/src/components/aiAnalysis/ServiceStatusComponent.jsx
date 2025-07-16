import React, { useState } from 'react';
import { Card, Button, Badge, Alert, Spinner, Row, Col, Table, ProgressBar } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSync, FaKey, FaPlay } from 'react-icons/fa';
import { useGetServiceStatusQuery, useTestApiKeysMutation, useTestAIServiceMutation } from '../../slices/aiAnalysisApiSlice';

const ServiceStatusComponent = () => {
  const [showDetails, setShowDetails] = useState(false);
  const { data: serviceStatus, error, isLoading, refetch } = useGetServiceStatusQuery();
  const [testApiKeys, { isLoading: isTesting }] = useTestApiKeysMutation();
  const [testAIService, { isLoading: isTestingService, data: testResult }] = useTestAIServiceMutation();

  const handleTestKeys = async () => {
    try {
      await testApiKeys().unwrap();
      refetch(); // Refresh status after testing
    } catch (error) {
      console.error('Failed to test API keys:', error);
    }
  };

  const handleTestService = async () => {
    try {
      await testAIService().unwrap();
      refetch(); // Refresh status after testing
    } catch (error) {
      console.error('Failed to test AI service:', error);
    }
  };

  const handleTestKeys = async () => {
    try {
      await testApiKeys().unwrap();
      refetch(); // Refresh status after testing
    } catch (error) {
      console.error('Failed to test API keys:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Working':
        return <Badge bg="success"><FaCheckCircle /> Working</Badge>;
      case 'Failed':
        return <Badge bg="danger"><FaTimesCircle /> Failed</Badge>;
      case 'Not initialized':
        return <Badge bg="warning"><FaExclamationTriangle /> Not Available</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" /> Loading service status...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <FaTimesCircle /> Failed to load service status: {error?.data?.message || error.message}
      </Alert>
    );
  }

  const { status, usageStats } = serviceStatus;
  const workingKeys = status.availableKeys.filter(key => key.isInitialized).length;

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaKey className="me-2" />
          AI Service Status
        </h5>
        <div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="me-2"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleTestKeys}
            disabled={isTesting}
          >
            {isTesting ? <Spinner animation="border" size="sm" /> : <FaSync />}
            {isTesting ? ' Testing...' : ' Test Keys'}
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Overall Status */}
        <Row className="mb-3">
          <Col md={4}>
            <div className="text-center">
              <h6>Total API Keys</h6>
              <h4 className="text-primary">{status.totalKeys}</h4>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center">
              <h6>Working Keys</h6>
              <h4 className={workingKeys > 0 ? 'text-success' : 'text-danger'}>
                {workingKeys}
              </h4>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center">
              <h6>Current Key</h6>
              <h4 className="text-info">#{status.currentKeyIndex}</h4>
            </div>
          </Col>
        </Row>

        {/* Health Status */}
        {workingKeys === 0 && (
          <Alert variant="danger">
            <FaTimesCircle /> All API keys are currently unavailable. Please check your configuration.
          </Alert>
        )}

        {workingKeys < status.totalKeys && workingKeys > 0 && (
          <Alert variant="warning">
            <FaExclamationTriangle /> Some API keys are unavailable. Service is running on {workingKeys} out of {status.totalKeys} keys.
          </Alert>
        )}

        {workingKeys === status.totalKeys && status.totalKeys > 0 && (
          <Alert variant="success">
            <FaCheckCircle /> All API keys are working properly!
          </Alert>
        )}

        {/* Detailed Information */}
        {showDetails && (
          <>
            <hr />
            <h6>API Key Details</h6>
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>Key #</th>
                  <th>Status</th>
                  <th>Success Rate</th>
                  <th>Requests</th>
                  <th>Last Used</th>
                  <th>Quota Status</th>
                </tr>
              </thead>
              <tbody>
                {usageStats.keyStats.map((key) => (
                  <tr key={key.keyNumber} className={key.keyNumber === status.currentKeyIndex ? 'table-primary' : ''}>
                    <td>
                      <strong>#{key.keyNumber}</strong>
                      {key.keyNumber === status.currentKeyIndex && (
                        <Badge bg="primary" className="ms-1">Active</Badge>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(key.isInitialized ? 'Working' : 'Not initialized')}
                    </td>
                    <td>
                      {key.requestCount > 0 ? (
                        <>
                          <ProgressBar 
                            now={key.successRate} 
                            label={`${key.successRate}%`}
                            variant={key.successRate > 80 ? 'success' : key.successRate > 50 ? 'warning' : 'danger'}
                            style={{ height: '20px' }}
                          />
                        </>
                      ) : (
                        <span className="text-muted">No data</span>
                      )}
                    </td>
                    <td>
                      <div>✅ {key.successCount}</div>
                      <div>❌ {key.errorCount}</div>
                      <small className="text-muted">Total: {key.requestCount}</small>
                    </td>
                    <td className="text-muted">
                      <small>{formatDate(key.lastUsed)}</small>
                    </td>
                    <td>
                      {key.quotaExceeded ? (
                        <Badge bg="danger">Quota Exceeded</Badge>
                      ) : (
                        <Badge bg="success">Available</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Service Message */}
            {serviceStatus.message && (
              <Alert variant="info" className="mt-3">
                {serviceStatus.message}
              </Alert>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ServiceStatusComponent;
