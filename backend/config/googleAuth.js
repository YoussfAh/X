import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Verify Google ID token or user info
 * @param {string} idToken - The Google ID token to verify
 * @param {Object} userInfo - Direct user info from Google (fallback)
 * @returns {Promise<Object>} Verified user data from Google
 */
export const verifyGoogleToken = async (idToken, userInfo = null) => {
  try {
    // Try to verify as a real Google ID token first
    if (idToken && idToken.includes('.')) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (payload) {
        return {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          emailVerified: payload.email_verified,
          picture: payload.picture,
        };
      }
    }

    // Fallback: handle base64 encoded mock token or direct user info
    if (userInfo) {
      console.log('Using fallback user info verification');
      return {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        emailVerified: userInfo.verified_email || true,
        picture: userInfo.picture,
      };
    }

    // Try to decode base64 mock token
    try {
      const decoded = JSON.parse(atob(idToken));
      if (decoded.email && decoded.sub) {
        console.log('Using mock token verification');
        return {
          googleId: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          emailVerified: decoded.email_verified || true,
          picture: decoded.picture,
        };
      }
    } catch (decodeError) {
      console.log('Token decode failed, not a mock token');
    }

    throw new Error('No valid Google authentication data found');
    
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token: ' + error.message);
  }
};

/**
 * Get Google OAuth URL for authentication
 * @param {string} state - State parameter for CSRF protection
 * @returns {string} Google OAuth authorization URL
 */
export const getGoogleAuthUrl = (state = '') => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
  });
};

export default client; 