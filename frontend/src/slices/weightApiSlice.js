import { WEIGHT_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const weightApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createWeightEntry: builder.mutation({
      query: (data) => ({
        url: WEIGHT_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WeightEntry'],
    }),

    getWeightEntries: builder.query({
      query: (params = {}) => ({
        url: WEIGHT_URL,
        params,
      }),
      providesTags: ['WeightEntry'],
      keepUnusedDataFor: 5,
    }),

    getLatestWeight: builder.query({
      query: () => `${WEIGHT_URL}/latest`,
      providesTags: ['LatestWeight'],
    }),

    getWeightEntryById: builder.query({
      query: (id) => ({
        url: `${WEIGHT_URL}/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'WeightEntry', id }],
    }),

    updateWeightEntry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${WEIGHT_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WeightEntry', id },
        'WeightEntry',
        'LatestWeight',
      ],
    }),

    deleteWeightEntry: builder.mutation({
      query: (id) => ({
        url: `${WEIGHT_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WeightEntry', 'LatestWeight'],
    }),
  }),
});

export const {
  useCreateWeightEntryMutation,
  useGetWeightEntriesQuery,
  useGetLatestWeightQuery,
  useGetWeightEntryByIdQuery,
  useUpdateWeightEntryMutation,
  useDeleteWeightEntryMutation,
} = weightApiSlice; 