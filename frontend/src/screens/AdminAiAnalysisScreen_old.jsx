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
    refetch: refetchData
  } = useGetUserDataForAnalysisQuery(
    { 
      userId: selectedUserId,
      dataTypes: selectedDataTypes,
      dateRange
    },
    { skip: !selectedUserId }
  );

  const [analyzeUserData, { isLoading: isAnalysisLoading }] = useAnalyzeUserDataMutation();

  // Filter users based on search term
  const usersArray = allUsers?.users || [];
  const filteredUsers = usersArray.filter(user => 
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const selectedUser = usersArray.find(user => user._id === selectedUserId);

  const handleDataTypeChange = (types) => {
    setSelectedDataTypes(types);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    setAnalysisResults(null); // Clear previous results when switching users
  };

  const runAnalysis = async () => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = await analyzeUserData({
        userId: selectedUserId,
        dataTypes: selectedDataTypes,
        dateRange,
        prompt: analysisPrompt || undefined,
        analysisType
      }).unwrap();
      
      setAnalysisResults(result);
      setActiveTab('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePromptChange = (prompt) => {
    setAnalysisPrompt(prompt);
  };

  const handleAnalysisTypeChange = (type) => {
    setAnalysisType(type);
  };

  if (!userInfo?.isAdmin) {
    return null;
  }

  return (
    <>
      <Meta title="Admin AI Analysis - Pro-G Fitness" />
      <Container fluid className="mt-3">
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <FaBrain className="me-2" size={24} />
                  <h4 className="mb-0">Admin AI Analysis</h4>
                </div>
                <small>Analyze user data with AI insights</small>
              </Card.Header>

              <Card.Body>
                {/* User Selection Section */}
                <Row className="mb-4">
                  <Col lg={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <FaUser className="me-2" />
                        Select User
                      </Card.Header>
                      <Card.Body>
                        <Form.Group className="mb-3">
                          <Form.Label>Search Users</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type="text"
                              placeholder="Search by name or email..."
                              value={userSearchTerm}
                              onChange={(e) => setUserSearchTerm(e.target.value)}
                            />
                            <FaSearch 
                              className="position-absolute top-50 end-0 translate-middle-y me-3" 
                              style={{ color: '#6c757d' }}
                            />
                          </div>
                        </Form.Group>

                        <Form.Group>
                          <Form.Label>Users ({filteredUsers.length})</Form.Label>
                          <div 
                            style={{ 
                              maxHeight: '220px', 
                              overflowY: 'auto', 
                              border: '1px solid #dee2e6', 
                              borderRadius: '0.375rem',
                              backgroundColor: '#fafafa'
                            }}
                            className="user-list-container"
                          >
                            {isLoadingUsers ? (
                              <div className="p-4 text-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                Loading users...
                              </div>
                            ) : filteredUsers.length === 0 ? (
                              <div className="p-4 text-center text-muted">
                                <FaUser size={32} className="mb-2 opacity-50" />
                                <div>No users found</div>
                                {userSearchTerm && (
                                  <small>Try adjusting your search term</small>
                                )}
                              </div>
                            ) : (
                              filteredUsers.map(user => (
                                <div
                                  key={user._id}
                                  className={`p-3 border-bottom user-selection-item ${selectedUserId === user._id ? 'bg-primary text-white shadow-sm' : ''}`}
                                  style={{ 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    borderRadius: selectedUserId === user._id ? '0.25rem' : '0'
                                  }}
                                  onClick={() => handleUserSelect(user._id)}
                                  onMouseEnter={(e) => {
                                    if (selectedUserId !== user._id) {
                                      e.target.style.backgroundColor = '#e9ecef';
                                      e.target.style.transform = 'translateX(2px)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedUserId !== user._id) {
                                      e.target.style.backgroundColor = 'transparent';
                                      e.target.style.transform = 'translateX(0)';
                                    }
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <div className="fw-bold mb-1">{user.name}</div>
                                      <small className={selectedUserId === user._id ? 'text-light' : 'text-muted'}>
                                        {user.email}
                                      </small>
                                      {user.isAdmin && (
                                        <div className="mt-1">
                                          <span className={`badge ${selectedUserId === user._id ? 'bg-light text-primary' : 'bg-warning text-dark'} small`}>
                                            Admin
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {selectedUserId === user._id && (
                                      <div className="text-white">
                                        <i className="fas fa-check-circle"></i>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </Form.Group>

                        {selectedUser && (
                          <Alert variant="info" className="mt-3 mb-0">
                            <FaUser className="me-2" />
                            Selected: <strong>{selectedUser.name}</strong> ({selectedUser.email})
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <FaSearch className="me-2" />
                        Data Overview
                      </Card.Header>
                      <Card.Body>
                        {selectedUserId ? (
                          <DataStatus 
                            userData={userData}
                            isLoading={isLoadingData}
                            error={dataError}
                            selectedUser={selectedUser}
                          />
                        ) : (
                          <div className="text-center text-muted py-4">
                            <FaUser size={48} className="mb-3 opacity-50" />
                            <p>Please select a user to view their data overview</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Analysis Interface - Only show if user is selected */}
                {selectedUserId && (
                  <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav variant="pills" className="mb-3">
                      <Nav.Item>
                        <Nav.Link eventKey="new-analysis">
                          <FaPlus className="me-1" />
                          New Analysis
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="results">
                          <FaLightbulb className="me-1" />
                          Results
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="history">
                          <FaHistory className="me-1" />
                          History
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>

                    <Tab.Content>
                      <Tab.Pane eventKey="new-analysis">
                        <Row>
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
                              prompt={analysisPrompt}
                              analysisType={analysisType}
                              onPromptChange={handlePromptChange}
                              onAnalysisTypeChange={handleAnalysisTypeChange}
                              onRunAnalysis={runAnalysis}
                              isLoading={isAnalyzing || isAnalysisLoading}
                              canAnalyze={!!userData && selectedDataTypes.length > 0}
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
                            <FaLightbulb size={48} className="text-muted mb-3" />
                            <h5 className="text-muted">No Analysis Results</h5>
                            <p className="text-muted">
                              Run an analysis from the "New Analysis" tab to see results here.
                            </p>
                          </div>
                        )}
                      </Tab.Pane>

                      <Tab.Pane eventKey="history">
                        <AnalysisHistory userId={selectedUserId} selectedUser={selectedUser} />
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                )}

                {/* Message when no user selected */}
                {!selectedUserId && (
                  <div className="text-center py-5">
                    <FaBrain size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">Welcome to Admin AI Analysis</h5>
                    <p className="text-muted">
                      Select a user from the list above to begin analyzing their fitness data with AI insights.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminAiAnalysisScreen;
