import { EXERCISES_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const exercisesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getExercises: builder.query({
            query: ({ keyword, pageNumber }) => ({
                url: EXERCISES_URL,
                params: { keyword, pageNumber },
            }),
            keepUnusedDataFor: 5,
            providesTags: ['Exercises'],
        }),
        getExerciseDetails: builder.query({
            query: (exerciseId) => ({
                url: `${EXERCISES_URL}/${exerciseId}`,
            }),
            keepUnusedDataFor: 5,
        }),
        createExercise: builder.mutation({
            query: () => ({
                url: `${EXERCISES_URL}`,
                method: 'POST',
            }),
            invalidatesTags: ['Exercise'],
        }),
        updateExercise: builder.mutation({
            query: (data) => ({
                url: `${EXERCISES_URL}/${data.exerciseId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Exercises'],
        }),
        uploadExerciseImage: builder.mutation({
            query: (data) => ({
                url: `/api/upload`,
                method: 'POST',
                body: data,
            }),
        }),
        deleteExercise: builder.mutation({
            query: (exerciseId) => ({
                url: `${EXERCISES_URL}/${exerciseId}`,
                method: 'DELETE',
            }),
            providesTags: ['Exercise'],
        }),
        createReview: builder.mutation({
            query: (data) => ({
                url: `${EXERCISES_URL}/${data.exerciseId}/reviews`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Exercise'],
        }),
        getTopExercises: builder.query({
            query: () => `${EXERCISES_URL}/top`,
            keepUnusedDataFor: 5,
        }),
        getWorkoutExercises: builder.query({
            query: () => ({
                url: `${EXERCISES_URL}/category/fitness`,
            }),
            keepUnusedDataFor: 5,
            providesTags: ['WorkoutExercises'],
        }),
    }),
});

export const {
    useGetExercisesQuery,
    useGetExerciseDetailsQuery,
    useCreateExerciseMutation,
    useUpdateExerciseMutation,
    useUploadExerciseImageMutation,
    useDeleteExerciseMutation,
    useCreateReviewMutation,
    useGetTopExercisesQuery,
    useGetWorkoutExercisesQuery,
} = exercisesApiSlice; 