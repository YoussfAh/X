import { apiSlice } from './apiSlice.js';

const NUTRITION_URL = '/api/nutrition';

export const nutritionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    analyzeNutrition: builder.mutation({
      query: (data) => ({
        url: `${NUTRITION_URL}/analyze`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useAnalyzeNutritionMutation } = nutritionApiSlice;
