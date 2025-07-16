import { apiSlice } from './apiSlice';

export const oneTimeCodesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateOneTimeCode: builder.mutation({
      query: (data) => ({
        url: '/api/one-time-codes/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OneTimeCodes'],
    }),
    generateBatchCodes: builder.mutation({
      query: (data) => ({
        url: '/api/one-time-codes/batch-generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OneTimeCodes'],
    }),
    generateUniversalCode: builder.mutation({
      query: (data) => ({
        url: '/api/one-time-codes/generate-universal',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OneTimeCodes'],
    }),
    generateBatchUniversalCodes: builder.mutation({
      query: (data) => ({
        url: '/api/one-time-codes/batch-generate-universal',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OneTimeCodes'],
    }),
    validateOneTimeCode: builder.mutation({
      query: (data) => ({
        url: '/api/one-time-codes/validate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Collections'],
    }),
    getOneTimeCodesByCollection: builder.query({
      query: (collectionId) => ({
        url: `/api/one-time-codes/collection/${collectionId}`,
      }),
      providesTags: ['OneTimeCodes'],
      keepUnusedDataFor: 5,
    }),
    getAllOneTimeCodes: builder.query({
      query: (params) => ({
        url: '/api/one-time-codes',
        params,
      }),
      providesTags: ['OneTimeCodes'],
      keepUnusedDataFor: 5,
    }),
    getUniversalCodes: builder.query({
      query: () => ({
        url: '/api/one-time-codes/universal',
      }),
      providesTags: ['OneTimeCodes'],
      keepUnusedDataFor: 5,
    }),
    deleteOneTimeCode: builder.mutation({
      query: (codeId) => ({
        url: `/api/one-time-codes/${codeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OneTimeCodes'],
    }),
  }),
});

export const {
  useGenerateOneTimeCodeMutation,
  useGenerateBatchCodesMutation,
  useGenerateUniversalCodeMutation,
  useGenerateBatchUniversalCodesMutation,
  useValidateOneTimeCodeMutation,
  useGetOneTimeCodesByCollectionQuery,
  useGetAllOneTimeCodesQuery,
  useGetUniversalCodesQuery,
  useDeleteOneTimeCodeMutation,
} = oneTimeCodesApiSlice;
