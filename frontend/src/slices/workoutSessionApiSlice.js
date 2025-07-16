import { apiSlice } from './apiSlice';

const WORKOUT_SESSION_URL = '/api/workout-sessions';

export const workoutSessionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createWorkoutSession: builder.mutation({
      query: (data) => ({
        url: WORKOUT_SESSION_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        'WorkoutSessions',
        'ActiveSession',
        'WorkoutEntries'
      ],
    }),
    getActiveSession: builder.query({
      query: () => ({
        url: `${WORKOUT_SESSION_URL}/active`,
      }),
      providesTags: ['ActiveSession'],
    }),
    getWorkoutSessions: builder.query({
      query: ({ page = 1, limit = 20, type, status, startDate, endDate } = {}) => ({
        url: `${WORKOUT_SESSION_URL}?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}${status ? `&status=${status}` : ''}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`,
      }),
      providesTags: (result) =>
        result?.sessions
          ? [
              ...result.sessions.map(({ _id }) => ({ type: 'WorkoutSession', id: _id })),
              'WorkoutSessions',
            ]
          : ['WorkoutSessions'],
    }),
    getWorkoutSessionById: builder.query({
      query: (id) => ({
        url: `${WORKOUT_SESSION_URL}/${id}`,
      }),
      providesTags: (result, error, id) => [
        { type: 'WorkoutSession', id },
      ],
    }),
    updateWorkoutSession: builder.mutation({
      query: ({ id, data }) => ({
        url: `${WORKOUT_SESSION_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [
        'WorkoutSessions',
        'ActiveSession',
        { type: 'WorkoutSession', id: (arg) => arg.id },
      ],
    }),
    deleteWorkoutSession: builder.mutation({
      query: (id) => ({
        url: `${WORKOUT_SESSION_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        'WorkoutSessions',
        'ActiveSession',
        'WorkoutEntries'
      ],
    }),
    autoGroupExercises: builder.mutation({
      query: (data = {}) => ({
        url: `${WORKOUT_SESSION_URL}/auto-group`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        'WorkoutSessions',
        'WorkoutEntries'
      ],
    }),
    completeWorkoutSession: builder.mutation({
      query: ({ id, data }) => ({
        url: `${WORKOUT_SESSION_URL}/${id}`,
        method: 'PUT',
        body: { ...data, status: 'completed', endTime: new Date() },
      }),
      invalidatesTags: [
        'WorkoutSessions',
        'ActiveSession',
        { type: 'WorkoutSession', id: (arg) => arg.id },
      ],
    }),
    pauseWorkoutSession: builder.mutation({
      query: (id) => ({
        url: `${WORKOUT_SESSION_URL}/${id}`,
        method: 'PUT',
        body: { status: 'paused' },
      }),
      invalidatesTags: (result, error, id) => [
        'WorkoutSessions',
        'ActiveSession',
        { type: 'WorkoutSession', id },
      ],
    }),
    resumeWorkoutSession: builder.mutation({
      query: (id) => ({
        url: `${WORKOUT_SESSION_URL}/${id}`,
        method: 'PUT',
        body: { status: 'active' },
      }),
      invalidatesTags: (result, error, id) => [
        'WorkoutSessions',
        'ActiveSession',
        { type: 'WorkoutSession', id },
      ],
    }),
  }),
});

export const {
  useCreateWorkoutSessionMutation,
  useGetActiveSessionQuery,
  useGetWorkoutSessionsQuery,
  useGetWorkoutSessionByIdQuery,
  useUpdateWorkoutSessionMutation,
  useDeleteWorkoutSessionMutation,
  useAutoGroupExercisesMutation,
  useCompleteWorkoutSessionMutation,
  usePauseWorkoutSessionMutation,
  useResumeWorkoutSessionMutation,
} = workoutSessionApiSlice; 