import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Nav, Tab, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { 
  useGetUserDataForAnalysisQuery, 
  useAnalyzeUserDataMutation,
  useGetAllUsersQuery 
} from '../slices/aiAnalysisApiSlice';
import { 
  FaBrain, 
  FaLightbulb,
  FaHistory,
  FaPlus,
  FaUser,
  FaSearch
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

const AdminAiAnalysisScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  // Redirect if not admin
  useEffect(() => {
    if (!userInfo?.isAdmin) {
      window.location.href = '/';
    }
  }, [userInfo]);
  
  // State for tabs
  const [activeTab, setActiveTab] = useState('new-analysis');
  
  // State for user selection
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
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

  // RTK Query hooks
  const {
    data: allUsers,
    isLoading: isLoadingUsers,
    error: usersError
  } = useGetAllUsersQuery();

  const {
    data: userData,
    isLoading: isLoadingData,
    error: dataError,
    refetch: refetchUserData
  } = useGetUserDataForAnalysisQuery(
    {
      dataTypes: selectedDataTypes.join(','),
      dateRange: JSON.stringify(dateRange),
      userId: selectedUserId
    },
    { 
      skip: !selectedUserId,
      refetchOnMountOrArgChange: true
    }
  );

  const [analyzeUserData, { isLoading: isAnalysisLoading }] = useAnalyzeUserDataMutation();

  // Filter users based on search term
  const filteredUsers = allUsers?.users?.filter(user => 
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  ) || [];

  // Get selected user object
  const selectedUser = filteredUsers.find(user => user._id === selectedUserId);

  // Handlers
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    setAnalysisResults(null);
    setActiveTab('new-analysis');
  };

  const handleDataTypeChange = (dataTypes) => {
    setSelectedDataTypes(dataTypes);
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handlePromptChange = (prompt) => {
    setAnalysisPrompt(prompt);
  };

  const handleAnalysisTypeChange = (type) => {
    setAnalysisType(type);
  };

  const runAnalysis = async () => {
    if (!userData || !analysisPrompt || !selectedUserId) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeUserData({
        userData,
        prompt: analysisPrompt || undefined,
        analysisType,
        dataTypes: selectedDataTypes.join(','),
        userId: selectedUserId
      }).unwrap();

      setAnalysisResults(result);
      setActiveTab('results');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Redirect if not admin
  if (!userInfo?.isAdmin) {
    return null;
  }

  return (
    <>
      <Meta title="Admin AI Analysis - Pro-G Fitness" />
      
      {/* Custom Styles for Dark AMOLED Mode */}
      <style>{`
        .admin-ai-container {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          min-height: 100vh;
          color: #ffffff;
        }
        
        .admin-header-card {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border: none;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        }
        
        .user-selection-card {
          background: rgba(15, 15, 15, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .user-selection-card .card-header {
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        
        .data-overview-card {
          background: rgba(15, 15, 15, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .data-overview-card .card-header {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        
        .user-search-input {
          background: rgba(30, 30, 30, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transition: all 0.3s ease;
        }
        
        .user-search-input:focus {
          background: rgba(40, 40, 40, 0.9);
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
          color: #ffffff;
        }
        
        .user-search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .user-list-container {
          background: rgba(20, 20, 20, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-height: 280px;
          overflow-y: auto;
        }
        
        .user-list-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .user-list-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .user-list-container::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.6);
          border-radius: 3px;
        }
        
        .user-list-container::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
        
        .user-selection-item {
          background: rgba(30, 30, 30, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          cursor: pointer;
          margin: 2px;
          border-radius: 8px;
        }
        
        .user-selection-item:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
        }
        
        .user-selection-item.selected {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
          transform: translateX(4px);
        }
        
        .admin-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #000000;
          font-weight: 600;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 12px;
        }
        
        .nav-pills-dark .nav-link {
          background: rgba(30, 30, 30, 0.8);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-right: 8px;
          transition: all 0.3s ease;
        }
        
        .nav-pills-dark .nav-link:hover {
          background: rgba(59, 130, 246, 0.2);
          color: #ffffff;
          border-color: #3b82f6;
        }
        
        .nav-pills-dark .nav-link.active {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }
        
        .analysis-tab-content {
          background: rgba(15, 15, 15, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          padding: 2rem;
        }
        
        .welcome-section {
          background: rgba(20, 20, 20, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .selected-user-alert {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          border-radius: 8px;
        }
        
        .form-label-dark {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .loading-spinner {
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .admin-ai-container {
            padding: 0.5rem;
          }
          
          .user-list-container {
            max-height: 200px;
          }
          
          .analysis-tab-content {
            padding: 1rem;
          }
        }
        
        @media (max-width: 576px) {
          .admin-header-card .card-header {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
          
          .user-selection-item {
            padding: 1rem !important;
          }
        }
      `}</style>

      <div className="admin-ai-container">
        <Container fluid className="p-3">
          {/* Header Section */}
          <Row className="mb-4">
            <Col>
              <Card className="admin-header-card">
                <Card.Header className="border-0 p-4">
                  <Row className="align-items-center">
                    <Col>
                      <div className="d-flex align-items-center">
                        <div className="me-3 p-3 rounded-circle" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                          <FaBrain size={24} />
                        </div>
                        <div>
                          <h3 className="mb-0 fw-bold">Admin AI Analysis</h3>
                          <p className="mb-0 opacity-75">Advanced AI-powered fitness data analysis for all users</p>
                        </div>
                      </div>
                    </Col>
                    <Col xs="auto">
                      <div className="text-end">
                        <div className="badge bg-light text-dark px-3 py-2 rounded-pill">
                          <FaUser className="me-1" />
                          Admin Access
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Header>
              </Card>
            </Col>
          </Row>

          {/* Main Content */}
          <Row className="g-4">
            {/* User Selection Panel */}
            <Col xl={4} lg={5}>
              <Card className="user-selection-card h-100">
                <Card.Header className="d-flex align-items-center p-3">
                  <FaUser className="me-2" size={18} />
                  <h5 className="mb-0 fw-semibold">User Selection</h5>
                </Card.Header>
                <Card.Body className="p-3">
                  {/* Search Input */}
                  <div className="mb-3">
                    <label className="form-label-dark">Search Users</label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="user-search-input pe-5"
                      />
                      <FaSearch 
                        className="position-absolute top-50 end-0 translate-middle-y me-3" 
                        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      />
                    </div>
                  </div>

                  {/* User Count */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label-dark mb-0">Available Users</label>
                    <span className="badge bg-primary px-3 py-1 rounded-pill">
                      {filteredUsers.length} users
                    </span>
                  </div>

                  {/* User List */}
                  <div className="user-list-container rounded-3">
                    {isLoadingUsers ? (
                      <div className="p-4 text-center">
                        <div className="loading-spinner mx-auto mb-2"></div>
                        <small className="text-muted">Loading users...</small>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center">
                        <FaUser size={32} className="mb-2 opacity-50" />
                        <div className="text-muted">
                          {userSearchTerm ? 'No users match your search' : 'No users found'}
                        </div>
                        {userSearchTerm && (
                          <small className="text-muted">Try adjusting your search term</small>
                        )}
                      </div>
                    ) : (
                      filteredUsers.map(user => (
                        <div
                          key={user._id}
                          className={`user-selection-item p-3 ${selectedUserId === user._id ? 'selected' : ''}`}
                          onClick={() => handleUserSelect(user._id)}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="fw-semibold mb-1">{user.name}</div>
                              <small className={selectedUserId === user._id ? 'text-light' : 'text-muted'}>
                                {user.email}
                              </small>
                              {user.isAdmin && (
                                <div className="mt-2">
                                  <span className="admin-badge">ADMIN</span>
                                </div>
                              )}
                            </div>
                            {selectedUserId === user._id && (
                              <div className="ms-2">
                                <div className="rounded-circle bg-light p-1" style={{ width: '24px', height: '24px' }}>
                                  <i className="fas fa-check text-primary" style={{ fontSize: '12px' }}></i>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Selected User Info */}
                  {selectedUser && (
                    <div className="selected-user-alert p-3 mt-3">
                      <div className="d-flex align-items-center">
                        <FaUser className="me-2" />
                        <div>
                          <div className="fw-semibold">Selected User</div>
                          <div>{selectedUser.name} ({selectedUser.email})</div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Data Overview & Analysis Panel */}
            <Col xl={8} lg={7}>
              {selectedUserId ? (
                <>
                  {/* Data Overview */}
                  <Card className="data-overview-card mb-4">
                    <Card.Header className="d-flex align-items-center p-3">
                      <FaSearch className="me-2" size={18} />
                      <h5 className="mb-0 fw-semibold">Data Overview - {selectedUser?.name}</h5>
                    </Card.Header>
                    <Card.Body className="p-3">
                      <DataStatus 
                        userData={userData}
                        isLoading={isLoadingData}
                        error={dataError}
                        selectedUser={selectedUser}
                      />
                    </Card.Body>
                  </Card>

                  {/* Analysis Interface */}
                  <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav variant="pills" className="nav-pills-dark mb-4">
                      <Nav.Item>
                        <Nav.Link eventKey="new-analysis" className="d-flex align-items-center">
                          <FaPlus className="me-2" />
                          New Analysis
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="results" className="d-flex align-items-center">
                          <FaLightbulb className="me-2" />
                          Results
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="history" className="d-flex align-items-center">
                          <FaHistory className="me-2" />
                          History
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>

                    <div className="analysis-tab-content">
                      <Tab.Content>
                        <Tab.Pane eventKey="new-analysis">
                          <Row className="g-4">
                            <Col lg={4}>
                              <DataSelector
                                selectedDataTypes={selectedDataTypes}
                                onChange={handleDataTypeChange}
                                userData={userData}
                                isLoading={isLoadingData}
                              />
                            </Col>
                            <Col lg={4}>
                              <DateRangeSelector
                                dateRange={dateRange}
                                onChange={handleDateRangeChange}
                              />
                            </Col>
                            <Col lg={4}>
                              <AnalysisInterface
                                analysisPrompt={analysisPrompt}
                                setAnalysisPrompt={setAnalysisPrompt}
                                analysisType={analysisType}
                                setAnalysisType={setAnalysisType}
                                onAnalyze={runAnalysis}
                                isAnalyzing={isAnalyzing || isAnalysisLoading}
                                disabled={!userData || selectedDataTypes.length === 0}
                                selectedUser={selectedUser}
                              />
                            </Col>
                          </Row>
                        </Tab.Pane>

                        <Tab.Pane eventKey="results">
                          {analysisResults ? (
                            <AnalysisResults 
                              analysisResults={analysisResults} 
                              selectedUser={selectedUser}
                            />
                          ) : (
                            <div className="text-center py-5">
                              <div className="mb-4">
                                <FaLightbulb size={64} className="text-muted opacity-50" />
                              </div>
                              <h4 className="text-muted mb-3">No Analysis Results Yet</h4>
                              <p className="text-muted mb-4">
                                Generate an analysis from the "New Analysis" tab to view results here.
                              </p>
                              <Button 
                                variant="outline-primary"
                                onClick={() => setActiveTab('new-analysis')}
                                className="px-4"
                              >
                                <FaPlus className="me-2" />
                                Create New Analysis
                              </Button>
                            </div>
                          )}
                        </Tab.Pane>

                        <Tab.Pane eventKey="history">
                          <AnalysisHistory 
                            userId={selectedUserId} 
                            selectedUser={selectedUser} 
                          />
                        </Tab.Pane>
                      </Tab.Content>
                    </div>
                  </Tab.Container>
                </>
              ) : (
                /* Welcome Message */
                <Card className="welcome-section text-center">
                  <Card.Body className="p-5">
                    <div className="mb-4">
                      <div className="d-inline-flex p-4 rounded-circle mb-3" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' }}>
                        <FaBrain size={48} className="text-white" />
                      </div>
                    </div>
                    <h3 className="mb-3 fw-bold">Welcome to Admin AI Analysis</h3>
                    <p className="text-muted mb-4 fs-5">
                      Select a user from the panel on the left to begin analyzing their fitness data with advanced AI insights.
                    </p>
                    <div className="row text-start mt-5">
                      <div className="col-md-4 mb-3">
                        <div className="d-flex align-items-start">
                          <FaUser className="me-3 mt-1 text-primary" />
                          <div>
                            <h6 className="fw-semibold mb-1">User Selection</h6>
                            <small className="text-muted">Search and select any user</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="d-flex align-items-start">
                          <FaBrain className="me-3 mt-1 text-primary" />
                          <div>
                            <h6 className="fw-semibold mb-1">AI Analysis</h6>
                            <small className="text-muted">Generate personalized insights</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="d-flex align-items-start">
                          <FaHistory className="me-3 mt-1 text-primary" />
                          <div>
                            <h6 className="fw-semibold mb-1">History</h6>
                            <small className="text-muted">View past analyses</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AdminAiAnalysisScreen;
