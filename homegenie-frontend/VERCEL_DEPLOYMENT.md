# Deploy HomeGenie to Vercel - Step-by-Step Guide

This guide will walk you through deploying your HomeGenie frontend to Vercel using GitHub integration.

## 🚀 Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub

```bash
# If you haven't already, initialize git and push to GitHub
cd /path/to/homegenie-frontend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial HomeGenie frontend deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/homegenie-frontend.git

# Push to GitHub
git push -u origin main
```

### 1.2 Verify Repository Structure

Make sure your repository has these key files:
- `package.json` ✅
- `vite.config.ts` ✅
- `vercel.json` ✅
- `src/` directory with React app ✅
- `.env.example` ✅

## 🔗 Step 2: Set Up Vercel Account

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended for seamless integration)
4. Authorize Vercel to access your GitHub account

### 2.2 Install Vercel CLI (Optional but Recommended)

```bash
# Install globally
npm install -g vercel

# Login to your account
vercel login
```

## 📱 Step 3: Deploy from GitHub Repository

### 3.1 Import Project from GitHub

1. **In Vercel Dashboard:**
   - Click **"New Project"**
   - You'll see your GitHub repositories listed
   - Find **"homegenie-frontend"** and click **"Import"**

2. **Configure Project:**
   ```
   Project Name: homegenie-frontend
   Framework Preset: Vite (should auto-detect)
   Root Directory: ./ (leave as default)
   ```

3. **Build Settings (Auto-detected):**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

### 3.2 Set Environment Variables

**Before deploying, configure your environment variables:**

1. **In the Vercel import screen, expand "Environment Variables"**
2. **Add these variables:**

```bash
# Required - Replace with your actual backend URLs
VITE_API_BASE_URL=https://your-backend-api.com/api/v1
VITE_WS_BASE_URL=wss://your-backend-api.com/ws

# Optional but recommended
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKETS=true
VITE_ENABLE_FILE_UPLOAD=true

# Optional - Add these if you have the services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
VITE_ANALYTICS_TRACKING_ID=your_analytics_id_here
VITE_SENTRY_DSN=your_sentry_dsn_here
```

**📝 Note:** If you don't have a backend yet, use these placeholder values:
```bash
VITE_API_BASE_URL=https://api.homegenie.demo/api/v1
VITE_WS_BASE_URL=wss://api.homegenie.demo/ws
VITE_MOCK_API=true
```

### 3.3 Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Build your React app
   - Deploy to a global CDN
   - Provide you with a URL

⏱️ **Deployment typically takes 1-3 minutes**

## ✅ Step 4: Verify Deployment

### 4.1 Check Deployment Status

1. **View Deployment:**
   - Vercel will show real-time build logs
   - Look for "Build Completed" message
   - Note any warnings or errors

2. **Test Your Application:**
   - Click the generated URL (e.g., `homegenie-frontend-abc123.vercel.app`)
   - Test basic functionality:
     - Navigation works
     - Components load
     - No console errors

### 4.2 Common Issues and Fixes

**Issue: Build Fails**
```bash
# Check the build logs in Vercel dashboard
# Common fixes:
- Ensure all dependencies are in package.json
- Check for TypeScript errors
- Verify environment variables are set correctly
```

**Issue: App Loads but API Calls Fail**
```bash
# Check browser console for CORS or network errors
# Verify VITE_API_BASE_URL is correct
# Check if your backend allows requests from Vercel domain
```

## 🌐 Step 5: Configure Custom Domain (Optional)

### 5.1 Add Custom Domain

1. **In Vercel Project Dashboard:**
   - Go to **Settings** → **Domains**
   - Click **"Add Domain"**
   - Enter your domain (e.g., `homegenie.yourdomain.com`)

2. **Configure DNS:**
   
   **Option A: Use Vercel Nameservers (Recommended)**
   ```
   Update your domain's nameservers to:
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

   **Option B: Use CNAME Record**
   ```
   Type: CNAME
   Name: homegenie (or @)
   Value: cname.vercel-dns.com
   ```

### 5.2 Enable HTTPS

- Vercel automatically provisions SSL certificates
- HTTPS will be active within 24 hours
- Automatic HTTP → HTTPS redirects are enabled

## ⚙️ Step 6: Set Up Automatic Deployments

### 6.1 Configure GitHub Integration

This is automatically set up, but verify:

1. **Go to Settings → Git**
2. **Verify:**
   ```
   Production Branch: main (or master)
   Preview Branches: All branches
   ```

3. **Test Automatic Deployment:**
   ```bash
   # Make a small change and push
   echo "# HomeGenie Frontend" > README.md
   git add README.md
   git commit -m "Add README"
   git push origin main
   ```

   - Vercel will automatically trigger a new deployment
   - Check the Deployments tab to see the progress

### 6.2 Preview Deployments

- Every pull request gets its own preview URL
- Perfect for testing changes before merging
- Comments are automatically added to PRs with preview links

## 📊 Step 7: Monitor and Optimize

### 7.1 Monitor Performance

1. **Vercel Analytics (Free):**
   - Go to **Analytics** tab in your project
   - Monitor Core Web Vitals
   - Track page views and performance

2. **Enable Speed Insights:**
   ```bash
   # Add to your project
   npm install @vercel/speed-insights
   ```

   ```typescript
   // Add to src/main.tsx
   import { SpeedInsights } from '@vercel/speed-insights/react';
   
   // Add to your app
   <SpeedInsights />
   ```

### 7.2 Optimize Build

1. **Check Bundle Size:**
   - Vercel shows bundle analysis after each build
   - Look for large dependencies that can be optimized

2. **Enable Edge Functions (if needed):**
   - For API routes or middleware
   - Configure in `vercel.json`

## 🔧 Step 8: Advanced Configuration

### 8.1 Environment-Specific Deployments

Create separate Vercel projects for staging:

1. **Create staging branch:**
   ```bash
   git checkout -b staging
   git push origin staging
   ```

2. **Deploy staging project:**
   - Import repository again
   - Use staging environment variables
   - Deploy from `staging` branch

### 8.2 Custom Build Configuration

Update `vercel.json` for advanced configs:

```json
{
  "buildCommand": "npm run build:production",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

## 🎯 Step 9: Production Checklist

Before going live, verify:

- ✅ Custom domain configured and working
- ✅ HTTPS enabled and redirecting
- ✅ Environment variables set correctly
- ✅ Backend API accessible from frontend
- ✅ CORS configured on backend for your domain
- ✅ Error tracking configured (Sentry)
- ✅ Analytics set up (Google Analytics)
- ✅ Performance monitoring active

## 📞 Troubleshooting

### Common Deployment Issues

**1. Build Timeout:**
```bash
# Optimize your build process
# Remove unused dependencies
# Use Vercel Pro for longer build times
```

**2. Environment Variables Not Working:**
```bash
# Ensure they start with VITE_
# Redeploy after adding new variables
# Check they're set in Vercel dashboard
```

**3. API CORS Issues:**
```bash
# Configure your backend to allow your Vercel domain
# Add https://your-app.vercel.app to CORS origins
```

**4. Large Bundle Size:**
```bash
# Use dynamic imports for large components
# Enable code splitting in Vite config
# Remove unused dependencies
```

## 🚀 Success! Your App is Live

Your HomeGenie frontend is now deployed on Vercel with:

- ⚡ Global CDN distribution
- 🔄 Automatic deployments from GitHub
- 📱 Preview deployments for PRs
- 📊 Built-in analytics and monitoring
- 🔒 Automatic HTTPS and security headers
- 🌍 Edge functions and global optimization

**Next Steps:**
1. Share your app URL with users
2. Set up your backend API
3. Configure monitoring and error tracking
4. Plan your scaling and feature roadmap

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Deploy manually (if needed)
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Set environment variable
vercel env add VITE_API_BASE_URL

# Pull environment variables locally
vercel env pull .env.local
```

**Your app is now live at:** `https://your-app.vercel.app` 🎉