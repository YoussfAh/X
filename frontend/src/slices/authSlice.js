import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null,
  sessionId: localStorage.getItem('sessionId') || null,
  deviceId: localStorage.getItem('deviceId') || generateDeviceId(),
};

// Generate a unique ID for this device/browser
function generateDeviceId() {
  const deviceId = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
  localStorage.setItem('deviceId', deviceId);
  return deviceId;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      // Store the session ID if provided in the payload
      if (action.payload.sessionId) {
        state.sessionId = action.payload.sessionId;
        localStorage.setItem('sessionId', action.payload.sessionId);
      }
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    updateUserData: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
      localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
    },
    updateSessionId: (state, action) => {
      state.sessionId = action.payload;
      localStorage.setItem('sessionId', action.payload);
    },
    logout: (state, action) => {
      state.userInfo = null;
      state.sessionId = null;
      // Remove user info from storage
      localStorage.removeItem('userInfo');
      localStorage.removeItem('sessionId');
      // Keep the device ID for analytics purposes
    },
  },
});

export const { setCredentials, updateUserData, updateSessionId, logout } = authSlice.actions;

export default authSlice.reducer;
