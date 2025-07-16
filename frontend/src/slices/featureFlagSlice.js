import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  featureFlags: {
    uploadMealImage: false,
    aiAnalysis: false,
  },
  isLoading: false,
  error: null,
};

const featureFlagSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    setFeatureFlags: (state, action) => {
      state.featureFlags = { ...state.featureFlags, ...action.payload };
      state.error = null;
    },
    setFeatureFlagLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setFeatureFlagError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearFeatureFlags: (state) => {
      state.featureFlags = initialState.featureFlags;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  setFeatureFlags,
  setFeatureFlagLoading,
  setFeatureFlagError,
  clearFeatureFlags,
} = featureFlagSlice.actions;

export default featureFlagSlice.reducer; 