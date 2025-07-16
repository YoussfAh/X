import { COLLECTIONS_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const collectionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query({
      query: () => ({
        url: COLLECTIONS_URL,
        credentials: 'include',
      }),
      keepUnusedDataFor: 300, // Increase from 5 to 300 seconds (5 minutes)
      providesTags: ['Collections'],
    }),
    getAdminCollections: builder.query({
      query: ({ pageNumber = 1, keyword = '', visibility = 'all', skipPagination = false }) => ({
        url: `${COLLECTIONS_URL}/admin`,
        params: {
          pageNumber,
          keyword,
          visibility,
          skipPagination,
          _t: Date.now() // Force cache bypass with timestamp
        },
        credentials: 'include',
      }),
      keepUnusedDataFor: 0, // Force fresh data on each request to ensure sub-collections count updates
      providesTags: ['Collections'],
    }),
    getCollectionDetails: builder.query({
      query: (collectionId) => ({
        url: `${COLLECTIONS_URL}/${collectionId}`,
        credentials: 'include',
      }),
      // Increase cache time to prevent skeleton reloads
      keepUnusedDataFor: 600, // 10 minutes
      // Provide collection-specific tags for better cache management
      providesTags: (result, error, collectionId) => [
        { type: 'Collections', id: collectionId },
        'Collections'
      ],
    }),
    getAdminCollectionDetails: builder.query({
      query: (collectionId) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/admin`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 5,
    }),
    getSubCollections: builder.query({
      query: (parentId) => ({
        url: `${COLLECTIONS_URL}/${parentId}/subcollections`,
        credentials: 'include',
      }),
      // Increase cache time to prevent skeleton reloads
      keepUnusedDataFor: 600, // 10 minutes
      // Provide parent-specific tags for better cache management
      providesTags: (result, error, parentId) => [
        { type: 'Collections', id: `sub-${parentId}` },
        'Collections'
      ],
    }),
    getAdminSubCollections: builder.query({
      query: (parentId) => ({
        url: `${COLLECTIONS_URL}/${parentId}/admin-subcollections`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Collections'],
    }),
    createCollection: builder.mutation({
      query: (data) => ({
        url: COLLECTIONS_URL,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    updateCollection: builder.mutation({
      query: (data) => ({
        url: `${COLLECTIONS_URL}/${data.collectionId}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    deleteCollection: builder.mutation({
      query: (collectionId) => ({
        url: `${COLLECTIONS_URL}/${collectionId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    uploadCollectionImage: builder.mutation({
      query: (data) => ({
        url: '/api/upload',
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
    }),
    addProductToCollection: builder.mutation({
      query: ({ collectionId, productId, displayOrder }) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/products`,
        method: 'POST',
        body: { productId, displayOrder },
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    removeProductFromCollection: builder.mutation({
      query: ({ collectionId, productId }) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/products/${productId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    updateProductsOrder: builder.mutation({
      query: ({ collectionId, productOrders }) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/products/reorder`,
        method: 'PUT',
        body: { productOrders },
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    updateAccessedCollections: builder.mutation({
      query: (data) => ({
        url: `${COLLECTIONS_URL}/accessed`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['User'],
    }),
    moveCollectionUp: builder.mutation({
      query: (collectionId) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/move-up`,
        method: 'PUT',
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    moveCollectionDown: builder.mutation({
      query: (collectionId) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/move-down`,
        method: 'PUT',
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    updateCollectionOrder: builder.mutation({
      query: ({ collectionId, orderNumber }) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/order`,
        method: 'PUT',
        body: { orderNumber },
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
    duplicateCollection: builder.mutation({
      query: (collectionId) => ({
        url: `${COLLECTIONS_URL}/${collectionId}/duplicate`,
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: ['Collections'],
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useGetAdminCollectionsQuery,
  useGetCollectionDetailsQuery,
  useGetAdminCollectionDetailsQuery,
  useGetSubCollectionsQuery,
  useGetAdminSubCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useUploadCollectionImageMutation,
  useAddProductToCollectionMutation,
  useRemoveProductFromCollectionMutation,
  useUpdateProductsOrderMutation,
  useUpdateAccessedCollectionsMutation,
  useMoveCollectionUpMutation,
  useMoveCollectionDownMutation,
  useUpdateCollectionOrderMutation,
  useDuplicateCollectionMutation,
} = collectionsApiSlice;
