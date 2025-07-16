import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import { FaSync, FaTrash, FaEye, FaDownload, FaClockRotateLeft, FaGauge } from 'react-icons/fa6';
import { useServiceWorker } from '../utils/serviceWorkerManager';
import { useHeroImageCache } from '../utils/heroImageCache';

/**
 * Hero Cache Management Component
 * Admin panel for monitoring and controlling hero image caching
 */
const HeroCacheManager = () => {
  const {
    isReady: swReady,
    hasUpdate,
    cacheStatus: swCacheStatus,
    applyUpdate,
    preloadHeroImages,
    clearCaches,
    refreshCacheStatus,
    manager: swManager
  } = useServiceWorker();

  const {
    isReady: cacheReady,
    cacheStats,
    isPreloading,
    clearCache: clearBrowserCache,
    refreshStats
  } = useHeroImageCache();

  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const [storageInfo, setStorageInfo] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Refresh all data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCacheStatus();
      refreshStats();
      updateStorageInfo();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [refreshCacheStatus, refreshStats]);

  // Get storage information
  const updateStorageInfo = async () => {
    if (swManager && swManager.isSupported) {
      try {
        const estimate = await swManager.getStorageEstimate();
        setStorageInfo(estimate);
      } catch (error) {
        console.warn('Failed to get storage estimate:', error);
      }
    }
  };

  // Get debug information
  const getDebugInfo = async () => {
    if (swManager) {
      try {
        const debug = await swManager.debugCacheInfo();
        console.log('Cache Debug Info:', debug);
        setPerformanceMetrics(debug);
      } catch (error) {
        console.warn('Failed to get debug info:', error);
      }
    }
  };

  const handleAction = async (actionName, actionFn) => {
    setIsLoading(true);
    setLastAction(actionName);
    
    try {
      await actionFn();
      await refreshCacheStatus();
      await refreshStats();
      console.log(`${actionName} completed successfully`);
    } catch (error) {
      console.error(`${actionName} failed:`, error);
    } finally {
      setIsLoading(false);
      setLastAction('');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCacheStatusColor = (count) => {
    if (count === 0) return 'secondary';
    if (count < 5) return 'warning';
    return 'success';
  };

  return (
    <div className="hero-cache-manager">
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaGauge className="me-2" />
                Hero Image Cache Management
              </h5>
              <div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleAction('Refresh Cache Status', async () => {
                    await refreshCacheStatus();
                    await refreshStats();
                    await updateStorageInfo();
                  })}
                  disabled={isLoading}
                  className="me-2"
                >
                  <FaSync className={isLoading ? 'fa-spin' : ''} />
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={getDebugInfo}
                  disabled={isLoading}
                >
                  <FaEye /> Debug
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Service Worker Status */}
              <Row className="mb-3">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>Service Worker Status</Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Status:</span>
                        <Badge bg={swReady ? 'success' : 'danger'}>
                          {swReady ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Controlling:</span>
                        <Badge bg={swManager?.isControlling() ? 'success' : 'warning'}>
                          {swManager?.isControlling() ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      {hasUpdate && (
                        <Alert variant="info" className="mb-2">
                          <small>
                            Service Worker update available.{' '}
                            <Button size="sm" variant="link" onClick={applyUpdate} className="p-0">
                              Apply Update
                            </Button>
                          </small>
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>Browser Cache Status</Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Status:</span>
                        <Badge bg={cacheReady ? 'success' : 'danger'}>
                          {cacheReady ? 'Ready' : 'Not Ready'}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Preloading:</span>
                        <Badge bg={isPreloading ? 'primary' : 'secondary'}>
                          {isPreloading ? 'In Progress' : 'Idle'}
                        </Badge>
                      </div>
                      {isPreloading && (
                        <div className="text-center">
                          <Spinner animation="border" size="sm" />
                          <small className="ms-2">Loading images...</small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Cache Statistics */}
              <Row className="mb-3">
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Hero Images</h6>
                      <Badge bg={getCacheStatusColor(swCacheStatus?.['pro-g-hero-v3']?.count || 0)} className="fs-6">
                        {swCacheStatus?.['pro-g-hero-v3']?.count || 0}
                      </Badge>
                      <div className="small text-muted mt-1">Service Worker</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Browser Cache</h6>
                      <Badge bg={getCacheStatusColor(cacheStats?.browserCacheSize || 0)} className="fs-6">
                        {cacheStats?.browserCacheSize || 0}
                      </Badge>
                      <div className="small text-muted mt-1">Memory</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Preloaded</h6>
                      <Badge bg={getCacheStatusColor(cacheStats?.preloadedCount || 0)} className="fs-6">
                        {cacheStats?.preloadedCount || 0}
                      </Badge>
                      <div className="small text-muted mt-1">Ready</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Storage Information */}
              {storageInfo && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Card>
                      <Card.Header>Storage Usage</Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={4}>
                            <div className="text-center">
                              <h6>Used</h6>
                              <div className="h5">{formatBytes(storageInfo.usage)}</div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center">
                              <h6>Available</h6>
                              <div className="h5">{formatBytes(storageInfo.quota)}</div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center">
                              <h6>Usage %</h6>
                              <div className="h5">{storageInfo.usagePercentage}%</div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Action Buttons */}
              <Row className="mb-3">
                <Col md={12}>
                  <Card>
                    <Card.Header>Cache Actions</Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2 d-md-flex">
                        <Button
                          variant="primary"
                          onClick={() => handleAction('Preload Hero Images', preloadHeroImages)}
                          disabled={isLoading}
                        >
                          <FaDownload className="me-2" />
                          Preload Images
                        </Button>
                        <Button
                          variant="warning"
                          onClick={() => handleAction('Clear Browser Cache', clearBrowserCache)}
                          disabled={isLoading}
                        >
                          <FaTrash className="me-2" />
                          Clear Browser Cache
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleAction('Clear All Caches', clearCaches)}
                          disabled={isLoading}
                        >
                          <FaTrash className="me-2" />
                          Clear All Caches
                        </Button>
                      </div>
                      {isLoading && (
                        <div className="mt-2 text-center">
                          <Spinner animation="border" size="sm" className="me-2" />
                          <small>{lastAction}...</small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Cached Images List */}
              {swCacheStatus && (
                <Row>
                  <Col md={12}>
                    <Card>
                      <Card.Header>Cached Images</Card.Header>
                      <Card.Body>
                        {Object.entries(swCacheStatus).map(([cacheName, cacheData]) => (
                          <div key={cacheName} className="mb-3">
                            <h6>{cacheName.replace('pro-g-', '').replace('-v3', '')} Cache</h6>
                            {cacheData.urls && cacheData.urls.length > 0 ? (
                              <Table responsive size="sm">
                                <thead>
                                  <tr>
                                    <th>URL</th>
                                    <th>Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cacheData.urls.slice(0, 10).map((url, index) => (
                                    <tr key={index}>
                                      <td>
                                        <small className="text-truncate d-block" style={{maxWidth: '400px'}}>
                                          {url}
                                        </small>
                                      </td>
                                      <td>
                                        <Badge bg="secondary" className="small">
                                          {url.includes('/api/') ? 'API' : 
                                           url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? 'Image' : 'Other'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            ) : (
                              <small className="text-muted">No cached items</small>
                            )}
                            {cacheData.urls && cacheData.urls.length > 10 && (
                              <small className="text-muted">
                                ... and {cacheData.urls.length - 10} more items
                              </small>
                            )}
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Performance Metrics */}
              {performanceMetrics && (
                <Row className="mt-3">
                  <Col md={12}>
                    <Card>
                      <Card.Header>Performance Debug</Card.Header>
                      <Card.Body>
                        <pre className="small">
                          {JSON.stringify(performanceMetrics, null, 2)}
                        </pre>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HeroCacheManager;
