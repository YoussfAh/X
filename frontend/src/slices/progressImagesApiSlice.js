import { apiSlice } from './apiSlice';

export const progressImagesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    saveProgressImages: builder.mutation({
      query: (data) => ({
        url: '/api/progress-images',
        method: 'POST',
        body: data, // Now sends JSON data with image URLs
      }),
      invalidatesTags: ['ProgressImages'],
    }),
    getProgressImages: builder.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/api/progress-images?page=${page}&limit=${limit}`,
      }),
      providesTags: ['ProgressImages'],
    }),
    deleteProgressImageGroup: builder.mutation({
      query: (groupId) => ({
        url: `/api/progress-images/${groupId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProgressImages'],
    }),
  }),
});

export const {
  useSaveProgressImagesMutation,
  useGetProgressImagesQuery,
  useDeleteProgressImageGroupMutation,
} = progressImagesApiSlice; 