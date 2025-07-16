import { USERS_URL } from '../constants';
import { apiSlice } from './apiSlice';

const AI_ANALYSIS_URL = '/api/ai-analysis';

export const aiAnalysisApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => ({
        url: `${USERS_URL}?skipPagination=true`,
        credentials: 'include',
      }),
      providesTags: ['User'],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    
    getUserDataForAnalysis: builder.query({
      query: ({ userId = null, dataTypes = 'all', dateRange = null }) => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (dataTypes) params.append('dataTypes', dataTypes);
        if (dateRange) {
          // Don't double stringify - dateRange is already an object
          params.append('dateRange', JSON.stringify(dateRange));
        }
        
        const finalUrl = `${AI_ANALYSIS_URL}/user-data?${params.toString()}`;
        console.log('=== API Query Debug ===');
        console.log('Query params:', { userId, dataTypes, dateRange });
        console.log('Generated URL:', finalUrl);
        
        return {
          url: finalUrl,
          credentials: 'include',
        };
      },
      keepUnusedDataFor: 0, // Don't cache at all for now to debug
      providesTags: (result, error, arg) => [
        { type: 'UserAnalysisData', id: `${arg.userId || 'current'}-${arg.dataTypes}-${JSON.stringify(arg.dateRange)}` }
      ],
    }),
    
    analyzeUserData: builder.mutation({
      query: ({ userId = null, ...analysisRequest }) => ({
        url: `${AI_ANALYSIS_URL}/analyze`,
        method: 'POST',
        body: { userId, ...analysisRequest },
        credentials: 'include',
      }),
      invalidatesTags: ['AnalysisResults', 'AnalysisHistory'],
    }),

    getAnalysisHistory: builder.query({
      query: ({ userId = null, page = 1, limit = 10, analysisType = 'all', isFavorite } = {}) => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (analysisType !== 'all') params.append('analysisType', analysisType);
        if (isFavorite !== undefined) params.append('isFavorite', isFavorite.toString());
        
        return {
          url: `${AI_ANALYSIS_URL}/history?${params.toString()}`,
          credentials: 'include',
        };
      },
      providesTags: ['AnalysisHistory'],
    }),

    getAnalysisById: builder.query({
      query: (id) => ({
        url: `${AI_ANALYSIS_URL}/${id}`,
        credentials: 'include',
      }),
      providesTags: (result, error, id) => [{ type: 'Analysis', id }],
    }),

    updateAnalysis: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `${AI_ANALYSIS_URL}/${id}`,
        method: 'PUT',
        body: updateData,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Analysis', id },
        'AnalysisHistory'
      ],
    }),

    deleteAnalysis: builder.mutation({
      query: (id) => ({
        url: `${AI_ANALYSIS_URL}/${id}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['AnalysisHistory'],
    }),

    getAnalysisStats: builder.query({
      query: () => ({
        url: `${AI_ANALYSIS_URL}/stats`,
        credentials: 'include',
      }),
      providesTags: ['AnalysisStats'],
    }),

    getServiceStatus: builder.query({
      query: () => ({
        url: `${AI_ANALYSIS_URL}/service-status`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 30, // Keep data for 30 seconds
    }),

    testApiKeys: builder.mutation({
      query: () => ({
        url: `${AI_ANALYSIS_URL}/test-keys`,
        method: 'POST',
        credentials: 'include',
      }),
    }),

    testAIService: builder.mutation({
      query: () => ({
        url: `${AI_ANALYSIS_URL}/test-service`,
        method: 'POST',
        credentials: 'include',
      }),
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserDataForAnalysisQuery,
  useAnalyzeUserDataMutation,
  useGetAnalysisHistoryQuery,
  useGetAnalysisByIdQuery,
  useUpdateAnalysisMutation,
  useDeleteAnalysisMutation,
  useGetAnalysisStatsQuery,
  useGetServiceStatusQuery,
  useTestApiKeysMutation,
  useTestAIServiceMutation,
} = aiAnalysisApiSlice;
