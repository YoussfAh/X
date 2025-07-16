# Multi-API Key System Comprehensive Guide - Part 3: Frontend Integration & UI Components

## Table of Contents
- [RTK Query API Integration](#rtk-query-api-integration)
- [Service Status Component](#service-status-component)
- [Analytics Screen Integration](#analytics-screen-integration)
- [Error Handling & User Experience](#error-handling--user-experience)
- [Real-time Updates & WebSocket Integration](#real-time-updates--websocket-integration)
- [Mobile Responsiveness & PWA Considerations](#mobile-responsiveness--pwa-considerations)

---

## 🔌 RTK Query API Integration

### aiAnalysisApiSlice.js - Complete Implementation

The Redux Toolkit Query slice provides type-safe API calls and automatic caching for all AI analysis endpoints.

```javascript
// frontend/src/slices/aiAnalysisApiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/ai-analysis',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Enhanced base query with retry logic and error handling
const baseQueryWithRetry = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Retry logic for specific errors
  if (result.error && result.error.status === 503) {
    // Service unavailable - retry after delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    result = await baseQuery(args, api, extraOptions);
  }
  
  return result;
};

export const aiAnalysisApiSlice = createApi({
  reducerPath: 'aiAnalysisApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['AIAnalysis', 'ServiceStatus', 'KeyStatus'],
  
  endpoints: (builder) => ({
    
    // Main AI analysis endpoint
    analyzeData: builder.mutation({
      query: (data) => ({
        url: '/analyze',
        method: 'POST',
        body: { data },
      }),
      invalidatesTags: ['AIAnalysis', 'ServiceStatus'],
      
      // Transform response to include additional metadata
      transformResponse: (response) => ({
        ...response,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }),
      
      // Error transformation for user-friendly messages
      transformErrorResponse: (response) => {
        const { data } = response;
        return {
          status: response.status,
          message: data?.message || 'Analysis failed. Please try again.',
          errorType: data?.errorType || 'UNKNOWN_ERROR',
          timestamp: data?.timestamp || new Date().toISOString(),
        };
      },
    }),

    // Service status monitoring
    getServiceStatus: builder.query({
      query: () => '/status',
      providesTags: ['ServiceStatus'],
      
      // Poll every 30 seconds for real-time updates
      pollingInterval: 30000,
      
      transformResponse: (response) => ({
        ...response.data,
        lastUpdated: new Date().toISOString(),
      }),
    }),

    // Individual API key testing
    testApiKey: builder.mutation({
      query: (keyIndex) => ({
        url: `/test-key/${keyIndex}`,
        method: 'GET',
      }),
      invalidatesTags: ['KeyStatus', 'ServiceStatus'],
      
      transformResponse: (response) => ({
        ...response,
        testedAt: new Date().toISOString(),
      }),
    }),

    // Test all API keys
    testAllKeys: builder.mutation({
      query: () => ({
        url: '/test-keys',
        method: 'GET',
      }),
      invalidatesTags: ['KeyStatus', 'ServiceStatus'],
      
      transformResponse: (response) => ({
        ...response.data,
        completedAt: new Date().toISOString(),
      }),
    }),

    // Live service test with real AI request
    runLiveServiceTest: builder.mutation({
      query: () => ({
        url: '/live-test',
        method: 'GET',
      }),
      invalidatesTags: ['ServiceStatus'],
      
      transformResponse: (response) => ({
        ...response.data,
        testCompletedAt: new Date().toISOString(),
      }),
    }),

    // Analysis history retrieval
    getAnalysisHistory: builder.query({
      query: ({ limit = 10, offset = 0 } = {}) => ({
        url: `/history?limit=${limit}&offset=${offset}`,
        method: 'GET',
      }),
      providesTags: ['AIAnalysis'],
      
      // Merge results for pagination
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems, { arg }) => {
        if (arg.offset === 0) {
          // Reset cache for new data
          return newItems;
        } else {
          // Append to existing data
          return {
            ...newItems,
            data: {
              ...newItems.data,
              analyses: [
                ...currentCache.data.analyses,
                ...newItems.data.analyses,
              ],
            },
          };
        }
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.offset !== previousArg?.offset;
      },
    }),

    // Force API key switch (admin feature)
    forceKeySwitch: builder.mutation({
      query: (targetKeyIndex) => ({
        url: '/switch-key',
        method: 'POST',
        body: { targetKeyIndex },
      }),
      invalidatesTags: ['ServiceStatus', 'KeyStatus'],
      
      transformResponse: (response) => ({
        ...response,
        switchedAt: new Date().toISOString(),
      }),
    }),

    // Health check endpoint
    getHealthStatus: builder.query({
      query: () => '/health',
      
      // Check health every 2 minutes
      pollingInterval: 120000,
      
      transformResponse: (response) => ({
        ...response,
        lastChecked: new Date().toISOString(),
      }),
    }),

  }),
});

// Export hooks for use in components
export const {
  useAnalyzeDataMutation,
  useGetServiceStatusQuery,
  useTestApiKeyMutation,
  useTestAllKeysMutation,
  useRunLiveServiceTestMutation,
  useGetAnalysisHistoryQuery,
  useForceKeySwitchMutation,
  useGetHealthStatusQuery,
} = aiAnalysisApiSlice;

// Export slice reducer
export default aiAnalysisApiSlice.reducer;

// Selector helpers
export const selectServiceStatus = (state) => state.aiAnalysisApi.queries['getServiceStatus(undefined)']?.data;
export const selectHealthStatus = (state) => state.aiAnalysisApi.queries['getHealthStatus(undefined)']?.data;

// Utility functions for components
export const getKeyStatusColor = (status) => {
  switch (status) {
    case 'available': return '#4CAF50'; // Green
    case 'active': return '#2196F3';    // Blue
    case 'quota_exceeded': return '#FF9800'; // Orange
    case 'rate_limited': return '#FF5722';   // Red-Orange
    case 'invalid': return '#F44336';        // Red
    case 'error': return '#9E9E9E';          // Grey
    default: return '#757575';               // Default grey
  }
};

export const getKeyStatusIcon = (status) => {
  switch (status) {
    case 'available': return '✅';
    case 'active': return '🔵';
    case 'quota_exceeded': return '⚠️';
    case 'rate_limited': return '🚫';
    case 'invalid': return '❌';
    case 'error': return '⚪';
    default: return '❓';
  }
};

export const formatResponseTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export const calculateSuccessRate = (successful, total) => {
  if (total === 0) return '0%';
  return `${((successful / total) * 100).toFixed(1)}%`;
};
```

---

## 📊 Service Status Component

### ServiceStatusComponent.jsx - Complete Implementation

This component provides real-time monitoring of the multi-API key system with interactive testing capabilities.

```javascript
// frontend/src/components/aiAnalysis/ServiceStatusComponent.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import {
  useGetServiceStatusQuery,
  useTestApiKeyMutation,
  useTestAllKeysMutation,
  useRunLiveServiceTestMutation,
  useForceKeySwitchMutation,
  getKeyStatusColor,
  getKeyStatusIcon,
  formatResponseTime,
  calculateSuccessRate,
} from '../../slices/aiAnalysisApiSlice';

const ServiceStatusComponent = ({ onStatusChange, showAdminControls = false }) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    keys: false,
    stats: false,
    controls: false,
  });

  // RTK Query hooks
  const {
    data: serviceStatus,
    error: statusError,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useGetServiceStatusQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const [testApiKey, { isLoading: testingKey }] = useTestApiKeyMutation();
  const [testAllKeys, { isLoading: testingAllKeys }] = useTestAllKeysMutation();
  const [runLiveTest, { isLoading: runningLiveTest }] = useRunLiveServiceTestMutation();
  const [forceKeySwitch, { isLoading: switchingKey }] = useForceKeySwitchMutation();

  // Notify parent component of status changes
  useEffect(() => {
    if (serviceStatus && onStatusChange) {
      onStatusChange(serviceStatus);
    }
  }, [serviceStatus, onStatusChange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchStatus();
    } catch (error) {
      console.error('Failed to refresh status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestKey = async (keyIndex) => {
    try {
      const result = await testApiKey(keyIndex).unwrap();
      
      Alert.alert(
        'Key Test Result',
        result.success 
          ? `✅ API Key ${keyIndex} is working correctly`
          : `❌ API Key ${keyIndex} failed: ${result.error}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Failed', `Failed to test key ${keyIndex}: ${error.message}`);
    }
  };

  const handleTestAllKeys = async () => {
    try {
      const result = await testAllKeys().unwrap();
      
      Alert.alert(
        'All Keys Test Result',
        `✅ Working: ${result.workingKeys}/${result.totalKeys} keys\n` +
        `❌ Failed: ${result.failedKeys} keys`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Failed', `Failed to test keys: ${error.message}`);
    }
  };

  const handleLiveTest = async () => {
    try {
      const result = await runLiveTest().unwrap();
      
      Alert.alert(
        'Live Service Test',
        `✅ Service is working correctly!\n` +
        `Response time: ${formatResponseTime(result.responseTime)}\n` +
        `Active key: ${result.activeKeyIndex}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Live Test Failed',
        `❌ Service test failed: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleForceSwitch = async () => {
    Alert.alert(
      'Switch API Key',
      'Force switch to the next available API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              const result = await forceKeySwitch().unwrap();
              Alert.alert('Success', result.message);
            } catch (error) {
              Alert.alert('Failed', `Key switch failed: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderKeyStatus = (keyStatus, index) => (
    <View key={index} style={[styles.keyCard, { borderColor: colors.border }]}>
      <View style={styles.keyHeader}>
        <Text style={[styles.keyIcon, { color: getKeyStatusColor(keyStatus.status) }]}>
          {getKeyStatusIcon(keyStatus.status)}
        </Text>
        <Text style={[styles.keyTitle, { color: colors.text }]}>
          API Key {index}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getKeyStatusColor(keyStatus.status) + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getKeyStatusColor(keyStatus.status) }
          ]}>
            {keyStatus.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.keyDetails}>
        <Text style={[styles.keyDetail, { color: colors.text }]}>
          Usage: {keyStatus.usageCount || 0} requests
        </Text>
        {keyStatus.lastFailureTime && (
          <Text style={[styles.keyDetail, { color: colors.text }]}>
            Last failure: {new Date(keyStatus.lastFailureTime).toLocaleString()}
          </Text>
        )}
      </View>
      
      {showAdminControls && (
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary }]}
          onPress={() => handleTestKey(index)}
          disabled={testingKey}
        >
          <Text style={styles.testButtonText}>
            {testingKey ? 'Testing...' : 'Test Key'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (statusLoading && !serviceStatus) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading service status...
        </Text>
      </View>
    );
  }

  if (statusError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          ❌ Failed to load service status
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Service Overview */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
        onPress={() => toggleSection('overview')}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔍 Service Overview
        </Text>
        <Text style={[styles.expandIcon, { color: colors.text }]}>
          {expandedSections.overview ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {expandedSections.overview && serviceStatus && (
        <View style={styles.sectionContent}>
          <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
            <View style={styles.overviewRow}>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>Status:</Text>
              <Text style={[
                styles.overviewValue,
                { color: serviceStatus.isConfigured ? '#4CAF50' : '#F44336' }
              ]}>
                {serviceStatus.isConfigured ? '✅ Active' : '❌ Inactive'}
              </Text>
            </View>
            
            <View style={styles.overviewRow}>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>Total Keys:</Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>
                {serviceStatus.totalKeys}
              </Text>
            </View>
            
            <View style={styles.overviewRow}>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>Available Keys:</Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>
                {serviceStatus.availableKeys}
              </Text>
            </View>
            
            <View style={styles.overviewRow}>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>Active Key:</Text>
              <Text style={[styles.overviewValue, { color: '#2196F3' }]}>
                Key {serviceStatus.activeKeyIndex}
              </Text>
            </View>
            
            {serviceStatus.lastSwitchTime && (
              <View style={styles.overviewRow}>
                <Text style={[styles.overviewLabel, { color: colors.text }]}>Last Switch:</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>
                  {new Date(serviceStatus.lastSwitchTime).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* API Keys Status */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
        onPress={() => toggleSection('keys')}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔑 API Keys Status
        </Text>
        <Text style={[styles.expandIcon, { color: colors.text }]}>
          {expandedSections.keys ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {expandedSections.keys && serviceStatus?.keysStatus && (
        <View style={styles.sectionContent}>
          {serviceStatus.keysStatus.map((keyStatus, index) => 
            renderKeyStatus(keyStatus, index)
          )}
        </View>
      )}

      {/* Usage Statistics */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
        onPress={() => toggleSection('stats')}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📊 Usage Statistics
        </Text>
        <Text style={[styles.expandIcon, { color: colors.text }]}>
          {expandedSections.stats ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {expandedSections.stats && serviceStatus?.usageStats && (
        <View style={styles.sectionContent}>
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Total Requests:</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {serviceStatus.usageStats.totalRequests}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Successful:</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {serviceStatus.usageStats.successfulRequests}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Success Rate:</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {calculateSuccessRate(
                  serviceStatus.usageStats.successfulRequests,
                  serviceStatus.usageStats.totalRequests
                )}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.text }]}>Key Switches:</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {serviceStatus.usageStats.switchCount}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Admin Controls */}
      {showAdminControls && (
        <>
          <TouchableOpacity
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
            onPress={() => toggleSection('controls')}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ⚙️ Admin Controls
            </Text>
            <Text style={[styles.expandIcon, { color: colors.text }]}>
              {expandedSections.controls ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {expandedSections.controls && (
            <View style={styles.sectionContent}>
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.primary }]}
                  onPress={handleTestAllKeys}
                  disabled={testingAllKeys}
                >
                  <Text style={styles.controlButtonText}>
                    {testingAllKeys ? 'Testing All Keys...' : '🧪 Test All Keys'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: '#4CAF50' }]}
                  onPress={handleLiveTest}
                  disabled={runningLiveTest}
                >
                  <Text style={styles.controlButtonText}>
                    {runningLiveTest ? 'Running Test...' : '🚀 Live Service Test'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: '#FF9800' }]}
                  onPress={handleForceSwitch}
                  disabled={switchingKey}
                >
                  <Text style={styles.controlButtonText}>
                    {switchingKey ? 'Switching...' : '🔄 Force Key Switch'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  expandIcon: {
    fontSize: 16,
  },
  
  sectionContent: {
    paddingVertical: 16,
  },
  
  overviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  overviewLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  keyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  
  keyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  keyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  
  keyTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  keyDetails: {
    marginBottom: 12,
  },
  
  keyDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  statsCard: {
    padding: 16,
    borderRadius: 12,
  },
  
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  controlsContainer: {
    gap: 12,
  },
  
  controlButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceStatusComponent;
```

---

## 📱 Analytics Screen Integration

### AIAnalyticsScreen.jsx - Enhanced Implementation

```javascript
// frontend/src/screens/AIAnalyticsScreen.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import {
  useAnalyzeDataMutation,
  useGetServiceStatusQuery,
  useGetAnalysisHistoryQuery,
} from '../slices/aiAnalysisApiSlice';
import ServiceStatusComponent from '../components/aiAnalysis/ServiceStatusComponent';

const AIAnalyticsScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('analysis');
  const [refreshing, setRefreshing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [showServiceStatus, setShowServiceStatus] = useState(false);

  // RTK Query hooks
  const [analyzeData, { 
    isLoading: isAnalyzing, 
    error: analysisError 
  }] = useAnalyzeDataMutation();
  
  const { 
    data: serviceStatus, 
    isLoading: statusLoading 
  } = useGetServiceStatusQuery();
  
  const { 
    data: analysisHistory, 
    isLoading: historyLoading,
    refetch: refetchHistory 
  } = useGetAnalysisHistoryQuery({ limit: 5 });

  // Check if we have analysis data from route params
  useEffect(() => {
    if (route.params?.analysisData) {
      setAnalysisData(route.params.analysisData);
      setActiveTab('results');
    }
  }, [route.params]);

  // Refresh screen when focused
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'history') {
        refetchHistory();
      }
    }, [activeTab, refetchHistory])
  );

  const handleAnalyzeData = async (data) => {
    try {
      const result = await analyzeData(data).unwrap();
      setAnalysisData(result);
      setActiveTab('results');
      
      // Show success message
      Alert.alert(
        'Analysis Complete',
        'Your data has been analyzed successfully!',
        [{ text: 'View Results', onPress: () => setActiveTab('results') }]
      );
    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Enhanced error handling with user-friendly messages
      const errorMessage = getErrorMessage(error);
      
      Alert.alert(
        'Analysis Failed',
        errorMessage,
        [
          { text: 'Try Again', onPress: () => handleAnalyzeData(data) },
          { text: 'Check Service Status', onPress: () => setShowServiceStatus(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const getErrorMessage = (error) => {
    switch (error.errorType) {
      case 'SERVICE_UNAVAILABLE':
        return 'AI analysis service is temporarily unavailable. Please try again in a few minutes.';
      case 'QUOTA_EXCEEDED':
        return 'Service is experiencing high demand. Please try again shortly.';
      case 'AUTH_ERROR':
        return 'Authentication required. Please log in and try again.';
      case 'INVALID_DATA':
        return 'The provided data is invalid. Please check your input and try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchHistory();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleServiceStatusChange = (status) => {
    // Handle service status changes
    if (status && !status.isConfigured) {
      Alert.alert(
        'Service Configuration Issue',
        'AI analysis service is not properly configured. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderTabButton = (tabId, title, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabId && styles.activeTabButton,
        { borderBottomColor: activeTab === tabId ? colors.primary : 'transparent' }
      ]}
      onPress={() => setActiveTab(tabId)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text
        style={[
          styles.tabTitle,
          { color: activeTab === tabId ? colors.primary : colors.text },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderAnalysisForm = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        🧠 AI Data Analysis
      </Text>
      
      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.formDescription, { color: colors.text }]}>
          Upload your fitness data to get personalized insights and recommendations.
        </Text>
        
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            { backgroundColor: colors.primary },
            isAnalyzing && styles.disabledButton
          ]}
          onPress={() => {
            // Simulate analysis with sample data
            const sampleData = {
              workouts: 12,
              calories: 2400,
              steps: 8500,
              sleep: 7.5,
              timestamp: new Date().toISOString(),
            };
            handleAnalyzeData(sampleData);
          }}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.analyzeButtonText}>🚀 Analyze Sample Data</Text>
          )}
        </TouchableOpacity>
        
        {analysisError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              ❌ {getErrorMessage(analysisError)}
            </Text>
          </View>
        )}
      </View>

      {/* Service Status Indicator */}
      {serviceStatus && (
        <TouchableOpacity
          style={[styles.statusIndicator, { backgroundColor: colors.card }]}
          onPress={() => setShowServiceStatus(!showServiceStatus)}
        >
          <Text style={[styles.statusText, { color: colors.text }]}>
            🔍 Service Status: {serviceStatus.isConfigured ? '✅ Active' : '❌ Inactive'}
          </Text>
          <Text style={[styles.statusDetail, { color: colors.text }]}>
            Active Key: {serviceStatus.activeKeyIndex} | Available: {serviceStatus.availableKeys}/{serviceStatus.totalKeys}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAnalysisResults = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        📊 Analysis Results
      </Text>
      
      {analysisData ? (
        <ScrollView style={styles.resultsContainer}>
          {analysisData.data && (
            <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                Summary
              </Text>
              <Text style={[styles.resultText, { color: colors.text }]}>
                {analysisData.data.summary || 'Analysis completed successfully.'}
              </Text>
            </View>
          )}
          
          {analysisData.metadata && (
            <View style={[styles.metadataCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.metadataTitle, { color: colors.text }]}>
                Analysis Metadata
              </Text>
              <Text style={[styles.metadataText, { color: colors.text }]}>
                Processing Time: {analysisData.metadata.processingTime}ms
              </Text>
              <Text style={[styles.metadataText, { color: colors.text }]}>
                API Key Used: {analysisData.metadata.apiKeyIndex}
              </Text>
              <Text style={[styles.metadataText, { color: colors.text }]}>
                Timestamp: {new Date(analysisData.metadata.timestamp).toLocaleString()}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={[styles.noResultsText, { color: colors.text }]}>
            No analysis results yet. Run an analysis to see results here.
          </Text>
        </View>
      )}
    </View>
  );

  const renderAnalysisHistory = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        📜 Analysis History
      </Text>
      
      {historyLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading history...
          </Text>
        </View>
      ) : analysisHistory?.data?.analyses?.length > 0 ? (
        <ScrollView 
          style={styles.historyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {analysisHistory.data.analyses.map((analysis, index) => (
            <TouchableOpacity
              key={analysis._id || index}
              style={[styles.historyItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setAnalysisData({ data: analysis.result });
                setActiveTab('results');
              }}
            >
              <Text style={[styles.historyDate, { color: colors.text }]}>
                {new Date(analysis.timestamp).toLocaleDateString()}
              </Text>
              <Text style={[styles.historyTime, { color: colors.text }]}>
                {new Date(analysis.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={[styles.historyDuration, { color: colors.text }]}>
                {analysis.processingTime}ms
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noHistoryContainer}>
          <Text style={[styles.noHistoryText, { color: colors.text }]}>
            No analysis history available yet.
          </Text>
        </View>
      )}
    </View>
  );

  const renderServiceStatus = () => (
    <View style={styles.tabContent}>
      <ServiceStatusComponent
        onStatusChange={handleServiceStatusChange}
        showAdminControls={true}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('analysis', 'Analysis', '🧠')}
          {renderTabButton('results', 'Results', '📊')}
          {renderTabButton('history', 'History', '📜')}
          {renderTabButton('status', 'Status', '🔍')}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'analysis' && renderAnalysisForm()}
        {activeTab === 'results' && renderAnalysisResults()}
        {activeTab === 'history' && renderAnalysisHistory()}
        {activeTab === 'status' && renderServiceStatus()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 8,
    borderBottomWidth: 2,
  },
  
  activeTabButton: {
    // Active tab styling handled by borderBottomColor
  },
  
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  tabTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  contentContainer: {
    flex: 1,
  },
  
  tabContent: {
    flex: 1,
    padding: 16,
  },
  
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  formCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  formDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  analyzeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  
  disabledButton: {
    opacity: 0.6,
  },
  
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  
  errorContainer: {
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginTop: 12,
  },
  
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  
  statusIndicator: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  statusDetail: {
    fontSize: 14,
  },
  
  resultsContainer: {
    flex: 1,
  },
  
  resultCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  metadataCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  metadataText: {
    fontSize: 14,
    marginBottom: 4,
  },
  
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  
  historyContainer: {
    flex: 1,
  },
  
  historyItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  historyTime: {
    fontSize: 14,
  },
  
  historyDuration: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  noHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  noHistoryText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AIAnalyticsScreen;
```

---

Continue to Part 4 for Testing, Monitoring & Production Deployment implementation details...

*This document covers the complete frontend implementation of the multi-API key system. The next part will detail testing strategies, monitoring setup, and production deployment best practices.*
