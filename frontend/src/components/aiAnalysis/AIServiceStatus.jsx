import React from 'react';
import { useGetAIServiceStatusQuery, useTestAllAIKeysMutation } from '../../slices/aiAnalysisApiSlice';
import { Card, Row, Col, Badge, Button, Table, Alert, Spinner } from 'react-bootstrap';
import { FaCheck, FaTimes, FaExclamationTriangle, FaCog } from 'react-icons/fa';

const AIServiceStatus = () => {
  const { data: serviceStatus, isLoading, error, refetch } = useGetAIServiceStatusQuery();
  const [testKeys, { isLoading: isTesting, data: testResults }] = useTestAllAIKeysMutation();

  const handleTestKeys = async () => {
    try {
      await testKeys().unwrap();
      // Refetch status after testing
      setTimeout(() => refetch(), 1000);
    } catch (error) {
      console.error('Failed to test keys:', error);
    }
  };

  const getStatusBadge = (key) => {
    if (key.quotaExceeded) {
      return <Badge bg="danger">Quota Exceeded</Badge>;
    }
    if (key.errorCount > key.successCount) {
      return <Badge bg="warning">Issues</Badge>;
    }
    if (key.successCount > 0) {
      return <Badge bg="success">Working</Badge>;
    }
    return <Badge bg="secondary">Untested</Badge>;
  };

  const getSuccessRate = (key) => {
    if (key.requestCount === 0) return 'N/A';
    return `${Math.round((key.successCount / key.requestCount) * 100)}%`;
  };

  const formatQuotaReset = (resetTime) => {
    if (!resetTime) return 'N/A';
    const resetDate = new Date(resetTime);
    const now = new Date();
    const hoursLeft = Math.ceil((resetDate - now) / (1000 * 60 * 60));
    return hoursLeft > 0 ? `${hoursLeft}h remaining` : 'Should reset soon';
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5><FaCog className="me-2" />AI Service Status</h5>
        </Card.Header>
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading service status...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5><FaCog className="me-2" />AI Service Status</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger">
            <FaTimes className="me-2" />
            Failed to load service status: {error.message}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  const { status, usageStats } = serviceStatus || {};
  const hasQuotaIssues = status?.availableKeys?.some(key => key.quotaExceeded);
  const workingKeys = status?.availableKeys?.filter(key => !key.quotaExceeded)?.length || 0;

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5><FaCog className="me-2" />AI Service Status</h5>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={handleTestKeys}
          disabled={isTesting}
        >
          {isTesting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Testing...
            </>
          ) : (
            'Test All Keys'
          )}
        </Button>
      </Card.Header>
      <Card.Body>
        {/* Overall Status */}
        <Row className="mb-3">
          <Col md={3}>
            <div className="text-center">
              <h4 className="text-primary">{status?.totalKeys || 0}</h4>
              <small className="text-muted">Total Keys</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h4 className={workingKeys > 0 ? 'text-success' : 'text-danger'}>{workingKeys}</h4>
              <small className="text-muted">Working Keys</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h4 className="text-info">{status?.currentKeyIndex || 0}</h4>
              <small className="text-muted">Active Key</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h4 className={hasQuotaIssues ? 'text-warning' : 'text-success'}>
                {hasQuotaIssues ? <FaExclamationTriangle /> : <FaCheck />}
              </h4>
              <small className="text-muted">Status</small>
            </div>
          </Col>
        </Row>

        {/* Quota Warnings */}
        {hasQuotaIssues && (
          <Alert variant="warning" className="mb-3">
            <FaExclamationTriangle className="me-2" />
            <strong>Quota Alert:</strong> Some API keys have exceeded their daily quota. 
            Service continues with {workingKeys} remaining key(s).
          </Alert>
        )}

        {workingKeys === 0 && (
          <Alert variant="danger" className="mb-3">
            <FaTimes className="me-2" />
            <strong>Service Unavailable:</strong> All API keys have exceeded quota or are invalid. 
            Service will resume when quotas reset (typically at midnight PST).
          </Alert>
        )}

        {/* Detailed Key Status */}
        <h6>API Key Details</h6>
        <Table striped hover size="sm" responsive>
          <thead>
            <tr>
              <th>Key #</th>
              <th>Status</th>
              <th>Requests</th>
              <th>Success Rate</th>
              <th>Models</th>
              <th>Quota Reset</th>
            </tr>
          </thead>
          <tbody>
            {status?.availableKeys?.map((key) => (
              <tr key={key.keyNumber}>
                <td>
                  <strong>Key {key.keyNumber}</strong>
                  {key.keyNumber === status.currentKeyIndex && (
                    <Badge bg="info" className="ms-2">Active</Badge>
                  )}
                </td>
                <td>{getStatusBadge(key)}</td>
                <td>{key.requestCount || 0}</td>
                <td>{getSuccessRate(key)}</td>
                <td>
                  {key.hasTextModel && <Badge bg="secondary" className="me-1">Text</Badge>}
                  {key.hasVisionModel && <Badge bg="secondary">Vision</Badge>}
                </td>
                <td>
                  {key.quotaExceeded ? (
                    <span className="text-danger">
                      {formatQuotaReset(key.quotaResetTime)}
                    </span>
                  ) : (
                    <span className="text-success">Available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Test Results */}
        {testResults?.testResults && (
          <div className="mt-3">
            <h6>Last Test Results</h6>
            <Row>
              {testResults.testResults.map((result) => (
                <Col md={4} key={result.keyNumber} className="mb-2">
                  <Card size="sm" className={`border-${result.status === 'Working' ? 'success' : 'danger'}`}>
                    <Card.Body className="p-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <small><strong>Key {result.keyNumber}</strong></small>
                        {result.status === 'Working' ? (
                          <FaCheck className="text-success" />
                        ) : (
                          <FaTimes className="text-danger" />
                        )}
                      </div>
                      {result.error && (
                        <small className="text-danger d-block">{result.error}</small>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        <div className="text-muted mt-3">
          <small>
            <strong>Note:</strong> The system automatically switches between API keys when quotas are exceeded. 
            Add more keys to increase daily limits.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AIServiceStatus;
