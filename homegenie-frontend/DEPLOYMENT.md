# HomeGenie Frontend Deployment Guide

This guide covers multiple deployment options for the HomeGenie React frontend, from simple cloud platforms to enterprise-grade infrastructure.

## 📋 Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- Git repository setup
- Backend API running (optional for static deployment)

## 🚀 Quick Start

### 1. Development Setup

```bash
# Clone and setup the project
git clone <your-repo-url>
cd homegenie-frontend

# Run the automated setup script
./scripts/dev-setup.sh

# Or manually:
npm install
cp .env.example .env.local
# Edit .env.local with your backend URLs
npm run dev
```

### 2. Build for Production

```bash
# Standard production build
npm run build

# Environment-specific builds
npm run build:staging
npm run build:production
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for React Apps)

**Pros:** Zero-config, automatic deployments, great performance, free tier
**Best for:** React applications, quick deployments, prototypes

#### Automatic Deployment (Recommended)

1. **Connect GitHub Repository:**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect React and configure build settings

3. **Configure Environment Variables:**
   In Vercel dashboard → Project → Settings → Environment Variables:
   ```
   VITE_API_BASE_URL=https://your-api.com/api/v1
   VITE_WS_BASE_URL=wss://your-api.com/ws
   VITE_ENABLE_ANALYTICS=true
   ```

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run deploy:vercel

# Deploy staging
npm run deploy:vercel:staging
```

#### Custom Domain Setup

1. **Add Domain in Vercel:**
   - Project → Settings → Domains
   - Add your custom domain

2. **Configure DNS:**
   - Point your domain to Vercel's nameservers
   - Or add CNAME record: `your-domain.com` → `cname.vercel-dns.com`

### Option 2: Netlify

**Pros:** Great for static sites, form handling, edge functions, generous free tier
**Best for:** Static sites, jamstack applications, simple deployments

#### Automatic Deployment

1. **Connect Repository:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings:**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables:**
   Site settings → Environment variables:
   ```
   VITE_API_BASE_URL=https://your-api.com/api/v1
   VITE_WS_BASE_URL=wss://your-api.com/ws
   ```

#### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
npm run deploy:netlify
```

### Option 3: AWS S3 + CloudFront

**Pros:** Enterprise-grade, highly scalable, cost-effective for large traffic
**Best for:** Production applications, enterprise deployments, high traffic

#### Prerequisites

```bash
# Install AWS CLI
pip install awscli
# or
brew install awscli

# Configure AWS credentials
aws configure
```

#### Setup Infrastructure

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://homegenie-frontend-prod
   aws s3 website s3://homegenie-frontend-prod --index-document index.html --error-document index.html
   ```

2. **Create CloudFront Distribution:**
   ```bash
   # Use AWS Console or CloudFormation
   # Point origin to S3 bucket
   # Configure custom error pages for SPA routing
   ```

3. **Configure Environment Variables:**
   ```bash
   export AWS_S3_BUCKET=homegenie-frontend-prod
   export AWS_CLOUDFRONT_DISTRIBUTION_ID=ABCDEFGHIJKLMN
   ```

#### Deploy

```bash
npm run deploy:aws
```

### Option 4: Docker Deployment

**Pros:** Consistent environments, container orchestration, self-hosted
**Best for:** Self-hosted deployments, Kubernetes, enterprise infrastructure

#### Build and Run Locally

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Access at http://localhost
```

#### Production Docker Deployment

```bash
# Build with environment variables
docker build \
  --build-arg VITE_API_BASE_URL=https://your-api.com/api/v1 \
  --build-arg VITE_WS_BASE_URL=wss://your-api.com/ws \
  -t homegenie-frontend:prod .

# Run in production
docker run -d \
  -p 80:80 \
  --name homegenie-frontend \
  --restart unless-stopped \
  homegenie-frontend:prod
```

#### Docker Compose (with Backend)

```bash
# Start full stack
docker-compose up -d

# Scale frontend
docker-compose up -d --scale frontend=3
```

### Option 5: Traditional VPS/Server

**Pros:** Full control, cost-effective, custom configurations
**Best for:** Self-hosted, custom infrastructure, learning

#### Setup Nginx Server

1. **Install Dependencies:**
   ```bash
   # On Ubuntu/Debian
   sudo apt update
   sudo apt install nginx nodejs npm
   ```

2. **Build and Deploy:**
   ```bash
   # On your server
   git clone <your-repo>
   cd homegenie-frontend
   npm install
   npm run build
   
   # Copy to nginx
   sudo cp -r dist/* /var/www/html/
   ```

3. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html;
       index index.html;
       
       # Handle client-side routing
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # API proxy (optional)
       location /api/ {
           proxy_pass http://your-backend:8080/api/v1/;
       }
   }
   ```

## 🔧 Environment Configuration

### Environment Files

Create environment-specific configuration files:

- `.env.local` - Local development (git-ignored)
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Required Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://your-api.com/api/v1
VITE_WS_BASE_URL=wss://your-api.com/ws

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKETS=true

# External Services (optional)
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ANALYTICS_TRACKING_ID=your_analytics_id
```

### Platform-Specific Setup

#### Vercel
- Environment variables in dashboard
- Automatic HTTPS
- Global CDN included

#### Netlify
- Environment variables in site settings
- Custom redirects in `netlify.toml`
- Form handling available

#### AWS
- Environment variables in build process
- Separate CDN setup required
- Custom domain certificate needed

#### Docker
- Environment variables in build args
- Reverse proxy configuration
- Container orchestration setup

## 🔄 CI/CD Pipeline

### GitHub Actions (Included)

The project includes a comprehensive CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
# - Runs tests and linting
# - Builds for staging/production
# - Deploys to multiple platforms
# - Sends deployment notifications
```

### Setup Steps

1. **Configure Secrets:**
   Go to GitHub repository → Settings → Secrets:
   ```
   VERCEL_TOKEN=your_vercel_token
   NETLIFY_AUTH_TOKEN=your_netlify_token
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   ```

2. **Configure Variables:**
   Repository → Settings → Variables:
   ```
   VITE_API_BASE_URL=https://your-api.com/api/v1
   VITE_WS_BASE_URL=wss://your-api.com/ws
   ```

3. **Trigger Deployment:**
   ```bash
   git push origin main  # Deploys to production
   # Pull requests deploy to staging preview
   ```

## 🏥 Health Monitoring

### Health Check Endpoints

```bash
# Application health
curl https://your-domain.com/health

# API connectivity (if proxied)
curl https://your-domain.com/api/health
```

### Monitoring Setup

1. **Uptime Monitoring:**
   - Use services like Pingdom, UptimeRobot
   - Monitor both frontend and API endpoints

2. **Error Tracking:**
   ```bash
   # Configure Sentry
   VITE_SENTRY_DSN=your_sentry_dsn
   ```

3. **Analytics:**
   ```bash
   # Configure Google Analytics
   VITE_ANALYTICS_TRACKING_ID=your_tracking_id
   ```

## 🔒 Security Best Practices

### HTTPS Setup

1. **Vercel/Netlify:** Automatic HTTPS
2. **AWS CloudFront:** Configure SSL certificate
3. **Docker/VPS:** Use Let's Encrypt or reverse proxy

### Security Headers

The project includes security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Environment Security

```bash
# Never commit sensitive data
echo ".env.local" >> .gitignore

# Use platform-specific secret management
# Vercel: Environment Variables
# AWS: Secrets Manager
# Docker: Docker Secrets
```

## 📊 Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run analyze

# Production build with optimizations
npm run build:production
```

### CDN Configuration

1. **Static Assets:** Long cache headers (1 year)
2. **HTML Files:** No cache
3. **API Responses:** Appropriate cache headers

### Performance Monitoring

```bash
# Lighthouse CI in GitHub Actions
# Web Vitals monitoring
# Bundle size tracking
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Clear cache and rebuild
   npm run clean
   npm install
   npm run build
   ```

2. **Environment Variables Not Loading:**
   ```bash
   # Check variable names start with VITE_
   # Verify platform-specific configuration
   ```

3. **API Connection Issues:**
   ```bash
   # Check CORS configuration
   # Verify API URL accessibility
   # Check network/firewall settings
   ```

4. **Routing Issues (404 on refresh):**
   ```bash
   # Configure SPA fallback
   # Update server/platform configuration
   ```

### Debug Mode

```bash
# Enable debug logging
VITE_ENABLE_API_LOGGING=true npm run dev

# Check browser network tab
# Review deployment platform logs
```

## 📞 Support

### Deployment Support

- **Vercel:** [Documentation](https://vercel.com/docs)
- **Netlify:** [Documentation](https://docs.netlify.com)
- **AWS:** [Documentation](https://docs.aws.amazon.com)
- **Docker:** [Documentation](https://docs.docker.com)

### Project Support

- Check GitHub Issues
- Review API Integration documentation
- Test with development backend

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring and alerts**
2. **Configure custom domain**
3. **Set up staging environment**
4. **Implement backup strategy**
5. **Configure user analytics**
6. **Set up error tracking**
7. **Plan scaling strategy**

---

## Quick Reference Commands

```bash
# Development
npm run dev-setup        # Complete development setup
npm run dev              # Start development server

# Building
npm run build            # Production build
npm run build:staging    # Staging build

# Deployment
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:netlify   # Deploy to Netlify
npm run deploy:aws       # Deploy to AWS
npm run deploy:docker    # Docker deployment

# Maintenance
npm run clean            # Clean build artifacts
npm run analyze          # Analyze bundle size
npm run type-check       # TypeScript validation
```

Choose the deployment option that best fits your infrastructure, team expertise, and scalability requirements. Start with Vercel or Netlify for simplicity, then consider AWS or Docker for more advanced needs.