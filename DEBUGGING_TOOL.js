/*
🔧 DEBUGGING TOOL - Add this temporarily to any React component to debug
Copy and paste this code into any component (like App.js) to see what's happening
*/

useEffect(() => {
  console.log('🔍 DEBUGGING INFORMATION:');
  console.log('📍 Current URL:', window.location.href);
  console.log('🌐 API URL:', process.env.REACT_APP_API_URL);
  console.log('⚙️ Environment:', process.env.NODE_ENV);
  console.log('🏗️ All env vars:', {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_NAME: process.env.REACT_APP_NAME,
    REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    NODE_ENV: process.env.NODE_ENV,
  });

  // Test API connection
  if (process.env.REACT_APP_API_URL) {
    console.log('✅ API URL is set, testing connection...');
    fetch(process.env.REACT_APP_API_URL + '/api/users/profile', {
      credentials: 'include',
    })
      .then((response) => {
        console.log('🌐 API Response Status:', response.status);
        if (response.ok) {
          console.log('✅ Backend connection successful!');
        } else {
          console.log('⚠️ Backend responded but with error status');
        }
      })
      .catch((error) => {
        console.log('❌ Backend connection failed:', error.message);
      });
  } else {
    console.log(
      '❌ REACT_APP_API_URL is not set! This will cause white screen.'
    );
  }
}, []);

/*
📋 WHAT TO LOOK FOR IN CONSOLE:
✅ Good: "API URL: https://pro-g-git-main-yousseefahs-projects.vercel.app"
❌ Bad: "API URL: undefined" or "API URL: null"

✅ Good: "Environment: production"
❌ Bad: "Environment: development" (on live site)

✅ Good: "Backend connection successful!"
❌ Bad: "Backend connection failed" or CORS errors
*/
