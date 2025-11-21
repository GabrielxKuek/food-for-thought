#!/bin/bash

# 🚀 Food for Thought - Vercel Deployment Script
# This script prepares and deploys your app to Vercel

set -e  # Exit on error

echo "🚀 Food for Thought - Vercel Deployment"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Are you in the project root?"
    exit 1
fi

# Check if client folder exists
if [ ! -d "client" ]; then
    echo "❌ Error: client folder not found"
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Test build locally first
echo "📦 Testing local build..."
cd client

if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

echo "🔨 Building React app..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
else
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
fi

cd ..
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "🌐 Deploying to Vercel..."
echo ""
echo "⚠️  Make sure you've set environment variables in Vercel dashboard:"
echo "   - REACT_APP_API_URL"
echo ""
read -p "Press Enter to continue with deployment..."

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test your deployment URL"
echo "   2. Check all routes work (no 404s)"
echo "   3. Test heart rate graph in Demo Mode"
echo "   4. Set up custom domain (optional)"
echo ""
echo "🎉 Your app is live!"
