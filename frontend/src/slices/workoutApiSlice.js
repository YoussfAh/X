import { apiSlice } from './apiSlice';

const WORKOUT_URL = '/api/workout';

export const workoutApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addWorkoutEntry: builder.mutation({
      query: (data) => ({
        url: WORKOUT_URL,
        method: 'POST',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'WorkoutEntries',
        { type: 'WorkoutEntries', id: arg.productId },
        'UserWorkoutEntries',
        'AllWorkoutEntries'
      ],
    }),
    getMyWorkoutEntries: builder.query({
      query: () => ({
        url: WORKOUT_URL,
        credentials: 'include',
      }),
      keepUnusedDataFor: 5,
      providesTags: ['WorkoutEntries'],
    }),
    getWorkoutEntriesByProduct: builder.query({
      query: (productId) => ({
        url: `${WORKOUT_URL}/product/${productId}`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 5,
      providesTags: (result, error, productId) => [
        { type: 'WorkoutEntries', id: productId }
      ],
    }),
    getWorkoutEntryDetails: builder.query({
      query: (id) => ({
        url: `${WORKOUT_URL}/${id}`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 5,
      providesTags: (result, error, id) => [
        { type: 'WorkoutEntry', id }
      ],
    }),
    updateWorkoutEntry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${WORKOUT_URL}/${id}`,
        method: 'PUT',
        body: data,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, arg) => [
        'WorkoutEntries',
        { type: 'WorkoutEntries', id: arg.productId },
        'UserWorkoutEntries',
        'AllWorkoutEntries'
      ],
    }),
    deleteWorkoutEntry: builder.mutation({
      query: (id) => ({
        url: `${WORKOUT_URL}/${id}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['WorkoutEntries', 'UserWorkoutEntries', 'AllWorkoutEntries'],
    }),
    getUserWorkoutEntries: builder.query({
      query: (userId) => ({
        url: `${WORKOUT_URL}/user/${userId}`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 60, // Keep data in cache longer (60 seconds)
      providesTags: (result, error, userId) =>
        result
          ? [
            ...result.map(({ _id }) => ({ type: 'UserWorkoutEntries', id: _id })),
            { type: 'UserWorkoutEntries', id: userId },
            'UserWorkoutEntries'
          ]
          : [{ type: 'UserWorkoutEntries', id: userId }, 'UserWorkoutEntries'],
    }),
    getAdminUserWorkoutEntries: builder.query({
      query: (userId) => ({
        url: `${WORKOUT_URL}/admin/user/${userId}`,
        credentials: 'include',
      }),
      keepUnusedDataFor: 60, // Keep data in cache longer (60 seconds)
      providesTags: (result, error, userId) =>
        result
          ? [
            ...result.map(({ _id }) => ({ type: 'AdminUserWorkoutEntries', id: _id })),
            { type: 'AdminUserWorkoutEntries', id: userId },
            'AdminUserWorkoutEntries'
          ]
          : [{ type: 'AdminUserWorkoutEntries', id: userId }, 'AdminUserWorkoutEntries'],
    }),
    getAllWorkoutEntries: builder.query({
      query: ({ pageNumber = 1, keyword = '', user = '', product = '' }) => ({
        url: `${WORKOUT_URL}/admin/all`,
        params: { pageNumber, keyword, user, product },
        credentials: 'include',
      }),
      keepUnusedDataFor: 5,
      providesTags: ['AllWorkoutEntries'],
    }),
  }),
});

export const {
  useAddWorkoutEntryMutation,
  useGetMyWorkoutEntriesQuery,
  useGetWorkoutEntriesByProductQuery,
  useGetWorkoutEntryDetailsQuery,
  useUpdateWorkoutEntryMutation,
  useDeleteWorkoutEntryMutation,
  useGetUserWorkoutEntriesQuery,
  useGetAdminUserWorkoutEntriesQuery,
  useGetAllWorkoutEntriesQuery,
} = workoutApiSlice;
