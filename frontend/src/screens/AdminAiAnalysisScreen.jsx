import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Nav, Tab, Alert, Accordion, Tooltip, OverlayTrigger, ButtonGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { 
  useGetUserDataForAnalysisQuery, 
  useAnalyzeUserDataMutation,
  useGetAllUsersQuery 
} from '../slices/aiAnalysisApiSlice';
import { optimizeDataForSmallAI } from '../utils/dataOptimization';
import { 
  FaBrain, 
  FaLightbulb,
  FaHistory,
  FaPlus,
  FaUser,
  FaSearch,
  FaDumbbell,
  FaUtensils,
  FaBed,
  FaWeight,
  FaClipboardCheck,
  FaCheckCircle
} from 'react-icons/fa';
import { format, subDays } from 'date-fns';
import {
  DataSelector,
  DateRangeSelector,
  AnalysisInterface,
  AnalysisResults,
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
  
  // Performance optimization constants
  const SEARCH_MIN_LENGTH = 1;
  const MAX_SEARCH_RESULTS = 20;
  
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
      dateRange: dateRange, // Don't stringify here - let the API slice handle it
      userId: selectedUserId
    },
    { 
      skip: !selectedUserId,
      refetchOnMountOrArgChange: true
    }
  );

  const [analyzeUserData, { isLoading: isAnalysisLoading }] = useAnalyzeUserDataMutation();

  // Filter users based on search term with performance optimization
  const filteredUsers = useMemo(() => {
    const users = allUsers?.users || [];
    
    // Only show users when searching (no default display for performance)
    if (!userSearchTerm || userSearchTerm.length < SEARCH_MIN_LENGTH) {
      return [];
    }
    
    // Filter based on search term and limit results
    const searchLower = userSearchTerm.toLowerCase();
    const matchedUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
    
    // Limit results for performance
    return matchedUsers.slice(0, MAX_SEARCH_RESULTS);
  }, [allUsers?.users, userSearchTerm]);

  // Get selected user object from all users (not just filtered)
  const selectedUser = allUsers?.users?.find(user => user._id === selectedUserId);

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
    // Clear previous analysis results when date range changes
    setAnalysisResults(null);
  };

  // Effect to refetch data when date range changes
  useEffect(() => {
    if (selectedUserId && refetchUserData) {
      refetchUserData();
    }
  }, [dateRange, selectedUserId, refetchUserData]);

  const handlePromptChange = (prompt) => {
    setAnalysisPrompt(prompt);
  };

  const handleAnalysisTypeChange = (type) => {
    setAnalysisType(type);
  };

  const runAnalysis = async () => {
    if (!userData || !analysisPrompt || !selectedUserId) return;

    // Ensure we have the latest data for the selected date range
    const currentUserData = await refetchUserData();
    const dataToAnalyze = currentUserData.data || userData;

    setIsAnalyzing(true);
    try {
      const result = await analyzeUserData({
        userData: dataToAnalyze,
        prompt: analysisPrompt || undefined,
        analysisType,
        dataTypes: selectedDataTypes.join(','),
        dateRange: JSON.stringify(dateRange), // Include date range in analysis
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
        
        .admin-badge-wrapper {
          flex-shrink: 0;
        }
        
        /* Enhanced Header Responsive Design - More Compact */
        @media (max-width: 1200px) {
          .ai-title-enhanced {
            font-size: 1.625rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 992px) {
          .ai-header-enhanced {
            margin-bottom: 1rem;
          }
          
          .ai-header-content {
            padding: 1rem;
            gap: 1rem;
          }
          
          .ai-title-enhanced {
            font-size: 1.5rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.85rem;
          }
          
          .ai-icon-wrapper {
            width: 48px;
            height: 48px;
            padding: 0.75rem;
            border-radius: 12px;
          }
        }
        
        @media (max-width: 768px) {
          .ai-header-enhanced {
            border-radius: 12px;
            margin-bottom: 0.75rem;
          }
          
          .ai-header-content {
            padding: 0.75rem;
            gap: 0.75rem;
          }
          
          .ai-title-enhanced {
            font-size: 1.375rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.8rem;
            line-height: 1.3;
          }
          
          .ai-icon-wrapper {
            width: 44px;
            height: 44px;
            padding: 0.65rem;
            border-radius: 11px;
          }
          
          .admin-badge-wrapper {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
          }
        }
        
        @media (max-width: 576px) {
          .ai-header-enhanced {
            border-radius: 10px;
            margin-bottom: 0.5rem;
          }
          
          .ai-header-content {
            padding: 0.625rem;
            gap: 0.625rem;
            flex-direction: row;
            text-align: left;
            position: relative;
          }
          
          .ai-title-enhanced {
            font-size: 1.25rem;
            margin-bottom: 0.125rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.75rem;
            line-height: 1.2;
          }
          
          .ai-icon-wrapper {
            width: 36px;
            height: 36px;
            padding: 0.5rem;
            border-radius: 9px;
            flex-shrink: 0;
          }
          
          .admin-badge-wrapper {
            position: absolute;
            top: 0.625rem;
            right: 0.625rem;
          }
          
          .admin-badge-wrapper .badge {
            font-size: 0.6rem;
            padding: 0.15rem 0.4rem;
          }
        }
        
        @media (max-width: 480px) {
          .ai-header-enhanced {
            margin-bottom: 0.375rem;
          }
          
          .ai-header-content {
            padding: 0.5rem;
            gap: 0.5rem;
          }
          
          .ai-title-enhanced {
            font-size: 1.125rem;
            margin-bottom: 0.1rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.7rem;
            line-height: 1.2;
          }
          
          .ai-icon-wrapper {
            width: 32px;
            height: 32px;
            padding: 0.4rem;
            border-radius: 8px;
          }
          
          .admin-badge-wrapper {
            top: 0.5rem;
            right: 0.5rem;
          }
          
          .admin-badge-wrapper .badge {
            font-size: 0.55rem;
            padding: 0.1rem 0.3rem;
          }
        }
        
        @media (max-width: 360px) {
          .ai-header-enhanced {
            margin-bottom: 0.25rem;
          }
          
          .ai-header-content {
            padding: 0.4rem;
            gap: 0.4rem;
          }
          
          .ai-title-enhanced {
            font-size: 1rem;
            margin-bottom: 0.05rem;
          }
          
          .ai-subtitle-enhanced {
            font-size: 0.65rem;
            line-height: 1.1;
          }
          
          .ai-icon-wrapper {
            width: 28px;
            height: 28px;
            padding: 0.35rem;
            border-radius: 7px;
          }
          
          .admin-badge-wrapper {
            top: 0.4rem;
            right: 0.4rem;
          }
          
          .admin-badge-wrapper .badge {
            font-size: 0.5rem;
            padding: 0.05rem 0.25rem;
          }
        }
        
        
        .user-selection-enhanced {
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border-radius: 16px;
        }
        
        .user-header-enhanced {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-bottom: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 16px 16px 0 0;
          padding: 1rem;
        }
        
        .icon-wrapper-enhanced {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .user-search-enhanced {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-radius: 12px;
          padding: 0.75rem 3rem 0.75rem 1rem;
          font-size: 1rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .user-search-enhanced:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
          color: #ffffff;
        }
        
        .user-search-enhanced::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .search-info-enhanced {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          white-space: nowrap;
          backdrop-filter: blur(10px);
        }
        
        .total-users-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          backdrop-filter: blur(10px);
        }
        
        .user-body-enhanced {
          background: transparent;
          padding: 1rem;
        }
        
        .search-instructions-enhanced {
          background: rgba(30, 30, 30, 0.5);
          border-radius: 12px;
          padding: 1.25rem;
          text-align: center;
        }
        
        .search-icon-large {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        }
        
        .stats-row {
          display: flex;
          justify-content: center;
          gap: 2rem;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #3b82f6;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 0.25rem;
        }
        
        .loading-state-enhanced {
          text-align: center;
          padding: 3rem 1rem;
        }
        
        .loading-spinner-enhanced {
          border: 4px solid rgba(59, 130, 246, 0.3);
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        .no-results-enhanced {
          background: rgba(30, 30, 30, 0.5);
          border-radius: 12px;
          padding: 2rem;
        }
        
        .user-results-enhanced {
          
        }
        
        .results-header {
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .user-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
          padding: 1rem 0;
        }
        
        .user-grid-enhanced::-webkit-scrollbar {
          width: 6px;
        }
        
        .user-grid-enhanced::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .user-grid-enhanced::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        
        .user-card-enhanced {
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(40, 40, 40, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.875rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          backdrop-filter: blur(10px);
        }
        
        .user-card-enhanced:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%);
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
        }
        
        .user-card-enhanced.selected {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          border-color: #60a5fa;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }
        
        .user-avatar-enhanced {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }
        
        .user-card-enhanced.selected .user-avatar-enhanced {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .user-info-enhanced {
          flex-grow: 1;
          min-width: 0;
        }
        
        .user-name-enhanced {
          font-weight: 600;
          font-size: 1rem;
          color: #ffffff;
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-email-enhanced {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-card-enhanced.selected .user-email-enhanced {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .admin-badge-enhanced {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #000000;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          display: inline-block;
        }
        
        .selected-indicator-enhanced {
          color: #10b981;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .search-limit-notice {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          padding: 0.75rem;
          margin-top: 1rem;
          text-align: center;
        }
        
        /* User Selection Responsive Design */
        @media (max-width: 992px) {
          .user-header-enhanced {
            padding: 0.875rem;
          }
          
          .user-body-enhanced {
            padding: 0.875rem;
          }
          
          .search-instructions-enhanced {
            padding: 1rem;
          }
          
          .search-icon-large {
            width: 50px;
            height: 50px;
          }
        }
        
        @media (max-width: 768px) {
          .user-selection-enhanced {
            margin-bottom: 0.75rem;
          }
          
          .user-header-enhanced {
            padding: 0.75rem;
          }
          
          .user-body-enhanced {
            padding: 0.75rem;
          }
          
          .search-instructions-enhanced {
            padding: 0.875rem;
          }
          
          .search-icon-large {
            width: 44px;
            height: 44px;
          }
          
          .user-search-enhanced {
            padding: 0.625rem 2.5rem 0.625rem 0.875rem;
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 576px) {
          .user-selection-enhanced {
            margin-bottom: 0.5rem;
          }
          
          .user-header-enhanced {
            padding: 0.625rem;
          }
          
          .user-body-enhanced {
            padding: 0.625rem;
          }
          
          .search-instructions-enhanced {
            padding: 0.75rem;
          }
          
          .search-icon-large {
            width: 40px;
            height: 40px;
          }
          
          .user-search-enhanced {
            padding: 0.5rem 2rem 0.5rem 0.75rem;
            font-size: 0.85rem;
          }
          
          .search-info-enhanced {
            padding: 0.375rem 0.5rem;
            font-size: 0.75rem;
          }
          
          .total-users-badge {
            padding: 0.375rem 0.5rem;
            font-size: 0.75rem;
          }
          
          .user-header-enhanced h4 {
            font-size: 1.1rem;
          }
          
          .user-header-enhanced small {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .user-card-enhanced {
            padding: 0.5rem;
            gap: 0.4rem;
          }
          
          .user-avatar-enhanced {
            width: 28px;
            height: 28px;
            font-size: 11px;
          }
          
          .user-name-enhanced {
            font-size: 0.8rem;
          }
          
          .user-email-enhanced {
            font-size: 0.7rem;
          }
          
          .admin-badge-enhanced {
            font-size: 0.6rem;
            padding: 0.15rem 0.3rem;
          }
        }
        
        @media (max-width: 360px) {
          .user-card-enhanced {
            padding: 0.4rem;
            gap: 0.35rem;
          }
          
          .user-avatar-enhanced {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }
          
          .user-name-enhanced {
            font-size: 0.75rem;
          }
          
          .user-email-enhanced {
            font-size: 0.65rem;
          }
          
          .admin-badge-enhanced {
            font-size: 0.55rem;
            padding: 0.1rem 0.25rem;
          }
        }
        
        /* Data Summary Alert Responsive Styles */
        .alert.mb-3 {
          padding: 0.875rem;
        }
        
        .alert .small {
          font-size: 0.875rem;
          line-height: 1.3;
        }
        
        @media (max-width: 768px) {
          .alert.mb-3 {
            padding: 0.75rem;
            margin-bottom: 0.75rem !important;
          }
          
          .alert .small {
            font-size: 0.8rem;
            line-height: 1.25;
          }
          
          .alert strong {
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 576px) {
          .alert.mb-3 {
            padding: 0.625rem;
            margin-bottom: 0.5rem !important;
          }
          
          .alert .small {
            font-size: 0.75rem;
            line-height: 1.2;
            margin-top: 0 !important;
            margin-bottom: 0.375rem !important;
          }
          
          .alert strong {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          .alert.mb-3 {
            padding: 0.5rem;
            margin-bottom: 0.375rem !important;
          }
          
          .alert .small {
            font-size: 0.7rem;
            line-height: 1.15;
            margin-bottom: 0.25rem !important;
          }
          
          .alert strong {
            font-size: 0.8rem;
          }
          
          /* Make data summary more concise on very small screens */
          .data-summary-compact {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
        
        @media (max-width: 360px) {
          .alert.mb-3 {
            padding: 0.4rem;
            margin-bottom: 0.25rem !important;
          }
          
          .alert .small {
            font-size: 0.65rem;
            line-height: 1.1;
            margin-bottom: 0.2rem !important;
          }
          
          .alert strong {
            font-size: 0.75rem;
          }
          
          /* Stack the date and data summary on very small screens */
          .alert .small span {
            display: block;
            margin-bottom: 0.125rem;
          }
        }
        
        @media (max-width: 320px) {
          .admin-ai-container {
            padding: 0;
          }
          
          .user-selection-horizontal {
            margin-bottom: 0.125rem !important;
          }
          
          .user-selection-horizontal .card-header {
            padding: 0.15rem !important;
          }
          
          .user-selection-horizontal h5 {
            font-size: 0.6rem;
          }
          
          .user-search-horizontal {
            padding: 0.15rem 1rem 0.15rem 0.3rem;
            font-size: 0.6rem;
          }
          
          .search-info-badge {
            padding: 0.1rem 0.2rem;
            font-size: 0.55rem;
          }
          
          .user-grid-horizontal {
            max-height: 60px;
            padding: 0.15rem;
          }
          
          .user-card-horizontal {
            padding: 0.15rem 0.2rem;
          }
          
          .user-card-horizontal .fw-semibold {
            font-size: 0.65rem !important;
          }
          
          .user-card-enhanced {
            padding: 0.625rem;
            gap: 0.5rem;
          }
          
          .user-avatar-enhanced {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }
          
          .user-name-enhanced {
            font-size: 0.85rem;
          }
          
          .user-email-enhanced {
            font-size: 0.75rem;
          }
          
          .admin-badge-enhanced {
            font-size: 0.65rem;
            padding: 0.2rem 0.4rem;
          }
        }
      `}</style>

      <div className="admin-ai-container">
        <Container fluid className="p-lg-2 p-md-1 p-1">
          {/* Enhanced Header */}
          <Row className="mb-4">
            <Col>
              <Card className="ai-header-enhanced">
                <div className="ai-header-content">
                  <div className="ai-icon-wrapper">
                    <FaBrain size={28} color="#ffffff" />
                  </div>
                  
                  <div className="ai-text-content">
                    <h1 className="ai-title-enhanced">Admin AI Analysis</h1>
                    <p className="ai-subtitle-enhanced">
                      Advanced analytics and insights for user fitness data management
                    </p>
                  </div>
                  
                  <div className="admin-badge-wrapper ms-auto">
                    <div className="badge bg-light text-dark px-2 py-1 rounded-pill">
                      <FaUser className="me-1" size={10} />
                      Admin
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* User Selection Section - Enhanced & Compact */}
          <Row className="mb-3">
            <Col>
              <Card className="user-selection-enhanced">
                <Card.Header className="user-header-enhanced">
                  <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3">
                    <div className="d-flex align-items-center flex-shrink-0">
                      <div className="icon-wrapper-enhanced me-2 me-lg-3">
                        <FaSearch size={16} />
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-white">Search & Select User</h4>
                        <small className="text-light opacity-75 d-none d-sm-block">Find and select a user to analyze their fitness data</small>
                      </div>
                    </div>
                    
                    <div className="search-controls-enhanced flex-grow-1">
                      <div className="d-flex flex-column flex-sm-row align-items-stretch align-sm-center gap-2 gap-sm-3">
                        <div className="position-relative flex-grow-1">
                          <Form.Control
                            type="text"
                            placeholder="Start typing name or email..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="user-search-enhanced"
                          />
                          <FaSearch 
                            className="position-absolute top-50 end-0 translate-middle-y me-3" 
                            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                            size={14}
                          />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {userSearchTerm && (
                            <div className="search-info-enhanced">
                              <span className="fw-semibold">{filteredUsers.length}</span>
                              {filteredUsers.length === MAX_SEARCH_RESULTS && (
                                <span className="text-muted">+</span>
                              )}
                              <span className="text-muted ms-1">found</span>
                            </div>
                          )}
                          <div className="total-users-badge">
                            <small>Total: <span className="fw-bold">{allUsers?.users?.length || 0}</span></small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="user-body-enhanced">
                  {/* Search Instructions or User Results */}
                  {!userSearchTerm ? (
                    <div className="search-instructions-enhanced">
                      <div className="text-center py-2 py-sm-3">
                        <div className="search-icon-large mb-2 mb-sm-3">
                          <FaUser size={32} className="text-primary opacity-75" />
                        </div>
                        <h5 className="mb-1 mb-sm-2 fw-bold">Find Users to Analyze</h5>
                        <p className="text-muted mb-2 mb-sm-3 fs-6">
                          Start typing in the search box above to find users by name or email address.
                        </p>
                        <div className="row text-start mt-lg-4 mt-2">
                          <div className="col-md-4 mb-2">
                            <div className="d-flex align-items-start">
                              <FaUser className="me-2 mt-1 text-primary" />
                              <div>
                                <h6 className="fw-semibold mb-1">User Selection</h6>
                                <small className="text-muted">Search and select any user</small>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 mb-2">
                            <div className="d-flex align-items-start">
                              <FaBrain className="me-2 mt-1 text-primary" />
                              <div>
                                <h6 className="fw-semibold mb-1">AI Analysis</h6>
                                <small className="text-muted">Generate insights</small>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 mb-2">
                            <div className="d-flex align-items-start">
                              <FaHistory className="me-2 mt-1 text-primary" />
                              <div>
                                <h6 className="fw-semibold mb-1">History</h6>
                                <small className="text-muted">View past analyses</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : isLoadingUsers ? (
                    <div className="loading-state-enhanced">
                      <div className="text-center py-2 py-sm-3">
                        <div className="loading-spinner-enhanced mx-auto mb-2"></div>
                        <h6 className="text-center mb-0">Searching users...</h6>
                      </div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="no-results-enhanced">
                      <div className="text-center py-2 py-sm-3">
                        <FaSearch size={32} className="text-muted opacity-50 mb-2" />
                        <h6 className="mb-1">No users found</h6>
                        <p className="text-muted mb-0 small">
                          No users match "<span className="fw-semibold text-white">{userSearchTerm}</span>". Try a different search term.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="user-results-enhanced">
                      <div className="results-header mb-3">
                        <small className="text-muted">
                          Showing {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
                          {filteredUsers.length === MAX_SEARCH_RESULTS && ' (first 20)'}
                        </small>
                      </div>
                      <div className="user-grid-enhanced">
                        {filteredUsers.map(user => (
                          <div
                            key={user._id}
                            className={`user-card-enhanced ${selectedUserId === user._id ? 'selected' : ''}`}
                            onClick={() => handleUserSelect(user._id)}
                          >
                            <div className="user-avatar-enhanced">
                              <FaUser size={20} />
                            </div>
                            <div className="user-info-enhanced">
                              <div className="user-name-enhanced">{user.name}</div>
                              <div className="user-email-enhanced">{user.email}</div>
                              {user.isAdmin && (
                                <span className="admin-badge-enhanced">ADMIN</span>
                              )}
                            </div>
                            {selectedUserId === user._id && (
                              <div className="selected-indicator-enhanced">
                                <i className="fas fa-check-circle"></i>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {filteredUsers.length === MAX_SEARCH_RESULTS && (
                        <div className="search-limit-notice">
                          <small className="text-warning">
                            <i className="fas fa-info-circle me-1"></i>
                            Showing first {MAX_SEARCH_RESULTS} results. Try a more specific search for better results.
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {selectedUserId ? (
            <>
              {/* Analysis Interface */}
              <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Nav variant="pills" className="nav-pills-dark mb-lg-3 mb-2">
                  <Nav.Item>
                    <Nav.Link eventKey="new-analysis" className="d-flex align-items-center">
                      <FaPlus className="me-1" />
                      <span className="d-none d-sm-inline">New Analysis</span>
                      <span className="d-sm-none">New</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="results" className="d-flex align-items-center">
                      <FaLightbulb className="me-1" />
                      <span className="d-none d-sm-inline">Results</span>
                      <span className="d-sm-none">Results</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="history" className="d-flex align-items-center">
                      <FaHistory className="me-1" />
                      <span className="d-none d-sm-inline">History</span>
                      <span className="d-sm-none">History</span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <div className="analysis-tab-content">
                  <Tab.Content>
                    <Tab.Pane eventKey="new-analysis">
                      {/* Data Selection and Date Range - Side by Side */}
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
                            onChange={handleDateRangeChange}
                          />
                        </Col>
                      </Row>

                      {userData && !isLoadingData && (
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
                      )}

                      {/* Data Payload Viewer */}
                      {userData && !isLoadingData && (
                        <Row>
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
                      {/* Data Status Indicator */}
                      {selectedUserId && (
                        <Row>
                          <Col>
                            <Alert variant="success" className="mb-3 border-0" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                              <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                  <strong className="text-success">Data Filtered Successfully</strong>
                                  <div className="small text-muted mt-1 mb-2">
                                {isLoadingData ? (
                                  <span>
                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                    Loading data for {format(new Date(dateRange.startDate), 'MMM dd, yyyy')} - {format(new Date(dateRange.endDate), 'MMM dd, yyyy')}...
                                  </span>
                                ) : userData ? (
                                  <div>
                                    <span className="d-block d-sm-inline">
                                      Showing data from {format(new Date(dateRange.startDate), 'MMM dd, yyyy')} to {format(new Date(dateRange.endDate), 'MMM dd, yyyy')}
                                      {dateRange.preset && dateRange.preset !== 'custom' && (
                                        <span className="fw-semibold"> ({dateRange.preset})</span>
                                      )}
                                    </span>
                                    <span className="d-block d-sm-inline">
                                      <span className="d-none d-sm-inline"> • </span>
                                      {userData.workouts?.length || 0} workouts, {userData.diet?.length || 0} meals, {userData.sleep?.length || 0} sleep records
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-warning">No data available for the selected date range</span>
                                )}
                                  </div>
                                </div>
                              </div>
                            </Alert>
                          </Col>
                        </Row>
                      )}
                      
                      {/* AI Analysis Request - Full Width */}
                      {/* Analysis Interface */}
                      <Row>
                        <Col>
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
            <Row>
              <Col>
                {/* Welcome Message */}
                <Card className="welcome-section text-center">
                  <Card.Body className="p-lg-4 p-md-3 p-2">
                    <div className="mb-lg-3 mb-2">
                      <div className="d-inline-flex p-lg-3 p-2 rounded-circle mb-lg-2 mb-1" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' }}>
                        <FaBrain size={32} className="text-white d-none d-md-block" />
                        <FaBrain size={24} className="text-white d-md-none" />
                      </div>
                    </div>
                    <h3 className="mb-lg-2 mb-1 fw-bold">Welcome to Admin AI Analysis</h3>
                    <p className="text-muted mb-lg-3 mb-2 fs-6">
                      Select a user from above to begin AI analysis.
                    </p>
                    <div className="row text-start mt-lg-4 mt-2">
                      <div className="col-md-4 mb-2">
                        <div className="d-flex align-items-start">
                          <FaUser className="me-2 mt-1 text-primary" />
                          <div>
                            <h6 className="fw-semibold mb-1">User Selection</h6>
                            <small className="text-muted">Search and select any user</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-2">
                        <div className="d-flex align-items-start">
                          <FaBrain className="me-2 mt-1 text-primary" />
                          <div>
                            <h6 className="fw-semibold mb-1">AI Analysis</h6>
                            <small className="text-muted">Generate insights</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-2">
                        <div className="d-flex align-items-start">
                          <FaHistory className="me-2 mt-1 text-primary" />
                          <div>
                            <h6 className="fw-semibold mb-1">History</h6>
                            <small className="text-muted">View past analyses</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </>
  );
};

export default AdminAiAnalysisScreen;
