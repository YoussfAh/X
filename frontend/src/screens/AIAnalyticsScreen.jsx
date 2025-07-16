import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Tab, Tabs, Spinner } from 'react-bootstrap';
import { 
  FaBrain, 
  FaChartLine, 
  FaHistory, 
  FaPlay, 
  FaInfoCircle,
  FaRocket,
  FaCog
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import AnalysisResults from '../components/aiAnalysis/AnalysisResults';
import AnalysisHistory from '../components/aiAnalysis/AnalysisHistory';
import AIServiceStatus from '../components/aiAnalysis/AIServiceStatus';
import { DataSelector, DateRangeSelector } from '../components/aiAnalysis';
import { format, subDays } from 'date-fns';
import { 
  useGetUserDataForAnalysisQuery,
  useAnalyzeUserDataMutation,
  useGetAnalysisStatsQuery 
} from '../slices/aiAnalysisApiSlice';
import Message from '../components/Message';
import Meta from '../components/Meta';

const AIAnalyticsScreen = () => {
  const [activeTab, setActiveTab] = useState('analyze');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // State for data selection and date range
  const [selectedDataTypes, setSelectedDataTypes] = useState(['all']);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    preset: 'last90days'
  });
  
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const { userInfo } = useSelector((state) => state.auth);

  // Get user data for analysis
  const { 
    data: userData, 
    isLoading: isLoadingData, 
    error: dataError 
  } = useGetUserDataForAnalysisQuery({
    dataTypes: selectedDataTypes.length > 0 ? selectedDataTypes.join(',') : 'all',
    dateRange: dateRange,
    userId: null
  });

  // Get analysis stats
  const { 
    data: statsData, 
    isLoading: isLoadingStats 
  } = useGetAnalysisStatsQuery();

  // Analyze user data mutation
  const [analyzeUserData, { isLoading: isAnalyzing }] = useAnalyzeUserDataMutation();

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleAnalyze = async () => {
    if (!userData) return;

    try {
      const prompt = analysisType === 'custom' && customPrompt.trim() 
        ? customPrompt.trim()
        : getDefaultPrompt(analysisType);

      const result = await analyzeUserData({
        analysisType,
        prompt,
        userData,
        dataTypes: selectedDataTypes.join(','),
        dateRange
      }).unwrap();

      setAnalysisResults(result);
      
      // Switch to results tab if analysis is successful
      if (result.analysis) {
        setActiveTab('results');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleDataTypeChange = (dataTypes) => {
    setSelectedDataTypes(dataTypes);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const getDefaultPrompt = (type) => {
    const prompts = {
      comprehensive: "Please provide a comprehensive analysis of my fitness and health data. Include insights about my workout performance, nutrition patterns, sleep quality, and overall progress. Provide specific, actionable recommendations for improvement.",
      workout: "Analyze my workout performance and provide insights about my training patterns, strength progress, and recommendations for optimizing my workout routine.",
      nutrition: "Review my nutrition and diet data. Provide insights about my eating patterns, macro balance, and recommendations for improving my nutrition.",
      recovery: "Analyze my sleep and recovery data. Provide insights about my rest patterns and recommendations for better recovery.",
      progress: "Evaluate my overall fitness progress over time. Show me trends, achievements, and areas where I can improve further."
    };
    return prompts[type] || prompts.comprehensive;
  };

  const getDataSummary = () => {
    if (!userData) return null;

    const { workouts = [], diet = [], sleep = [], weight = [], quizzes = [] } = userData;
    
    return {
      workouts: workouts.length,
      diet: diet.length,
      sleep: sleep.length,
      weight: weight.length,
      quizzes: quizzes.length,
      total: workouts.length + diet.length + sleep.length + weight.length + quizzes.length
    };
  };

  const dataSummary = getDataSummary();

  // Theme colors
  const colors = {
    background: isDarkMode ? '#121212' : '#ffffff',
    cardBackground: isDarkMode ? '#1a1a1a' : '#f8f9fa',
    text: isDarkMode ? '#ffffff' : '#333333',
    border: isDarkMode ? '#333333' : '#dee2e6',
    muted: isDarkMode ? '#888888' : '#6c757d',
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  return (
    <>
      <Meta title="AI Analytics - Personalized Fitness Insights" />
      <Container fluid className="py-4">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="display-5 fw-bold mb-3" style={{ color: colors.text }}>
                <FaBrain className="me-3" style={{ color: colors.primary }} />
                AI Analytics
              </h1>
              <p className="lead" style={{ color: colors.muted }}>
                Get personalized insights and recommendations powered by AI analysis of your fitness data
              </p>
            </div>

            {/* Data Overview Card */}
            {dataSummary && (
              <Card className="mb-4" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <Card.Body>
                  <Row className="text-center">
                    <Col>
                      <h6 style={{ color: colors.muted }}>Available Data Points</h6>
                      <Row className="mt-3">
                        <Col>
                          <div style={{ color: colors.info }}>
                            <FaChartLine size={20} />
                            <div className="mt-1 fw-bold">{dataSummary.workouts}</div>
                            <small style={{ color: colors.muted }}>Workouts</small>
                          </div>
                        </Col>
                        <Col>
                          <div style={{ color: colors.success }}>
                            <FaChartLine size={20} />
                            <div className="mt-1 fw-bold">{dataSummary.diet}</div>
                            <small style={{ color: colors.muted }}>Meals</small>
                          </div>
                        </Col>
                        <Col>
                          <div style={{ color: colors.warning }}>
                            <FaChartLine size={20} />
                            <div className="mt-1 fw-bold">{dataSummary.sleep}</div>
                            <small style={{ color: colors.muted }}>Sleep</small>
                          </div>
                        </Col>
                        <Col>
                          <div style={{ color: colors.primary }}>
                            <FaChartLine size={20} />
                            <div className="mt-1 fw-bold">{dataSummary.weight}</div>
                            <small style={{ color: colors.muted }}>Weight</small>
                          </div>
                        </Col>
                        <Col>
                          <div style={{ color: colors.text }}>
                            <FaChartLine size={20} />
                            <div className="mt-1 fw-bold">{dataSummary.total}</div>
                            <small style={{ color: colors.muted }}>Total</small>
                          </div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Main Content Tabs */}
            <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={setActiveTab}
                  className="mb-4"
                >
                  {/* Analysis Generator Tab */}
                  <Tab eventKey="analyze" title={
                    <span>
                      <FaRocket className="me-2" />
                      Generate Analysis
                    </span>
                  }>
                    <div style={{ color: colors.text }}>
                      {dataError && (
                        <Alert variant="danger">
                          <FaInfoCircle className="me-2" />
                          Error loading your data: {dataError.message}
                        </Alert>
                      )}

                      {isLoadingData ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" style={{ color: colors.primary }} />
                          <p className="mt-3" style={{ color: colors.muted }}>Loading your fitness data...</p>
                        </div>
                      ) : userData && dataSummary?.total === 0 ? (
                        <Alert variant="info">
                          <FaInfoCircle className="me-2" />
                          <strong>No data available for analysis.</strong>
                          <p className="mt-2 mb-0">
                            Start tracking your workouts, meals, sleep, and weight to get personalized AI insights!
                          </p>
                        </Alert>
                      ) : (
                        <>
                          {/* Data Selection - Full width row */}
                          <Row className="mb-4">
                            <Col>
                              <Card style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                                <Card.Header>
                                  <h6 className="mb-0" style={{ color: colors.text }}>Data Selection</h6>
                                </Card.Header>
                                <Card.Body>
                                  <DataSelector
                                    selectedDataTypes={selectedDataTypes}
                                    onChange={handleDataTypeChange}
                                    userData={userData}
                                    isLoading={isLoadingData}
                                  />
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>

                          {/* Date Range - Full width row */}
                          <Row className="mb-4">
                            <Col>
                              <Card style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                                <Card.Header>
                                  <h6 className="mb-0" style={{ color: colors.text }}>Date Range</h6>
                                </Card.Header>
                                <Card.Body>
                                  <DateRangeSelector
                                    dateRange={dateRange}
                                    onChange={handleDateRangeChange}
                                  />
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>

                          {/* Analysis Type - Full width row */}
                          <Row className="mb-4">
                            <Col>
                              <Card style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                                <Card.Header>
                                  <h6 className="mb-0" style={{ color: colors.text }}>Analysis Type</h6>
                                </Card.Header>
                                <Card.Body>
                                  <Form.Group>
                                    <Form.Select
                                      value={analysisType}
                                      onChange={(e) => setAnalysisType(e.target.value)}
                                      style={{
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.text
                                      }}
                                    >
                                      <option value="comprehensive">Comprehensive Overview</option>
                                      <option value="workout">Workout Performance</option>
                                      <option value="nutrition">Nutrition Analysis</option>
                                      <option value="recovery">Recovery & Sleep</option>
                                      <option value="progress">Progress Tracking</option>
                                      <option value="custom">Custom Question</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>

                          {/* Custom Question - Full width row (conditional) */}
                          {analysisType === 'custom' && (
                            <Row className="mb-4">
                              <Col>
                                <Card style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                                  <Card.Header>
                                    <h6 className="mb-0" style={{ color: colors.text }}>Your Question</h6>
                                  </Card.Header>
                                  <Card.Body>
                                    <Form.Group>
                                      <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        placeholder="Ask a specific question about your fitness data..."
                                        style={{
                                          backgroundColor: colors.background,
                                          borderColor: colors.border,
                                          color: colors.text
                                        }}
                                      />
                                      <Form.Text style={{ color: colors.muted }}>
                                        Be specific about what insights you're looking for!
                                      </Form.Text>
                                    </Form.Group>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                          )}

                          {/* Generate Analysis Button - Full width row */}
                          <Row className="mb-4">
                            <Col>
                              <Card style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                                <Card.Body className="text-center">
                                  <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !userData}
                                    className="px-5"
                                    style={{
                                      backgroundColor: colors.primary,
                                      borderColor: colors.primary
                                    }}
                                  >
                                    {isAnalyzing ? (
                                      <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Analyzing...
                                      </>
                                    ) : (
                                      <>
                                        <FaPlay className="me-2" />
                                        Generate AI Analysis
                                      </>
                                    )}
                                  </Button>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>

                          {/* Info Alert - Full width row */}
                          <Row>
                            <Col>
                              <Alert variant="info">
                                <FaInfoCircle className="me-2" />
                                <strong>How it works:</strong> Our AI will analyze your fitness data and provide personalized insights, 
                                trends, and actionable recommendations to help you achieve your goals.
                              </Alert>
                            </Col>
                          </Row>
                        </>
                      )}
                    </div>
                  </Tab>

                  {/* Results Tab */}
                  <Tab eventKey="results" title={
                    <span>
                      <FaChartLine className="me-2" />
                      Results
                    </span>
                  }>
                    {analysisResults ? (
                      <AnalysisResults analysisResults={analysisResults} />
                    ) : (
                      <Alert variant="info">
                        <FaInfoCircle className="me-2" />
                        No analysis results yet. Generate an analysis to see insights here.
                      </Alert>
                    )}
                  </Tab>

                  {/* History Tab */}
                  <Tab eventKey="history" title={
                    <span>
                      <FaHistory className="me-2" />
                      History
                    </span>
                  }>
                    <AnalysisHistory />
                  </Tab>

                  {/* Service Status Tab */}
                  <Tab eventKey="status" title={
                    <span>
                      <FaCog className="me-2" />
                      Service Status
                    </span>
                  }>
                    <AIServiceStatus />
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>

            {/* Stats Overview */}
            {statsData && (
              <Card className="mt-4" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <Card.Body>
                  <h6 style={{ color: colors.text }}>Your AI Analytics Summary</h6>
                  <Row className="text-center mt-3">
                    <Col>
                      <div style={{ color: colors.primary }}>
                        <strong style={{ fontSize: '1.5rem' }}>{statsData.totalAnalyses || 0}</strong>
                        <div style={{ color: colors.muted, fontSize: '0.9rem' }}>Total Analyses</div>
                      </div>
                    </Col>
                    <Col>
                      <div style={{ color: colors.success }}>
                        <strong style={{ fontSize: '1.5rem' }}>{statsData.favoriteAnalyses || 0}</strong>
                        <div style={{ color: colors.muted, fontSize: '0.9rem' }}>Favorites</div>
                      </div>
                    </Col>
                    <Col>
                      <div style={{ color: colors.warning }}>
                        <strong style={{ fontSize: '1.5rem' }}>{statsData.thisMonth || 0}</strong>
                        <div style={{ color: colors.muted, fontSize: '0.9rem' }}>This Month</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AIAnalyticsScreen;
