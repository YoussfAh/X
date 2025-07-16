import { apiSlice } from './apiSlice';

const WATER_TRACKING_URL = '/api/water-tracking';

export const waterTrackingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTodaysWaterTracking: builder.query({
      query: () => `${WATER_TRACKING_URL}/today`,
      providesTags: ['WaterTracking'],
    }),
    getWaterTrackingHistory: builder.query({
      query: ({ startDate, endDate, limit } = {}) => ({
        url: `${WATER_TRACKING_URL}/history`,
        params: { startDate, endDate, limit },
      }),
      providesTags: ['WaterTracking'],
    }),
    getWaterTrackingAnalytics: builder.query({
      query: ({ days } = {}) => ({
        url: `${WATER_TRACKING_URL}/analytics`,
        params: { days },
      }),
      providesTags: ['WaterTracking'],
    }),
    addWaterIntake: builder.mutation({
      query: ({ amount = 1, note = '' } = {}) => ({
        url: `${WATER_TRACKING_URL}/add`,
        method: 'POST',
        body: { amount, note },
      }),
      invalidatesTags: ['WaterTracking'],
    }),
    removeWaterIntake: builder.mutation({
      query: ({ amount = 1 } = {}) => ({
        url: `${WATER_TRACKING_URL}/remove`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['WaterTracking'],
    }),
    resetWaterIntake: builder.mutation({
      query: () => ({
        url: `${WATER_TRACKING_URL}/reset`,
        method: 'POST',
      }),
      invalidatesTags: ['WaterTracking'],
    }),
    updateWaterGoal: builder.mutation({
      query: ({ goal }) => ({
        url: `${WATER_TRACKING_URL}/goal`,
        method: 'PUT',
        body: { goal },
      }),
      invalidatesTags: ['WaterTracking'],
    }),
  }),
});

export const {
  useGetTodaysWaterTrackingQuery,
  useGetWaterTrackingHistoryQuery,
  useGetWaterTrackingAnalyticsQuery,
  useAddWaterIntakeMutation,
  useRemoveWaterIntakeMutation,
  useResetWaterIntakeMutation,
  useUpdateWaterGoalMutation,
} = waterTrackingApiSlice; 