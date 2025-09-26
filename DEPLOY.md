# Quick Deployment Guide 🚀

This is a quick reference for deploying Consultflow to Vercel.

## One-Command Deployment

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Deploy to Vercel
./deploy.sh
```

## Manual Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your repository
4. Vercel will auto-detect Next.js settings

### 3. Set Environment Variables
In Vercel dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_DATA_SOURCE = localDb
NEXT_PUBLIC_LOCAL_API_BASE_URL = https://your-project.vercel.app/api/local
LOCAL_SQLITE_PATH = /tmp/consultflow.db
NEXT_PUBLIC_DEBUG_API = false
```

### 4. Initialize Database
After deployment:
```bash
curl -X POST https://your-project.vercel.app/api/local/seed
```

## Testing Checklist ✅

- [ ] Dashboard loads with KPIs
- [ ] Company switching works
- [ ] Charts render properly
- [ ] Reports page shows data
- [ ] Feedback button works
- [ ] FX rates display correctly
- [ ] PWA installs on mobile

## Your Live App

Once deployed, your app will be available at:
**https://consultflow-front.vercel.app**

---

For detailed instructions, see [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)