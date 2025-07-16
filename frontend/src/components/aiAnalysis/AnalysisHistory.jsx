import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Badge, 
  Button, 
  Form, 
  Pagination,
  Modal,
  Alert,
  Spinner,
  Dropdown
} from 'react-bootstrap';
import { 
  FaClock, 
  FaHeart, 
  FaRegHeart, 
  FaStar, 
  FaEye, 
  FaTrash, 
  FaTag,
  FaChartLine,
  FaDumbbell,
  FaUtensils,
  FaBed,
  FaWeight,
  FaClipboardCheck,
  FaArrowRight
} from 'react-icons/fa';
import { format } from 'date-fns';
import { 
  useGetAnalysisHistoryQuery,
  useGetAnalysisByIdQuery,
  useUpdateAnalysisMutation,
  useDeleteAnalysisMutation
} from '../../slices/aiAnalysisApiSlice';
import AIResponseRenderer from './AIResponseRenderer';

const AnalysisHistory = ({ userId = null, selectedUser = null }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const {
    data: historyData,
    isLoading,
    error,
    refetch
  } = useGetAnalysisHistoryQuery({
    userId,
    page: currentPage,
    limit: 10,
    analysisType: filterType,
    isFavorite: showFavoritesOnly || undefined
  }, {
    skip: !userId  // Skip the query if no userId is provided
  });

  const {
    data: analysisDetail,
    isLoading: isLoadingDetail
  } = useGetAnalysisByIdQuery(selectedAnalysis, {
    skip: !selectedAnalysis
  });

  const [updateAnalysis] = useUpdateAnalysisMutation();
  const [deleteAnalysis] = useDeleteAnalysisMutation();

  const getAnalysisTypeIcon = (type) => {
    switch (type) {
      case 'workout':
      case 'performance':
        return <FaDumbbell className="text-primary" />;
      case 'nutrition':
        return <FaUtensils className="text-success" />;
      case 'recovery':
        return <FaBed className="text-info" />;
      case 'progress':
        return <FaChartLine className="text-warning" />;
      case 'weight':
        return <FaWeight className="text-secondary" />;
      case 'quizzes':
        return <FaClipboardCheck className="text-dark" />;
      default:
        return <FaChartLine className="text-muted" />;
    }
  };

  const getAnalysisTypeBadge = (type) => {
    const variants = {
      comprehensive: 'primary',
      workout: 'info',
      performance: 'info',
      nutrition: 'success',
      recovery: 'secondary',
      progress: 'warning',
      custom: 'dark'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  const handleToggleFavorite = async (id, currentFavorite) => {
    try {
      await updateAnalysis({ 
        id, 
        isFavorite: !currentFavorite 
      }).unwrap();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteAnalysis(id).unwrap();
      } catch (error) {
        console.error('Error deleting analysis:', error);
      }
    }
  };

  const handleViewAnalysis = (id) => {
    setSelectedAnalysis(id);
    setShowModal(true);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={i < rating ? 'text-warning' : 'text-muted'}
        size="0.8rem"
      />
    ));
  };

  if (!userId) {
    return (
      <Alert variant="info">
        <FaEye className="me-2" />
        Please select a user to view their analysis history.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
        <p className="mt-2">Loading analysis history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Error loading analysis history. Please try again.
      </Alert>
    );
  }

  const { analyses = [], totalPages = 1, total = 0 } = historyData || {};

  return (
    <div>
      {/* User Header for Admin View */}
      {selectedUser && userId && (
        <Alert variant="info" className="mb-3">
          <FaEye className="me-2" />
          Viewing analysis history for: <strong>{selectedUser.name}</strong> ({selectedUser.email})
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">Analysis History ({total} total)</h5>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Form.Select
                  size="sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="workout">Workout Focus</option>
                  <option value="nutrition">Nutrition Focus</option>
                  <option value="recovery">Recovery Focus</option>
                  <option value="progress">Progress Focus</option>
                  <option value="custom">Custom</option>
                </Form.Select>
                <Form.Check
                  type="switch"
                  id="favorites-only"
                  label="Favorites"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                />
              </div>
            </Col>
          </Row>
        </Card.Header>
      </Card>

      {/* Analysis List */}
      {analyses.length === 0 ? (
        <Alert variant="info">
          No analyses found. Start by creating your first AI analysis!
        </Alert>
      ) : (
        <>
          {analyses.map((analysis) => (
            <Card key={analysis._id} className="mb-3">
              <Card.Body>
                <Row className="align-items-start">
                  <Col>
                    <div className="d-flex align-items-center mb-2">
                      {getAnalysisTypeIcon(analysis.analysisType)}
                      <span className="ms-2 me-3">{getAnalysisTypeBadge(analysis.analysisType)}</span>
                      <small className="text-muted">
                        <FaClock className="me-1" />
                        {format(new Date(analysis.createdAt), 'MMM d, yyyy - h:mm a')}
                      </small>
                      {analysis.metadata?.responseTime && (
                        <small className="text-muted ms-2">
                          ({(analysis.metadata.responseTime / 1000).toFixed(1)}s)
                        </small>
                      )}
                    </div>
                    
                    <h6 className="mb-2">
                      {analysis.prompt.length > 100 
                        ? `${analysis.prompt.substring(0, 100)}...` 
                        : analysis.prompt}
                    </h6>
                    
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <small className="text-muted">
                        Data used: {analysis.dataUsed.workoutsCount} workouts, {analysis.dataUsed.dietCount} meals, {analysis.dataUsed.sleepCount} sleep records
                      </small>
                    </div>

                    {analysis.tags && analysis.tags.length > 0 && (
                      <div className="mb-2">
                        {analysis.tags.map((tag, index) => (
                          <Badge key={index} bg="light" text="dark" className="me-1">
                            <FaTag className="me-1" size="0.7rem" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {analysis.rating && (
                      <div className="mb-2">
                        {renderStars(analysis.rating)}
                      </div>
                    )}
                  </Col>
                  
                  <Col xs="auto">
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewAnalysis(analysis._id)}
                      >
                        <FaEye />
                      </Button>
                      
                      <Button
                        variant={analysis.isFavorite ? "warning" : "outline-secondary"}
                        size="sm"
                        onClick={() => handleToggleFavorite(analysis._id, analysis.isFavorite)}
                      >
                        {analysis.isFavorite ? <FaHeart /> : <FaRegHeart />}
                      </Button>
                      
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(analysis._id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                />
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Analysis Detail Modal */}
      <Modal 
        show={showModal} 
        onHide={() => {
          setShowModal(false);
          setSelectedAnalysis(null);
        }}
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Analysis Details
            {analysisDetail && (
              <Badge bg="secondary" className="ms-2">
                {analysisDetail.analysisType}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoadingDetail ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : analysisDetail ? (
            <div>
              <div className="mb-3">
                <strong>Question:</strong>
                <p className="mt-1">{analysisDetail.prompt}</p>
              </div>
              
              <div className="mb-3">
                <strong>Date:</strong>
                <span className="ms-2">
                  {format(new Date(analysisDetail.createdAt), 'MMMM d, yyyy - h:mm a')}
                </span>
              </div>

              <div className="mb-3">
                <strong>Data Used:</strong>
                <div className="mt-1">
                  <Badge bg="primary" className="me-1">{analysisDetail.dataUsed.workoutsCount} workouts</Badge>
                  <Badge bg="success" className="me-1">{analysisDetail.dataUsed.dietCount} meals</Badge>
                  <Badge bg="info" className="me-1">{analysisDetail.dataUsed.sleepCount} sleep</Badge>
                  <Badge bg="warning" className="me-1">{analysisDetail.dataUsed.weightCount} weight</Badge>
                  <Badge bg="secondary">{analysisDetail.dataUsed.quizzesCount} quizzes</Badge>
                </div>
              </div>

              <div className="mb-3">
                <strong>AI Response:</strong>
                <div className="mt-2">
                  <AIResponseRenderer 
                    analysisText={analysisDetail.response} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="warning">Unable to load analysis details.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowModal(false);
              setSelectedAnalysis(null);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AnalysisHistory;
