# MongoDB Timeout Fix - Deployment Commands

# This script contains the commands to deploy the fixed backend to Vercel

Write-Host "🚀 Deploying MongoDB Timeout Fix to Vercel..."
Write-Host ""

# Change to backend directory
Set-Location "D:\Code\pro-g\backend"

# Verify environment variables are set
Write-Host "📋 Checking environment variables..."
if (-not $env:MONGO_URI) {
    Write-Host "⚠️  MONGO_URI not found in local environment" -ForegroundColor Yellow
    Write-Host "   Make sure it's set in Vercel dashboard" -ForegroundColor Yellow
} else {
    Write-Host "✅ MONGO_URI found in local environment" -ForegroundColor Green
}

# Test MongoDB connection before deployment
Write-Host ""
Write-Host "🔍 Testing MongoDB connection..."
try {
    node test-vercel-mongodb.js
    Write-Host "✅ MongoDB connection test passed" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB connection test failed" -ForegroundColor Red
    Write-Host "   Please check your MONGO_URI and network connection" -ForegroundColor Red
    exit 1
}

# Check if files exist
Write-Host ""
Write-Host "📁 Verifying required files..."
$requiredFiles = @(
    "vercel.js",
    "vercel.json", 
    "config/db.js",
    "middleware/dbMiddleware.js",
    "utils/dbOperations.js",
    "controllers/userController.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🌐 Ready to deploy to Vercel!"
Write-Host ""
Write-Host "Run these commands to deploy:"
Write-Host "  1. vercel --prod" -ForegroundColor Cyan
Write-Host "  2. Wait for deployment to complete" -ForegroundColor Cyan
Write-Host "  3. Test the deployed API endpoints" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Monitor these after deployment:"
Write-Host "  - Function logs: vercel logs" -ForegroundColor Yellow
Write-Host "  - MongoDB Atlas metrics" -ForegroundColor Yellow
Write-Host "  - Response times and error rates" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 Test endpoints after deployment:"
Write-Host "  - POST /api/users/auth (login)" -ForegroundColor Magenta
Write-Host "  - POST /api/users (registration)" -ForegroundColor Magenta
Write-Host "  - GET /api/users/profile (user data)" -ForegroundColor Magenta
