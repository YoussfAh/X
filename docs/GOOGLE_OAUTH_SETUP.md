# Google OAuth Login Setup Guide

## Overview
This guide explains how to set up Google OAuth login for your GrindX application, which is deployed on Vercel.

## Google Console Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**

### 2. Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: **GrindX**
   - User support email: Your email
   - Developer contact information: Your email
4. Add authorized domains (for production):
   - `your-frontend-domain.vercel.app`
   - `your-backend-domain.vercel.app`

### 3. Create OAuth 2.0 Client ID

1. Application type: **Web application**
2. Name: **GrindX Web Client**
3. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-frontend-domain.vercel.app` (production)
4. Authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://your-frontend-domain.vercel.app` (production)

## Environment Variables

### Backend (.env)
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-frontend-domain.vercel.app

# Other existing variables...
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (.env)
```env
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Other existing variables...
REACT_APP_API_URL=https://your-backend-domain.vercel.app
```

## Vercel Deployment Configuration

### Backend Environment Variables in Vercel
Add these environment variables in your Vercel backend project settings:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `FRONTEND_URL`

### Frontend Environment Variables in Vercel
Add these environment variables in your Vercel frontend project settings:
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_API_URL`

## Implementation Features

### ✅ What's Implemented

1. **Seamless Integration**: Google login works alongside existing email/password authentication
2. **Account Linking**: If a user signs up with email/password and later uses Google with the same email, the accounts are automatically linked
3. **Security**: All existing security features (device tracking, session management, etc.) work with Google OAuth
4. **User Experience**: Same JWT token system, same user permissions, same UI flow
5. **Vercel Compatible**: All code is optimized for Vercel serverless deployment

### 🔒 Security Features Maintained

- Device ID tracking
- Session management
- JWT tokens with session validation
- Login attempt limiting
- IP tracking
- Admin/user role management

### 📱 User Experience

- Google login button appears on login screen
- One-click authentication
- Automatic account creation or linking
- Same redirect behavior as regular login
- Error handling for various scenarios

## Testing

### Development Testing
1. Set up environment variables in `.env` files
2. Start backend: `npm run dev`
3. Start frontend: `npm start`
4. Navigate to login page
5. Click "Continue with Google"

### Production Testing
1. Deploy both frontend and backend to Vercel
2. Set environment variables in Vercel dashboard
3. Test Google login on production URLs
4. Verify user creation and login flow

## Troubleshooting

### Common Issues

1. **"Invalid Client" Error**
   - Check that your Google Client ID is correct
   - Verify authorized domains in Google Console
   - Ensure environment variables are set correctly

2. **CORS Errors**
   - Verify authorized JavaScript origins in Google Console
   - Check that frontend URL is in backend CORS configuration

3. **Token Verification Failed**
   - Ensure Google Client Secret is correct on backend
   - Check that Google+ API is enabled
   - Verify internet connection for token verification

4. **Vercel Deployment Issues**
   - Ensure all environment variables are set in Vercel dashboard
   - Check that API routes are working correctly
   - Verify that both frontend and backend are deployed

### Debug Steps

1. Check browser console for JavaScript errors
2. Check backend logs for authentication errors
3. Verify Google Console configuration
4. Test API endpoints directly
5. Ensure environment variables are loaded correctly

## API Endpoints

### New Google Authentication Endpoint
- **POST** `/api/users/auth/google`
- **Body**: `{ "idToken": "google-id-token" }`
- **Headers**: `{ "x-device-id": "device-id" }`
- **Response**: Same as regular login endpoint

## Database Changes

### User Model Updates
- Added `googleId` field (optional, unique)
- Added `authProvider` field (enum: 'local', 'google')
- Modified password requirement (not required for Google users)

## File Changes Summary

### Backend Files Modified/Added
- `backend/config/googleAuth.js` (new)
- `backend/controllers/userController.js` (modified)
- `backend/routes/userRoutes.js` (modified)
- `backend/models/userModel.js` (modified)
- `backend/package.json` (modified)

### Frontend Files Modified/Added
- `frontend/src/components/GoogleLoginButton.jsx` (new)
- `frontend/src/screens/LoginScreen.jsx` (modified)
- `frontend/src/slices/usersApiSlice.js` (modified)
- `frontend/public/index.html` (modified)
- `frontend/package.json` (modified)

## Support

For any issues with Google OAuth implementation:
1. Check this documentation first
2. Verify Google Console configuration
3. Check environment variables
4. Review browser console and backend logs
5. Test with  three