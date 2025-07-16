#!/bin/bash

# Pro-G Vercel Deployment Script
# This script helps deploy your Pro-G application to Vercel

echo "🚀 Pro-G Vercel Deployment Script"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Build frontend
echo "🔨 Building frontend..."
npm run build:frontend

# Check if build was successful
if [ ! -d "frontend/build" ]; then
    echo "❌ Frontend build failed. Please check for errors."
    exit 1
fi

echo "✅ Build completed successfully!"

# Ask for deployment type
echo ""
echo "Choose deployment type:"
echo "1) Production deployment"
echo "2) Preview deployment"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    2)
        echo "🔍 Creating preview deployment..."
        vercel
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo "📝 Don't forget to:"
echo "   - Set environment variables in Vercel dashboard"
echo "   - Configure your custom domain if needed"
echo "   - Test the deployed application" 