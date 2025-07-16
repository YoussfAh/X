import { SLEEP_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const sleepApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startSleep: builder.mutation({
      query: (data) => ({
        url: `${SLEEP_URL}/start`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SleepEntry', 'CurrentSleep'],
    }),

    endSleep: builder.mutation({
      query: (data) => ({
        url: `${SLEEP_URL}/end`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SleepEntry', 'CurrentSleep'],
    }),

    skipSleepPhase: builder.mutation({
      query: () => ({
        url: `${SLEEP_URL}/skip`,
        method: 'POST',
      }),
      invalidatesTags: ['SleepEntry', 'CurrentSleep'],
    }),

    getCurrentSleep: builder.query({
      query: () => `${SLEEP_URL}/current`,
      providesTags: ['CurrentSleep'],
    }),

    createSleepEntry: builder.mutation({
      query: (data) => ({
        url: SLEEP_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SleepEntry'],
    }),

    getSleepEntries: builder.query({
      query: (params = {}) => ({
        url: SLEEP_URL,
        params,
      }),
      providesTags: ['SleepEntry'],
      keepUnusedDataFor: 5,
    }),

    getSleepEntryById: builder.query({
      query: (id) => ({
        url: `${SLEEP_URL}/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'SleepEntry', id }],
    }),

    updateSleepEntry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${SLEEP_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SleepEntry', id },
        'SleepEntry',
      ],
    }),

    deleteSleepEntry: builder.mutation({
      query: (id) => ({
        url: `${SLEEP_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SleepEntry'],
    }),

    getAdminUserSleepEntries: builder.query({
      query: ({ userId, ...params }) => ({
        url: `${SLEEP_URL}/user/${userId}`,
        params,
      }),
      providesTags: (result, error, { userId }) => [
        { type: 'AdminSleepEntry', id: userId },
      ],
      keepUnusedDataFor: 5,
    }),
  }),
});

export const {
  useStartSleepMutation,
  useEndSleepMutation,
  useSkipSleepPhaseMutation,
  useGetCurrentSleepQuery,
  useCreateSleepEntryMutation,
  useGetSleepEntriesQuery,
  useGetSleepEntryByIdQuery,
  useUpdateSleepEntryMutation,
  useDeleteSleepEntryMutation,
  useGetAdminUserSleepEntriesQuery,
} = sleepApiSlice;
