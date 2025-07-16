# Vercel Deployment Guide for PRO Project

This guide provides step-by-step instructions for deploying both the frontend and backend components of the PRO project on Vercel. It includes required environment variables, configuration settings, and troubleshooting tips.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Variables](#environment-variables)
5. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance and Updates](#maintenance-and-updates)
8. [Environment Variables Checklist for Deployment](#environment-variables-checklist-for-deployment)

## Prerequisites

Before starting the deployment process, ensure you have:

- A [Vercel account](https://vercel.com/signup)
- [GitHub account](https://github.com/) (for repository integration)
- [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (for database hosting)
- [PayPal Developer account](https://developer.paypal.com/) (if using PayPal integration)
- Node.js and npm installed locally

## Backend Deployment

The backend of the PRO project is set up as a serverless Node.js application using Express.

### Step 1: Prepare Your Backend Repository

1. Ensure your backend code is in a Git repository (GitHub, GitLab, or Bitbucket)
2. Verify that the `vercel.json` file is in the root of your backend folder with the following content:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "vercel.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/vercel.js",
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
        "Access-Control-Allow-Credentials": "true"
      }
    }
  ]
}
```

3. Ensure the `vercel.js` entry point file is correctly set up:

```javascript
// vercel.js - Entry point for Vercel serverless deployment
import app from './server.js';

export default app;
```

### Step 2: Deploy Backend to Vercel

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Import your repository from GitHub/GitLab/Bitbucket
4. Select the backend repository
5. Configure the project:
   - Set the "Framework Preset" to "Other"
   - Root Directory: The directory containing your backend code (if not the repository root)
   - Build Command: Leave default (npm build) or set to `npm install`
   - Output Directory: Leave empty
6. Set up the environment variables (see [Environment Variables](#environment-variables) section)
7. Click "Deploy"

## Frontend Deployment

The frontend of the PRO project is a React application built with Create React App.

### Step 1: Prepare Your Frontend Repository

1. Ensure your frontend code is in a Git repository
2. Verify that the `vercel.json` file is in the root of your frontend folder with the following content:

```json
{
  "version": 2,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app"
}
```

### Step 2: Deploy Frontend to Vercel

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Import your repository from GitHub/GitLab/Bitbucket
4. Select the frontend repository
5. Configure the project:
   - Set the "Framework Preset" to "Create React App"
   - Root Directory: The directory containing your frontend code (if not the repository root)
   - Build Command: `npm run build`
   - Output Directory: `build`
6. Set up the environment variables (see [Environment Variables](#environment-variables) section)
7. Click "Deploy"

## Environment Variables

### Backend Environment Variables

Add these environment variables in the Vercel project settings for your backend deployment:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Port for the server (set by Vercel) | `8080` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT token generation | `abc123xyz456` (use a strong random string) |
| `PAYPAL_CLIENT_ID` | PayPal client ID for payment integration | `YOUR_PAYPAL_CLIENT_ID` |
| `FRONTEND_URL` | URL of your frontend deployment | `https://your-frontend-app.vercel.app` |
| `VERCEL` | Flag to indicate Vercel deployment | `1` |
| `JWT_COOKIE_EXPIRE` | JWT cookie expiration in days | `30` |

### Frontend Environment Variables

Add these environment variables in the Vercel project settings for your frontend deployment:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `REACT_APP_API_URL` | URL of your backend API | `https://your-backend-api.vercel.app` |
| `REACT_APP_PAYPAL_CLIENT_ID` | PayPal client ID (same as backend) | `YOUR_PAYPAL_CLIENT_ID` |
| `REACT_APP_IMAGE_URL` | Base URL for image assets | `https://your-backend-api.vercel.app` or a separate CDN URL |

## Connecting Frontend to Backend

To ensure your frontend can communicate with your backend:

1. In the frontend Vercel project, set the `REACT_APP_API_URL` environment variable to your backend's URL
2. In the backend Vercel project, set the `FRONTEND_URL` environment variable to your frontend's URL
3. Make sure all API calls in your frontend code use the `REACT_APP_API_URL` environment variable as the base URL

Example in your frontend code:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Then use API_URL in your fetch/axios calls
```

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Verify that your backend's `FRONTEND_URL` environment variable is correct
2. Check the CORS configuration in `server.js` to ensure your frontend domain is in the whitelist:

```javascript
const whitelist = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://your-frontend-app.vercel.app'
];
```

### MongoDB Connection Issues

If your application can't connect to MongoDB:

1. Verify that the `MONGO_URI` environment variable is correctly set
2. Make sure your IP address is whitelisted in MongoDB Atlas Network Access settings
3. Check if your MongoDB Atlas cluster is operational

### Build Failures

For frontend build failures:

1. Check that all required dependencies are included in `package.json`
2. Verify that the `build` script in `package.json` is working correctly
3. Look for specific error messages in the Vercel deployment logs

### API Connectivity Issues

If the frontend can't communicate with the backend:

1. Verify that `REACT_APP_API_URL` is correctly set in the frontend environment variables
2. Ensure the backend is deployed and running correctly
3. Test API endpoints directly using tools like Postman or cURL

## Maintenance and Updates

### Deploying Updates

Vercel automatically redeploys your application when you push changes to your repository. To update your deployment:

1. Push changes to your repository
2. Vercel will automatically detect changes and start a new deployment
3. Monitor the deployment progress in your Vercel dashboard

### Managing Environment Variables

To update environment variables:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add, edit, or remove environment variables as needed
4. Redeploy your application for changes to take effect

### Monitoring

Monitor your application's performance and errors:

1. Use the Vercel dashboard to view deployment status and logs
2. Set up integration with Sentry or other error monitoring tools
3. Use MongoDB Atlas monitoring for database performance

---

## Additional Notes

- **File Storage**: Vercel has an ephemeral filesystem, meaning files uploaded during runtime won't persist. Consider using cloud storage solutions like Amazon S3 or Cloudinary for file uploads.
- **Serverless Limitations**: Be aware of cold starts and execution time limits of serverless functions. Keep functions lightweight and optimize performance.
- **Database Connections**: Manage MongoDB connections efficiently to avoid connection pool exhaustion in a serverless environment.

## Environment Variables Checklist for Deployment

### Backend Environment Variables Checklist

When deploying your backend to Vercel, add the following environment variables in your Vercel project settings:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://your_mongodb_username:your_password@cluster.mongodb.net/your_database?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_COOKIE_EXPIRE=30
PAYPAL_CLIENT_ID=your_paypal_client_id
FRONTEND_URL=https://your-frontend-domain.vercel.app
VERCEL=1
```

### Frontend Environment Variables Checklist

When deploying your frontend to Vercel, add the following environment variables in your Vercel project settings:

```
REACT_APP_API_URL=https://your-backend-domain.vercel.app
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
REACT_APP_IMAGE_URL=https://your-backend-domain.vercel.app
```

### Important Reminder

1. Replace all placeholder values with your actual credentials
2. Make sure your MongoDB Atlas database connection string is correct and the IP is whitelisted
3. Both frontend and backend must reference each other correctly in their respective environment variables
4. The values must match exactly between environments where they're shared (like the PayPal Client ID)
5. For security, never commit these values to your repository or share them publicly