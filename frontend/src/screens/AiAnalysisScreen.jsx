import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Nav, Tab, Alert, Accordion, ButtonGroup, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { 
  useGetUserDataForAnalysisQuery, 
  useAnalyzeUserDataMutation 
} from '../slices/aiAnalysisApiSlice';
import { optimizeDataForSmallAI } from '../utils/dataOptimization';
import { useRefreshUserDataQuery } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import useFeatureFlagSync from '../hooks/useFeatureFlagSync';
import { 
  FaBrain, 
  FaHistory,
  FaPlus,
  FaSync
} from 'react-icons/fa';
import { format, subDays } from 'date-fns';
import {
  DataSelector,
  DateRangeSelector,
  AnalysisInterface,
  AnalysisResults,
  DataStatus,
  AnalysisHistory
} from '../components/aiAnalysis';
import Meta from '../components/Meta';

const AiAnalysisScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // Use the feature flag synchronization hook
  const { refreshFlags, isRefreshing, currentFlags } = useFeatureFlagSync({
    autoRefresh: true,
    checkInterval: 10000, // Check every 10 seconds for faster updates
    onFlagsUpdated: (newFlags, oldFlags) => {
      console.log('🔄 Feature flags updated in real-time!');
      console.log('  AI Analysis changed:', oldFlags.aiAnalysis, '->', newFlags.aiAnalysis);
      
      // If AI analysis was just enabled, show a success message
      if (!oldFlags.aiAnalysis && newFlags.aiAnalysis) {
        // You could show a toast notification here
        console.log('🎉 AI Analysis feature has been enabled for your account!');
      }
    }
  });
  
  // Debug logging
  console.log('=== User AI Analysis Screen Debug ===');
  console.log('User Info:', userInfo);
  console.log('Is user logged in:', !!userInfo);
  console.log('Current Feature Flags:', currentFlags);
  console.log('AI Analysis Enabled:', currentFlags?.aiAnalysis);
  
  // Manual refresh function for UI buttons
  const handleManualRefresh = async () => {
    console.log('🔄 Manually refreshing feature flags...');
    await refreshFlags();
  };

  // State for tabs
  const [activeTab, setActiveTab] = useState('new-analysis');
  
  // State for data selection
  const [selectedDataTypes, setSelectedDataTypes] = useState(['all']);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    preset: 'last90days'
  });
  
  // State for analysis
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizedData, setOptimizedData] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  // RTK Query hooks
  const {
    data: userData,
    isLoading: isLoadingData,
    error: dataError,
    refetch: refetchData
  } = useGetUserDataForAnalysisQuery(
    {
      dataTypes: selectedDataTypes.length > 0 ? selectedDataTypes.join(',') : 'all',
      dateRange: dateRange,
      userId: null // Explicitly set to null for regular users
    },
    { 
      refetchOnMountOrArgChange: 30, // Refetch when params change or after 30 seconds
      refetchOnFocus: false,
      refetchOnReconnect: false
    }
  );

  const [analyzeUserData] = useAnalyzeUserDataMutation();

  // Handle data type selection - receives array of selected types from DataSelector
  const handleDataTypeChange = (newSelectedTypes) => {
    // Allow empty selection, but default to 'all' if completely empty for API calls
    setSelectedDataTypes(newSelectedTypes);
  };

  // Handle AI analysis
  const handleAnalyze = async () => {
    if (!analysisPrompt.trim()) {
      alert('Please enter a question or request for analysis.');
      return;
    }

    if (!userData) {
      alert('Please wait for data to load before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const dataToSend = optimizedData || userData;

      const result = await analyzeUserData({
        userData: dataToSend,
        prompt: analysisPrompt,
        analysisType,
        dataTypes: selectedDataTypes.join(',')
      }).unwrap();
      
      console.log('Analysis result received:', result);
      console.log('Analysis saved with ID:', result.id);
      
      setAnalysisResults(result);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error.data?.message || error.message || 'Failed to analyze data. Please try again.';
    alert(`Analysis Failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Refetch data when date range or data types change
  useEffect(() => {
    console.log('=== User AI Analysis - Data params changed ===');
    console.log('User Info:', userInfo);
    console.log('Selected data types:', selectedDataTypes);
    console.log('Selected data types joined:', selectedDataTypes.join(','));
    console.log('Date range:', dateRange);
    console.log('Data error:', dataError);
    console.log('Is loading data:', isLoadingData);
    console.log('User data:', userData);
    
    if (dataError) {
      console.error('API Error details:', dataError);
    }
    
    if (userInfo) {
      console.log('User is logged in, refetching data...');
      refetchData();
    } else {
      console.log('User is NOT logged in!');
    }
  }, [selectedDataTypes, dateRange, refetchData, userInfo]);

  // Get data summary for display
  const getDataSummary = () => {
    if (!userData) return null;
    
    return {
      workouts: userData.workouts?.length || 0,
      diet: userData.diet?.length || 0,
      sleep: userData.sleep?.length || 0,
      weight: userData.weight?.length || 0,
      quizzes: userData.quizzes?.length || 0
    };
  };

  const dataSummary = getDataSummary();

  // If user is not logged in, show login message
  if (!userInfo) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="warning" className="text-center">
              <h4>Please Login</h4>
              <p>You need to be logged in to access the AI Analysis feature.</p>
              <Button variant="primary" href="/login">
                Go to Login
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // If user doesn't have AI analysis feature enabled, show access denied message
  if (!currentFlags?.aiAnalysis) {
    return (
      <>
        <Meta title="AI Analysis - Access Required" />
        
        {/* Dark Mode Optimized Styles */}
        <style>{`
          .access-denied-container {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            min-height: 100vh;
            color: #ffffff;
          }
          
          .access-denied-card {
            background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3a 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
          }
          
          .access-denied-icon-wrapper {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            box-shadow: 0 8px 24px rgba(220, 53, 69, 0.3);
            border: 3px solid rgba(220, 53, 69, 0.2);
          }
          
          .access-denied-title {
            color: #ff6b7a;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
          
          .access-denied-subtitle {
            color: #b8b8c8;
            line-height: 1.6;
          }
          
          .features-box {
            background: linear-gradient(135deg, #2d3748 0%, #374151 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .features-box h6 {
            color: #fbbf24;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          .feature-item {
            color: #e5e7eb;
            border-left: 3px solid #6366f1;
            padding-left: 12px;
            margin-left: 8px;
            background: rgba(99, 102, 241, 0.05);
            border-radius: 0 8px 8px 0;
            padding: 8px 12px;
            margin-bottom: 8px;
          }
          
          .feature-item strong {
            color: #a78bfa;
          }
          
          .btn-check-access {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
          }
          
          .btn-check-access:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          
          .btn-check-access:disabled {
            background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
            box-shadow: none;
          }
          
          .btn-home {
            background: transparent;
            border: 2px solid rgba(255, 255, 255, 0.2);
            color: #d1d5db;
            transition: all 0.3s ease;
          }
          
          .btn-home:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            color: #ffffff;
            transform: translateY(-2px);
          }
          
          .status-section {
            background: rgba(55, 65, 81, 0.5);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
          }
          
          .status-text {
            color: #9ca3af;
          }
          
          .status-highlight {
            color: #60a5fa;
            font-weight: 600;
          }
          
          .contact-text {
            color: #d1d5db;
          }
          
          .contact-highlight {
            color: #34d399;
            font-weight: 600;
          }
        `}</style>

        <Container fluid className="access-denied-container py-5">
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <Card className="access-denied-card border-0">
                <Card.Body className="text-center p-5">
                  <div className="mb-4">
                    <div className="d-inline-flex align-items-center justify-content-center access-denied-icon-wrapper rounded-circle mb-4" style={{ width: '90px', height: '90px' }}>
                      <FaBrain size={36} className="text-white" />
                    </div>
                    <h3 className="access-denied-title fw-bold mb-3">AI Analysis Not Available</h3>
                    <p className="access-denied-subtitle mb-4 fs-5">
                      You don't have access to the AI Analysis feature yet. This premium feature provides 
                      personalized insights and recommendations based on your fitness data.
                    </p>
                  </div>
                  
                  <div className="features-box rounded-3 p-4 mb-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-center">
                      🎯 What AI Analysis Offers
                    </h6>
                    <div className="text-start">
                      <div className="feature-item">
                        📊 <strong>Personalized Insights:</strong> Deep analysis of your workout patterns and performance trends
                      </div>
                      <div className="feature-item">
                        💡 <strong>Smart Recommendations:</strong> AI-powered suggestions tailored to your fitness goals
                      </div>
                      <div className="feature-item">
                        📈 <strong>Progress Tracking:</strong> Advanced metrics and comprehensive trend analysis
                      </div>
                      <div className="feature-item mb-0">
                        🎯 <strong>Goal Optimization:</strong> Personalized advice to efficiently reach your targets
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center mb-4">
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="btn-check-access px-4 fw-semibold"
                    >
                      <FaSync className={`me-2 ${isRefreshing ? 'fa-spin' : ''}`} />
                      {isRefreshing ? 'Checking Access...' : 'Check Access Again'}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="lg"
                      href="/"
                      className="btn-home px-4 fw-semibold"
                    >
                      Return Home
                    </Button>
                  </div>

                  <div className="status-section pt-4">
                    <div className="contact-text mb-3">
                      <strong className="contact-highlight">Need access?</strong> Contact your administrator or trainer to enable this feature for your account.
                    </div>
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-3 status-text small">
                      <span className="d-flex align-items-center">
                        🕐 <span className="ms-1">Last checked: <span className="status-highlight">{new Date().toLocaleTimeString()}</span></span>
                      </span>
                      <span className="d-flex align-items-center">
                        🔄 <span className="ms-1">Auto-checking <span className="status-highlight">every 10 seconds</span></span>
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }

  return (
    <>
      <Meta title="AI Fitness Analysis" />
      
      {/* Enhanced Custom Styles */}
      <style>{`
        .ai-analysis-container {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
        }
        
        .ai-header-enhanced {
          background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #1e40af 100%);
          border: none;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.25);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          margin-bottom: 1.5rem;
        }
        
        .ai-header-enhanced::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }
        
        .ai-header-content {
          position: relative;
          z-index: 2;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .ai-icon-wrapper {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          width: 64px;
          height: 64px;
        }
        
        .ai-text-content {
          flex: 1;
          min-width: 0;
        }
        
        .ai-title-enhanced {
          font-size: 1.875rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        
        .ai-subtitle-enhanced {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 0;
          line-height: 1.4;
        }
        
        .ai-tabs-enhanced .nav-link {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin-right: 0.5rem;
          padding: 0.75rem 1.25rem;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .ai-tabs-enhanced .nav-link:hover {
          background: rgba(99, 102, 241, 0.15);
          color: #ffffff;
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
        
        .ai-tabs-enhanced .nav-link.active {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
          .ai-title-enhanced {
            font-size: 1.75rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.95rem;
          }
        }
        
        @media (max-width: 992px) {
          .ai-header-content {
            padding: 1.25rem;
            gap: 1.25rem;
          }
          
          .ai-title-enhanced {
            font-size: 1.625rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.9rem;
          }
          
          .ai-icon-wrapper {
            width: 56px;
            height: 56px;
            padding: 0.875rem;
            border-radius: 14px;
          }
        }
        
        @media (max-width: 768px) {
          .ai-header-enhanced {
            border-radius: 14px;
            margin-bottom: 1.25rem;
          }
          
          .ai-header-content {
            padding: 1rem;
            gap: 1rem;
          }
          
          .ai-title-enhanced {
            font-size: 1.5rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.875rem;
          }
          
          .ai-icon-wrapper {
            width: 48px;
            height: 48px;
            padding: 0.75rem;
            border-radius: 12px;
          }
        }
        
        @media (max-width: 576px) {
          .ai-header-enhanced {
            border-radius: 12px;
            margin-bottom: 1rem;
          }
          
          .ai-header-content {
            padding: 0.875rem;
            gap: 0.875rem;
            flex-direction: column;
            text-align: center;
          }
          
          .ai-title-enhanced {
            font-size: 1.375rem;
            margin-bottom: 0.375rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.825rem;
          }
          
          .ai-icon-wrapper {
            width: 44px;
            height: 44px;
            padding: 0.625rem;
            border-radius: 11px;
            margin-bottom: 0.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .ai-header-content {
            padding: 0.75rem;
            gap: 0.75rem;
          }
          
          .ai-title-enhanced {
            font-size: 1.25rem;
            margin-bottom: 0.25rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.775rem;
            line-height: 1.3;
          }
          
          .ai-icon-wrapper {
            width: 40px;
            height: 40px;
            padding: 0.5rem;
            border-radius: 10px;
            margin-bottom: 0.375rem;
          }
        }
        
        @media (max-width: 360px) {
          .ai-header-enhanced {
            margin-bottom: 0.75rem;
          }
          
          .ai-header-content {
            padding: 0.625rem;
            gap: 0.625rem;
          }
          
          .ai-title-enhanced {
            font-size: 1.125rem;
            margin-bottom: 0.2rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.725rem;
            line-height: 1.25;
          }
          
          .ai-icon-wrapper {
            width: 36px;
            height: 36px;
            padding: 0.4rem;
            border-radius: 9px;
            margin-bottom: 0.25rem;
          }
        }
      `}</style>

      <Container fluid className="ai-analysis-container py-4">
        {/* Enhanced Header */}
        <Row className="mb-4">
          <Col>
            <Card className="ai-header-enhanced">
              <div className="ai-header-content">
                <div className="ai-icon-wrapper">
                  <FaBrain size={28} color="#ffffff" />
                </div>
                
                <div className="ai-text-content">
                  <h1 className="ai-title-enhanced">AI Fitness Analysis</h1>
                  <p className="ai-subtitle-enhanced">
                    Get personalized insights and recommendations based on your fitness data
                  </p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Debug Panel - Show in development or when URL contains debug=true */}
        {/* COMMENTED OUT DEBUG PANEL - Uncomment below to re-enable debugging information
        {(process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true')) && (
          <Row className="mb-4">
            <Col>
              <Alert variant="info" className="small">
                <h6>🔍 Debug Information</h6>
                <div className="row">
                  <div className="col-md-6">
                    <strong>User Info:</strong>
                    <ul className="mb-2">
                      <li>Email: {userInfo?.email}</li>
                      <li>ID: {userInfo?._id}</li>
                      <li>Is Admin: {userInfo?.isAdmin ? 'Yes' : 'No'}</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <strong>Feature Flags:</strong>
                    <ul className="mb-2">
                      <li>AI Analysis: {currentFlags?.aiAnalysis ? '✅ Enabled' : '❌ Disabled'}</li>
                      <li>Upload Meal Image: {currentFlags?.uploadMealImage ? '✅ Enabled' : '❌ Disabled'}</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline-primary" 
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="me-2"
                  >
                    <FaSync className={`me-1 ${isRefreshing ? 'fa-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Permissions'}
                  </Button>
                  <small className="text-muted">
                    Auto-refresh: Every 10s | 
                    Status: {isRefreshing ? '🔄 Checking' : '✅ Ready'}
                  </small>
                </div>
              </Alert>
            </Col>
          </Row>
        )}
        */}

        {/* Data Status and Error Handling */}
        {dataError && (
          <Row className="mb-4">
            <Col>
              <Alert variant="danger">
                <h6>Failed to load data</h6>
                <p className="mb-2">{dataError?.data?.message || 'An error occurred while loading your data.'}</p>
                <Button variant="outline-danger" size="sm" onClick={() => refetchData()}>
                  Try Again
                </Button>
              </Alert>
            </Col>
          </Row>
        )}

        {isLoadingData && (
          <Row className="mb-4">
            <Col>
              <Alert variant="info" className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-3" role="status"></div>
                <div>
                  <strong>Loading your data...</strong>
                  <div className="small text-muted">
                    Fetching {selectedDataTypes.includes('all') ? 'all' : selectedDataTypes.join(', ')} data 
                    {dateRange.preset !== 'all' && ` from ${format(new Date(dateRange.startDate), 'MMM dd, yyyy')} to ${format(new Date(dateRange.endDate), 'MMM dd, yyyy')}`}
                  </div>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        {userData && !isLoadingData && (
          <Row className="mb-4">
            <Col>
              <Alert variant="success" className="border-0" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <strong className="text-success">Data Loaded Successfully</strong>
                    <div className="small text-muted mt-1">
                      <span className="d-block d-sm-inline">
                        {dateRange.preset === 'all' ? 'All data loaded' : 
                         `Data from ${format(new Date(dateRange.startDate), 'MMM dd, yyyy')} to ${format(new Date(dateRange.endDate), 'MMM dd, yyyy')}`}
                        {dateRange.preset && dateRange.preset !== 'custom' && dateRange.preset !== 'all' && (
                          <span className="fw-semibold"> ({dateRange.preset})</span>
                        )}
                      </span>
                      <span className="d-block d-sm-inline">
                        <span className="d-none d-sm-inline"> • </span>
                        {userData.workouts?.length || 0} workouts, {userData.diet?.length || 0} meals, {userData.sleep?.length || 0} sleep records, {userData.weight?.length || 0} weight entries, {userData.quizzes?.length || 0} quizzes
                      </span>
                    </div>
                  </div>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="pills" className="ai-tabs-enhanced mb-4">
            <Nav.Item>
              <Nav.Link eventKey="new-analysis">
                <FaPlus className="me-2" />
                New Analysis
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="history">
                <FaHistory className="me-2" />
                History
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="new-analysis">
              {/* Row 1: Data Selection and Date Range - Side by Side */}
              <Row className="g-2 mb-3">
                <Col md={6}>
                  <DataSelector
                    selectedDataTypes={selectedDataTypes}
                    onChange={handleDataTypeChange}
                    userData={userData}
                    isLoading={isLoadingData}
                  />
                </Col>
                <Col md={6}>
                  <DateRangeSelector
                    dateRange={dateRange}
                    onChange={setDateRange}
                  />
                </Col>
              </Row>

              {/* Row 2: Data Optimization - Full Row */}
              {userData && !isLoadingData && (
                <Row className="mb-3">
                  <Col>
                    <Card className="mb-4">
                      <Card.Body>
                        <h5 className="card-title">Data Optimization</h5>
                        <p className="card-text small text-muted">Compress the data to reduce payload size for the AI.</p>
                        <div className="mb-3">
                          <p className="card-text small text-muted mb-2">Select a compression level:</p>
                          <ButtonGroup aria-label="Compression level">
                            <Button variant="outline-primary" onClick={() => setOptimizedData(optimizeDataForSmallAI(userData, 1))}>Standard</Button>
                            <Button variant="outline-secondary" onClick={() => setOptimizedData(optimizeDataForSmallAI(userData, 2))}>Aggressive</Button>
                            <Button variant="outline-dark" onClick={() => setOptimizedData(optimizeDataForSmallAI(userData, 3))}>Maximum</Button>
                            <Button variant="outline-danger" onClick={() => setOptimizedData(optimizeDataForSmallAI(userData, 4))}>Hyper</Button>
                          </ButtonGroup>
                        </div>
                        {optimizedData && (
                          <div>
                            <h6>Optimization Results:</h6>
                            <p className="mb-1">Original Size: {optimizedData._opt.orig_size} bytes</p>
                            <p className="mb-1">Compressed Size: {optimizedData._opt.new_size} bytes</p>
                            <p className="mb-2">Reduction: {optimizedData._opt.reduction}</p>
                            <h6>Preview:</h6>
                            <pre className="p-2 rounded" style={{ maxHeight: '100px', overflow: 'auto', backgroundColor: '#272c30', color: '#f8f9fa', border: '1px solid #444', whiteSpace: 'nowrap' }}><code>{JSON.stringify(optimizedData).substring(0, 500)}...</code></pre>
                            <Button onClick={() => {
                              const dataStr = JSON.stringify(optimizedData);
                              const dataBlob = new Blob([dataStr], {type: 'application/json'});
                              const url = URL.createObjectURL(dataBlob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = 'optimized-data.json';
                              link.click();
                              URL.revokeObjectURL(url);
                            }} variant="secondary" size="sm" className="me-2">Download JSON</Button>
                            <Button onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(optimizedData));
                              setCopySuccess('Copied!');
                              setTimeout(() => setCopySuccess(''), 2000);
                            }} variant="secondary" size="sm" className="me-2">{copySuccess || 'Copy to Clipboard'}</Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Row 3: View Data Payload - Full Row */}
              {userData && !isLoadingData && (
                <Row className="mb-3">
                  <Col>
                    <Accordion className="mb-4">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>View Data Payload</Accordion.Header>
                        <Accordion.Body style={{ backgroundColor: '#212529' }}>
                          <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#f8f9fa' }}>
                            <code>{JSON.stringify(optimizedData || userData, null, 2)}</code>
                          </pre>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </Col>
                </Row>
              )}

              {/* Row 4: AI Analysis Request - Full Row */}
              <Row>
                <Col>
                  <AnalysisInterface
                    analysisPrompt={analysisPrompt}
                    setAnalysisPrompt={setAnalysisPrompt}
                    analysisType={analysisType}
                    setAnalysisType={setAnalysisType}
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    disabled={!userData}
                  />
                </Col>
              </Row>

               {/* Analysis Results */}
               {analysisResults && (
                <Row className="mt-4">
                    <Col>
                        <AnalysisResults analysisResults={analysisResults} />
                    </Col>
                </Row>
              )}
            </Tab.Pane>

            <Tab.Pane eventKey="history">
              <AnalysisHistory userId={userInfo?._id} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </>
  );
};

export default AiAnalysisScreen;
