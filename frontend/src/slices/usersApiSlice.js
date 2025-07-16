import { apiSlice } from './apiSlice';
import { setCredentials } from './authSlice';
import { BASE_URL } from '../constants';

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/auth`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      // Minimal cache invalidation - only invalidate user data
      invalidatesTags: ['User'],
    }),
    googleLogin: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/auth/google`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      // Minimal cache invalidation - only invalidate user data
      invalidatesTags: ['User'],
    }),
    register: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: `${BASE_URL}/api/users/logout`,
        method: 'POST',
        credentials: 'include',
      }),
    }),
    profile: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/profile`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
    }),
    refreshUserData: builder.query({
      query: () => ({
        url: `${BASE_URL}/api/users/refresh-data`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 0, // Don't cache this data
      providesTags: ['User'],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // If we got data successfully, also invalidate collections to force a refresh
          dispatch(apiSlice.util.invalidateTags(['Collections', 'AssignedCollections']));
        } catch (error) {
          // Silently fail
        }
      },
    }),
    getUsers: builder.query({
      query: ({ pageNumber = 1, keyword = '', role = 'all', codeAccess = 'all', skipPagination = false }) => ({
        url: `${BASE_URL}/api/users`,
        params: { pageNumber, keyword, role, codeAccess, skipPagination },
        credentials: 'include',
      }),
      providesTags: ['User'],
      keepUnusedDataFor: 5,
    }),
    getUserStats: builder.query({
      query: () => ({
        url: `${BASE_URL}/api/users/stats`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 60, // Cache for 1 minute
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `${BASE_URL}/api/users/${userId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
    }),
    getUserDetails: builder.query({
      query: (userId) => ({
        url: `${BASE_URL}/api/users/${userId}`,
        credentials: 'include',
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }],
      keepUnusedDataFor: 5,
    }),
    updateUser: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data._id}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      // Invalidate both the general User tag and the specific user details
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg._id },
        'AssignedCollections',
        'Collections',
      ],
      // Optimistically update the cache
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedUser } = await queryFulfilled;
          console.log('🔄 UpdateUser mutation completed. Updating cache...');
          
          // Update the getUserDetails cache with the new data
          dispatch(
            usersApiSlice.util.updateQueryData(
              'getUserDetails',
              arg._id,
              (draft) => {
                Object.assign(draft, updatedUser);
                console.log('📊 Cache updated with new user data:', draft.featureFlags);
              }
            )
          );
        } catch (error) {
          console.error('❌ Error in updateUser onQueryStarted:', error);
        }
      },
    }),
    updateAccessedCollections: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/collections/accessed`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: ['User'],
    }),
    adminAddLockedCollection: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/collections/lock`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg.userId },
      ],
    }),
    removeLockedCollection: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/collections/unlock`,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg.userId },
      ],
    }),
    updateUserPassword: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/update-password`,
        method: 'PUT',
        body: { password: data.password },
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg.userId },
      ],
    }),
    getUserAssignedCollections: builder.query({
      query: (userId) => ({
        url: `${BASE_URL}/api/users/${userId}/assigned-collections`,
        credentials: 'include',
      }),
      providesTags: ['AssignedCollections'],
    }),
    assignCollectionToUser: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/assigned-collections`,
        method: 'POST',
        body: {
          collectionId: data.collectionId,
          name: data.name,
          notes: data.notes,
          tags: data.tags
        },
        credentials: 'include',
      }),
      invalidatesTags: ['Collections', 'AssignedCollections', 'User'],
    }),
    removeAssignedCollection: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/assigned-collections/${data.collectionId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Collections', 'AssignedCollections', 'User'],
    }),
    updateAssignedCollection: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/assigned-collections/${data.collectionId}`,
        method: 'PUT',
        body: {
          notes: data.notes,
          tags: data.tags,
          status: data.status
        },
        credentials: 'include',
      }),
      invalidatesTags: ['Collections', 'AssignedCollections', 'User'],
    }),
    batchAssignCollections: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/assigned-collections/batch`,
        method: 'POST',
        body: {
          collections: data.collections
        },
        credentials: 'include',
      }),
      invalidatesTags: ['Collections', 'AssignedCollections', 'User'],
    }),
    trackCollectionAccess: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/assigned-collections/${data.collectionId}/access`,
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: ['AssignedCollections'],
    }),
    trackUserContact: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/contact`,
        method: 'POST',
        body: {
          contactNotes: data.contactNotes,
          contactType: data.contactType,
          status: data.status,
          outcome: data.outcome,
          followUpDate: data.followUpDate,
          tags: data.tags
        },
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg.userId },
        'ContactHistory',
        { type: 'ContactHistory', id: arg.userId },
        'TimeFrameManagement',
        { type: 'ContactHistory', id: 'LIST' },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Force refetch of the contact history query
          dispatch(
            usersApiSlice.util.invalidateTags([
              { type: 'ContactHistory', id: arg.userId },
              'ContactHistory'
            ])
          );
        } catch {
          // Handle error if needed
        }
      },
    }),

    addAdminNote: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/admin-notes`,
        method: 'POST',
        body: {
          note: data.note,
        },
        credentials: 'include',
      }),
      async onQueryStarted({ userId }, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedUser } = await queryFulfilled;
          dispatch(
            usersApiSlice.util.updateQueryData(
              'getUserDetails',
              userId,
              (draft) => {
                draft.adminNotes = updatedUser.adminNotes;
              }
            )
          );
        } catch {
          // Handle error if needed
        }
      },
    }),

    deleteAdminNote: builder.mutation({
      query: ({ userId, noteId }) => ({
        url: `${BASE_URL}/api/users/${userId}/admin-notes/${noteId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      async onQueryStarted({ userId, noteId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            usersApiSlice.util.updateQueryData(
              'getUserDetails',
              userId,
              (draft) => {
                draft.adminNotes = draft.adminNotes.filter(
                  (note) => note._id !== noteId
                );
              }
            )
          );
        } catch {
          // Handle error if needed
        }
      },
    }),

    getUserContactHistory: builder.query({
      query: ({ userId, limit, contactType, status, includeInactive, _refresh }) => {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit);
        if (contactType) params.append('contactType', contactType);
        if (status) params.append('status', status);
        if (includeInactive !== undefined) params.append('includeInactive', includeInactive);

        // Add timestamp for cache busting when refreshing
        if (_refresh) {
          params.append('_t', Date.now().toString());
        }

        const queryString = params.toString();
        const url = `${BASE_URL}/api/users/${userId}/contact-history${queryString ? `?${queryString}` : ''}`;

        return {
          url,
          credentials: 'include',
        };
      },
      providesTags: (result, error, arg) => [
        'ContactHistory',
        { type: 'ContactHistory', id: arg.userId },
        { type: 'ContactHistory', id: 'LIST' },
      ],
      // Force fresh data for each query
      keepUnusedDataFor: 0,
    }),

    updateContactEntry: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/contact-history/${data.contactId}`,
        method: 'PUT',
        body: {
          notes: data.notes,
          status: data.status,
          contactType: data.contactType,
          duration: data.duration,
          outcome: data.outcome,
          followUpDate: data.followUpDate,
          tags: data.tags
        },
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg.userId },
        'ContactHistory',
        { type: 'ContactHistory', id: arg.userId },
      ],
    }),

    deleteContactEntry: builder.mutation({
      query: ({ userId, contactId }) => ({
        url: `${BASE_URL}/api/users/${userId}/contact-history/${contactId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg.userId },
        'ContactHistory',
        { type: 'ContactHistory', id: arg.userId },
      ],
    }),

    clearContactNotes: builder.mutation({
      query: (userId) => ({
        url: `${BASE_URL}/api/users/${userId}/contact/clear-notes`,
        method: 'POST',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg },
        'ContactHistory',
        { type: 'ContactHistory', id: arg },
      ],
    }),

    getContactFollowUps: builder.query({
      query: () => ({
        url: `${BASE_URL}/api/users/contact-follow-ups`,
        credentials: 'include',
      }),
      providesTags: ['ContactFollowUps'],
    }),
    saveTimeFrameSettings: builder.mutation({
      query: (data) => ({
        url: `${BASE_URL}/api/users/${data.userId}/timeframe`,
        method: 'POST',
        body: {
          startDate: data.startDate,
          duration: data.duration,
          durationType: data.durationType,
          override: data.override,
          notes: data.notes
        },
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'User',
        { type: 'User', id: arg.userId },
        'TimeFrameHistory'
      ],
    }),
    getTimeFrameHistory: builder.query({
      query: (userId) => ({
        url: `${BASE_URL}/api/users/${userId}/timeframe/history`,
        credentials: 'include',
      }),
      providesTags: ['TimeFrameHistory'],
    }),
    getTimeFrameManagement: builder.query({
      query: ({ timeFrameStatus, daysUntilExpiration, lastContactFilter, search, hasWhatsApp, subscriptionType, page, limit, sortBy, sortOrder }) => ({
        url: `${BASE_URL}/api/users/timeframe/management`,
        params: { timeFrameStatus, daysUntilExpiration, lastContactFilter, search, hasWhatsApp, subscriptionType, page, limit, sortBy, sortOrder },
        credentials: 'include',
      }),
      providesTags: ['TimeFrameManagement'],
    }),
    sendWhatsAppContact: builder.mutation({
      query: ({ userId, message, messageTemplate }) => ({
        url: `${BASE_URL}/api/users/${userId}/whatsapp-contact`,
        method: 'POST',
        body: { message, messageTemplate },
        credentials: 'include',
      }),
      invalidatesTags: ['TimeFrameManagement', 'ContactHistory', 'User'],
    }),
    processMessageTemplate: builder.mutation({
      query: ({ template, userIds }) => ({
        url: `${BASE_URL}/api/users/timeframe/process-template`,
        method: 'POST',
        body: { template, userIds },
        credentials: 'include',
      }),
    }),
    cleanupRegularUsers: builder.mutation({
      query: () => ({
        url: `${BASE_URL}/api/users/cleanup-regular-users`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['TimeFrameManagement', 'User'],
    }),

    updateQuizBannerPreference: builder.mutation({
      query: ({ dismissed }) => ({
        url: `${BASE_URL}/api/users/quiz-banner-preference`,
        method: 'PUT',
        body: { dismissed },
        credentials: 'include',
      }),
      // Update auth slice with new preferences
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Update user profile data if needed
          dispatch(setCredentials({ preferences: data.preferences }));
        } catch {
          // Handle error if needed
        }
      },
    }),

    removeAllAssignedCollections: builder.mutation({
      query: (userId) => ({
        url: `${BASE_URL}/api/users/${userId}/assigned-collections/all`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useProfileMutation,
  useRefreshUserDataQuery,
  useGetUsersQuery,
  useGetUserStatsQuery,
  useDeleteUserMutation,
  useGetUserDetailsQuery,
  useUpdateUserMutation,
  useUpdateAccessedCollectionsMutation,
  useAdminAddLockedCollectionMutation,
  useRemoveLockedCollectionMutation,
  useUpdateUserPasswordMutation,
  useGetUserAssignedCollectionsQuery,
  useAssignCollectionToUserMutation,
  useRemoveAssignedCollectionMutation,
  useUpdateAssignedCollectionMutation,
  useBatchAssignCollectionsMutation,
  useTrackCollectionAccessMutation,
  useTrackUserContactMutation,
  useGetUserContactHistoryQuery,
  useUpdateContactEntryMutation,
  useDeleteContactEntryMutation,
  useClearContactNotesMutation,
  useGetContactFollowUpsQuery,
  useSaveTimeFrameSettingsMutation,
  useGetTimeFrameHistoryQuery,
  useGetTimeFrameManagementQuery,
  useSendWhatsAppContactMutation,
  useProcessMessageTemplateMutation,
  useCleanupRegularUsersMutation,
  useAddAdminNoteMutation,
  useDeleteAdminNoteMutation,
  useUpdateQuizBannerPreferenceMutation,
  useRemoveAllAssignedCollectionsMutation,
} = usersApiSlice;
