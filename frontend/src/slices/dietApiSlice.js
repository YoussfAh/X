import { DIET_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const dietApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create new diet entry
    createDietEntry: builder.mutation({
      query: (data) => ({
        url: DIET_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DietEntry'],
    }),

    // Get user's diet entries
    getDietEntries: builder.query({
      query: (params = {}) => ({
        url: DIET_URL,
        params,
      }),
      providesTags: ['DietEntry'],
      keepUnusedDataFor: 5,
    }),

    // Get diet entry by ID
    getDietEntryById: builder.query({
      query: (id) => ({
        url: `${DIET_URL}/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'DietEntry', id }],
    }),

    // Update diet entry
    updateDietEntry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${DIET_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DietEntry', id },
        'DietEntry',
      ],
    }),

    // Delete diet entry
    deleteDietEntry: builder.mutation({
      query: (id) => ({
        url: `${DIET_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DietEntry'],
    }),

    // Get diet analytics
    getDietAnalytics: builder.query({
      query: (params = {}) => ({
        url: `${DIET_URL}/analytics`,
        params,
      }),
      providesTags: ['DietAnalytics'],
      keepUnusedDataFor: 5,
    }),

    // Admin: Get user diet entries
    getAdminUserDietEntries: builder.query({
      query: ({ userId, ...params }) => ({
        url: `${DIET_URL}/admin/${userId}`,
        params,
      }),
      providesTags: (result, error, { userId }) => [
        { type: 'AdminDietEntry', id: userId },
      ],
      keepUnusedDataFor: 5,
    }),

    // Get my diet entries with advanced filtering
    getMyDietEntries: builder.query({
      query: ({
        page = 1,
        limit = 50,
        startDate,
        endDate,
        mealType = 'all',
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (mealType !== 'all') params.append('mealType', mealType);

        return {
          url: `${DIET_URL}?${params.toString()}`,
        };
      },
      providesTags: ['DietEntry'],
      keepUnusedDataFor: 5,
    }),

    // Get today's diet entries
    getTodaysDietEntries: builder.query({
      query: () => {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        return {
          url: `${DIET_URL}?startDate=${startOfDay}&endDate=${endOfDay}`,
        };
      },
      providesTags: ['TodayDiet'],
      keepUnusedDataFor: 60, // Cache for 1 minute since this is real-time data
    }),

    // Quick log meal (simplified endpoint for collection page)
    quickLogMeal: builder.mutation({
      query: ({ productId, collectionId, mealType = 'other' }) => ({
        url: DIET_URL,
        method: 'POST',
        body: {
          productId,
          collectionId,
          mealType,
          items: [{ quantity: 1, unit: 'serving' }],
          feeling: 'satisfied',
          energyLevel: 'medium',
        },
      }),
      invalidatesTags: ['DietEntry', 'TodayDiet', 'DietAnalytics'],
    }),
  }),
});

export const {
  useCreateDietEntryMutation,
  useGetDietEntriesQuery,
  useGetDietEntryByIdQuery,
  useUpdateDietEntryMutation,
  useDeleteDietEntryMutation,
  useGetDietAnalyticsQuery,
  useGetAdminUserDietEntriesQuery,
  useGetMyDietEntriesQuery,
  useGetTodaysDietEntriesQuery,
  useQuickLogMealMutation,
} = dietApiSlice; 