#!/bin/bash

# Consultflow Frontend Deployment Script
echo "🚀 Deploying Consultflow Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project locally first to catch any errors
echo "🔨 Building project locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌍 Your app should be available at: https://consultflow-front.vercel.app"
        echo "🔄 Seeding database..."
        
        # Wait a bit for deployment to be ready
        sleep 5
        
        # Seed the production database
        curl -X POST https://consultflow-front.vercel.app/api/local/seed
        
        if [ $? -eq 0 ]; then
            echo "✅ Database seeded successfully!"
            echo "🎉 Deployment complete! Your app is ready for testing."
        else
            echo "⚠️  Database seeding failed. You may need to seed manually."
        fi
    else
        echo "❌ Deployment failed. Please check the error messages above."
        exit 1
    fi
else
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi