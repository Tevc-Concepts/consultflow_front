# Consultflow Frontend - Vercel Deployment Guide

This guide will help you deploy your Consultflow frontend to Vercel for public testing.

## 📋 Prerequisites

- Vercel account (free tier works perfectly)
- GitHub repository with your code
- Node.js 18+ locally for testing

## 🚀 Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has these files:
- ✅ `package.json` - Already configured
- ✅ `next.config.js` - PWA configuration ready
- ✅ `.env.example` - Environment template

### 2. Environment Configuration

Create/update your environment variables for production:

#### Production Environment Variables (.env.production):
```bash
# Data source for production
NEXT_PUBLIC_DATA_SOURCE=localDb

# Production API base URL (will be your Vercel domain)
NEXT_PUBLIC_LOCAL_API_BASE_URL=https://your-app-name.vercel.app/api/local

# SQLite database path (server-side)
LOCAL_SQLITE_PATH=/tmp/consultflow.db

# Disable debug in production
NEXT_PUBLIC_DEBUG_API=false
```

### 3. Create Vercel Configuration

Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "name": "consultflow-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "LOCAL_SQLITE_PATH": "/tmp/consultflow.db"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "regions": ["iad1"]
}
```

### 4. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Configure build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install`

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: consultflow-frontend
# - Directory: ./
# - Override settings? No
```

### 5. Configure Environment Variables in Vercel

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
NEXT_PUBLIC_DATA_SOURCE = localDb
NEXT_PUBLIC_LOCAL_API_BASE_URL = https://your-project.vercel.app/api/local
LOCAL_SQLITE_PATH = /tmp/consultflow.db
NEXT_PUBLIC_DEBUG_API = false
```

### 6. Database Initialization

Your app includes a seed endpoint. After deployment:

```bash
# Seed the production database
curl -X POST https://your-project.vercel.app/api/local/seed
```

## ⚙️ Vercel-Specific Optimizations

### 1. Update next.config.js for Vercel

Add Vercel-specific configurations:

```javascript
const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    buildExcludes: [/middleware-manifest\.json$/],
    fallbacks: {
        document: '/offline.html'
    }
});

/** @type {import('next').NextConfig} */
const config = {
    images: {
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: 'localhost' },
            // Add your Vercel domain
            { protocol: 'https', hostname: '*.vercel.app' }
        ]
    },
    // Vercel optimizations
    experimental: {
        serverComponentsExternalPackages: ['better-sqlite3'],
    },
    // Ensure SQLite works in serverless
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push('better-sqlite3');
        }
        return config;
    }
};

module.exports = withPWA(config);
```

### 2. Handle SQLite in Serverless Environment

Update your database initialization to handle Vercel's serverless environment:

```typescript
// In your localDb.ts file
function getDB() {
    const dbPath = process.env.LOCAL_SQLITE_PATH || '.data/consultflow.db';
    
    // Ensure directory exists in serverless environment
    if (process.env.VERCEL) {
        const fs = require('fs');
        const path = require('path');
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    // Continue with existing database logic...
}
```

## 🔧 Testing Your Deployment

### 1. Core Functionality Tests

After deployment, test these URLs:

```bash
# Health check
https://your-project.vercel.app/api/local/companies

# Seed database
https://your-project.vercel.app/api/local/seed

# Main application
https://your-project.vercel.app/dashboard
```

### 2. Performance Verification

- ✅ PWA functionality (offline mode)
- ✅ API response times
- ✅ Chart rendering
- ✅ Company data switching
- ✅ FX rate management
- ✅ Feedback.fish integration

## 🌐 Production Checklist

### Before Going Live:
- [ ] Environment variables configured
- [ ] Database seeded with sample data
- [ ] All API endpoints working
- [ ] Charts rendering properly
- [ ] Responsive design on mobile
- [ ] PWA installation working
- [ ] Feedback widget functional

### Performance Optimizations:
- [ ] Images optimized (Sharp already included)
- [ ] Bundle size analyzed
- [ ] API caching configured
- [ ] PWA caching working

## 🔒 Security Considerations

1. **Environment Variables**: Never commit real .env files
2. **API Rate Limiting**: Consider adding rate limiting to API routes
3. **CORS**: Configure proper CORS for production
4. **Database**: SQLite is reset on each deployment (expected for demo)

## 📊 Monitoring

### Vercel Analytics
1. Enable Vercel Analytics in your project settings
2. Monitor performance metrics
3. Track user engagement

### Error Monitoring
Consider adding error tracking:
```bash
npm install @vercel/analytics
```

## 🚨 Common Issues & Solutions

### Issue 1: SQLite Database Resets
**Solution**: This is expected in serverless. For persistence, consider:
- Vercel KV for key-value data
- External database for production

### Issue 2: Build Timeouts
**Solution**: 
- Optimize bundle size
- Remove unnecessary dependencies
- Use dynamic imports for heavy components

### Issue 3: API Routes 404
**Solution**: Ensure `vercel.json` routing is correct

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Test API endpoints individually
3. Verify environment variables
4. Use feedback widget for user reports

---

**Your Consultflow app is now ready for public testing on Vercel!** 🎉

Visit your deployed app at: `https://your-project.vercel.app`