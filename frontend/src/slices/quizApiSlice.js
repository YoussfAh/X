import { apiSlice } from './apiSlice';
import { QUIZ_URL } from '../constants';

export const quizApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // CRUD for Quizzes
    createQuiz: builder.mutation({
      query: (data) => ({
        url: QUIZ_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }],
    }),
    getQuizzes: builder.query({
      query: () => ({
        url: QUIZ_URL,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Quiz', id: _id })),
              { type: 'Quiz', id: 'LIST' },
            ]
          : [{ type: 'Quiz', id: 'LIST' }],
      keepUnusedDataFor: 5,
    }),
    getQuizById: builder.query({
      query: (id) => ({
        url: `${QUIZ_URL}/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Quiz', id }],
      keepUnusedDataFor: 5,
    }),
    updateQuiz: builder.mutation({
      query: (data) => ({
        url: `${QUIZ_URL}/${data._id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { _id }) => [{ type: 'Quiz', id: _id }],
    }),
    deleteQuiz: builder.mutation({
      query: (id) => ({
        url: `${QUIZ_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'LIST' },
      ],
    }),

    // User-facing quiz actions
    getActiveQuizForUser: builder.query({
      query: () => ({
        url: `${QUIZ_URL}/active`,
      }),
      providesTags: ['ActiveQuiz'],
    }),
    submitQuizAnswers: builder.mutation({
      query: ({ quizId, answers }) => ({
        url: `${QUIZ_URL}/submit`,
        method: 'POST',
        body: { quizId, answers },
      }),
      invalidatesTags: ['ActiveQuiz', 'QuizResults'], // Invalidate active quiz and results
    }),
    getUserQuizResults: builder.query({
      query: (userId) => ({
        url: `${QUIZ_URL}/results/${userId}`,
      }),
      providesTags: (result, error, userId) => [
        { type: 'QuizResults', id: userId },
      ],
    }),

    assignQuizToUser: builder.mutation({
      query: ({ userId, quizId }) => ({
        url: `${QUIZ_URL}/assign/${userId}/${quizId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        'ActiveQuiz', // Invalidate active quiz cache so new quizzes show up
      ],
    }),

    unassignQuizFromUser: builder.mutation({
      query: ({ userId, quizId }) => ({
        url: quizId
          ? `${QUIZ_URL}/unassign/${userId}/${quizId}`
          : `${QUIZ_URL}/unassign/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'FutureQuizAssignments', id: userId },
        'ActiveQuiz', // Invalidate active quiz cache so removed quizzes don't show up
      ],
    }),

    // Future quiz assignments
    getFutureQuizAssignments: builder.query({
      query: (userId) => ({
        url: `${QUIZ_URL}/future-assignments/${userId}`,
      }),
      providesTags: (result, error, userId) => [
        { type: 'FutureQuizAssignments', id: userId },
      ],
    }),

    removeFutureQuizAssignment: builder.mutation({
      query: ({ userId, quizId }) => ({
        url: `${QUIZ_URL}/future-assignments/${userId}/${quizId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'FutureQuizAssignments', id: userId },
        { type: 'User', id: userId },
      ],
    }),
  }),
});

export const {
  useCreateQuizMutation,
  useGetQuizzesQuery,
  useGetQuizByIdQuery,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useGetActiveQuizForUserQuery,
  useSubmitQuizAnswersMutation,
  useGetUserQuizResultsQuery,
  useAssignQuizToUserMutation,
  useUnassignQuizFromUserMutation,
  useGetFutureQuizAssignmentsQuery,
  useRemoveFutureQuizAssignmentMutation,
} = quizApiSlice;

// Export aliases for compatibility
export const useGetQuizQuery = useGetQuizByIdQuery;
export const useGetQuizAnswersQuery = useGetUserQuizResultsQuery;
