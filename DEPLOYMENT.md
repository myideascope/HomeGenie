# HomeGenie Full-Stack Deployment Guide

A comprehensive deployment guide for HomeGenie - a React frontend with Go backend monorepo architecture.

## 📁 Project Structure

```
HomeGenie/
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/            # Go backend API server
│   ├── cmd/server/
│   ├── internal/
│   ├── pkg/
│   ├── api/
│   └── go.mod
├── docker-compose.yml  # Full-stack local development
├── Dockerfile.frontend # Frontend container
├── Dockerfile.backend  # Backend container
└── docs/              # Additional documentation
```

## 🚀 Quick Start Options

### Option 1: Separate Service Deployment (Recommended)
Deploy frontend and backend as separate services with independent scaling.

### Option 2: Containerized Full-Stack
Deploy both services together using Docker containers.

### Option 3: Serverless Functions
Deploy backend as serverless functions with static frontend.

---

## 🎯 Option 1: Separate Service Deployment

### Frontend Deployment (Vercel/Netlify)

#### A. Vercel Deployment (Recommended)

**Prerequisites:**
- GitHub repository
- Vercel account

**Steps:**

1. **Configure Frontend Environment:**
   ```bash
   cd frontend/
   cp .env.example .env.production
   ```

   Update `.env.production`:
   ```env
   VITE_API_BASE_URL=https://your-backend-api.herokuapp.com/api/v1
   VITE_WS_BASE_URL=wss://your-backend-api.herokuapp.com/ws
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_WEBSOCKETS=true
   ```

2. **Deploy Frontend to Vercel:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy frontend
   cd frontend/
   vercel --prod
   ```

   **Or via Vercel Dashboard:**
   - Import GitHub repository
   - Set Root Directory: `frontend/`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Configure Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all `VITE_*` variables from your `.env.production`

#### B. Netlify Deployment (Alternative)

```bash
# Build frontend
cd frontend/
npm run build

# Deploy to Netlify
npx netlify-cli deploy --prod --dir=dist
```

### Backend Deployment (Railway/Heroku/DigitalOcean)

#### A. Railway Deployment (Recommended)

**Prerequisites:**
- Railway account
- PostgreSQL database

**Steps:**

1. **Prepare Backend:**
   ```bash
   cd backend/
   
   # Create Railway configuration
   echo 'web: ./bin/server' > Procfile
   ```

2. **Deploy to Railway:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Configure Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="postgres://user:pass@host:port/db"
   railway variables set JWT_SECRET="your-jwt-secret-256-bit"
   railway variables set PORT="8080"
   railway variables set ENVIRONMENT="production"
   railway variables set CORS_ORIGINS="https://your-frontend.vercel.app"
   ```

#### B. Heroku Deployment (Alternative)

```bash
# Create Heroku app
heroku create homegenie-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configure environment
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set ENVIRONMENT="production"
heroku config:set CORS_ORIGINS="https://your-frontend.vercel.app"

# Deploy
git subtree push --prefix=backend heroku main
```

#### C. DigitalOcean App Platform

```yaml
# .do/app.yaml
name: homegenie-backend
services:
- name: api
  source_dir: backend/
  github:
    repo: yourusername/HomeGenie
    branch: main
  run_command: ./bin/server
  environment_slug: go
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    scope: RUN_TIME
    type: SECRET
  - key: JWT_SECRET
    scope: RUN_TIME
    type: SECRET
databases:
- name: homegenie-db
  engine: PG
  version: "13"
```

---

## 🐳 Option 2: Containerized Full-Stack Deployment

### Docker Configuration

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_WS_BASE_URL=${VITE_WS_BASE_URL}

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080
CMD ["./server"]
```

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: homegenie
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgres://postgres:${DB_PASSWORD}@postgres:5432/homegenie?sslmode=disable
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: https://your-domain.com
      ENVIRONMENT: production
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: https://api.your-domain.com/api/v1
        VITE_WS_BASE_URL: wss://api.your-domain.com/ws
    ports:
      - "80:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

### Deploy with Docker Compose

```bash
# Create environment file
echo "DB_PASSWORD=secure_password_here" > .env.prod
echo "JWT_SECRET=your-jwt-secret-256-bit" >> .env.prod

# Deploy stack
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ⚡ Option 3: Serverless Deployment

### Frontend (Static Hosting)

Deploy to Vercel/Netlify as described in Option 1.

### Backend (Serverless Functions)

#### Vercel Functions (Node.js Runtime)

Create API routes in `frontend/api/`:
```javascript
// frontend/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
```

#### AWS Lambda + API Gateway

```bash
# Install Serverless Framework
npm install -g serverless

# Create serverless.yml
cat > backend/serverless.yml << EOF
service: homegenie-backend

provider:
  name: aws
  runtime: go1.x
  region: us-east-1
  environment:
    DATABASE_URL: \${env:DATABASE_URL}
    JWT_SECRET: \${env:JWT_SECRET}

functions:
  api:
    handler: bin/server
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

package:
  exclude:
    - ./**
  include:
    - ./bin/**
EOF

# Deploy
cd backend/
serverless deploy
```

---

## 🔧 Environment Configuration

### Environment Variables

#### Frontend (.env files)
```bash
# Development (.env.local)
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8080/ws
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_WEBSOCKETS=true

# Staging (.env.staging)
VITE_API_BASE_URL=https://staging-api.homegenie.com/api/v1
VITE_WS_BASE_URL=wss://staging-api.homegenie.com/ws
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKETS=true

# Production (.env.production)
VITE_API_BASE_URL=https://api.homegenie.com/api/v1
VITE_WS_BASE_URL=wss://api.homegenie.com/ws
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKETS=true
VITE_SENTRY_DSN=https://your-sentry-dsn
```

#### Backend Environment Variables
```bash
# Database
DATABASE_URL=postgres://user:pass@host:port/database?sslmode=require

# Authentication
JWT_SECRET=your-256-bit-secret-key-change-in-production
JWT_EXPIRATION=24h

# Server
PORT=8080
ENVIRONMENT=production

# Security
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-domain.com

# External Services (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key

# Monitoring
JAEGER_ENDPOINT=https://your-jaeger-instance
SENTRY_DSN=https://your-sentry-dsn

# File Storage
FILE_STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy HomeGenie

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run tests
        run: cd frontend && npm run test
      
      - name: Run linting
        run: cd frontend && npm run lint
      
      - name: Type check
        run: cd frontend && npm run type-check

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v4
        with:
          go-version: '1.22'
      
      - name: Run tests
        run: cd backend && go test ./...
        env:
          DATABASE_URL: postgres://postgres:testpass@localhost:5432/testdb?sslmode=disable
      
      - name: Run linting
        run: cd backend && golangci-lint run

  deploy-frontend:
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend/
          vercel-args: '--prod'

  deploy-backend:
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-deploy@v3
        with:
          railway-token: \${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

### Setup CI/CD Secrets

Add these secrets to your GitHub repository:

```bash
# Repository Settings → Secrets and Variables → Actions

# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Railway/Heroku
RAILWAY_TOKEN=your_railway_token
HEROKU_API_KEY=your_heroku_api_key

# AWS (if using)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

---

## 📊 Monitoring and Observability

### Application Monitoring

#### Frontend Monitoring
```typescript
// Install Sentry for React
npm install @sentry/react @sentry/tracing

// Configure in src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
});
```

#### Backend Monitoring
```go
// The Go backend already includes OpenTelemetry tracing
// Configure additional monitoring:

// Add to main.go
import (
    "github.com/getsentry/sentry-go"
)

func init() {
    sentry.Init(sentry.ClientOptions{
        Dsn: os.Getenv("SENTRY_DSN"),
        Environment: os.Getenv("ENVIRONMENT"),
    })
}
```

### Health Checks

#### Kubernetes Health Checks
```yaml
# k8s/backend-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: homegenie-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: homegenie/backend:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/database
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Uptime Monitoring
```bash
# Add to monitoring service (e.g., Pingdom, UptimeRobot)
Frontend Health: https://your-frontend.com/
Backend Health: https://your-backend.com/health
Database Health: https://your-backend.com/health/database
```

---

## 🔒 Security Configuration

### HTTPS and SSL

#### Vercel/Netlify
- Automatic HTTPS with Let's Encrypt
- HTTP → HTTPS redirects enabled by default

#### Custom Domain SSL
```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Security Headers

#### Frontend (Nginx)
```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Backend Security
```go
// Backend includes CORS, rate limiting, and security middleware
// Additional security headers are automatically added
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. CORS Errors
```bash
# Backend: Update CORS_ORIGINS environment variable
CORS_ORIGINS=https://your-frontend-domain.com

# Check Network tab in browser for blocked requests
```

#### 2. Database Connection Issues
```bash
# Check DATABASE_URL format
postgres://user:password@host:port/database?sslmode=require

# Test connection manually
psql "postgres://user:password@host:port/database"
```

#### 3. Build Failures
```bash
# Frontend build issues
cd frontend/
rm -rf node_modules package-lock.json
npm install
npm run build

# Backend build issues
cd backend/
go mod tidy
go build ./cmd/server
```

#### 4. Environment Variables Not Loading
```bash
# Frontend: Ensure variables start with VITE_
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Backend: Check variable names and values
echo $DATABASE_URL
```

### Debug Mode

#### Frontend Debug
```bash
# Enable debug logging
VITE_ENABLE_API_LOGGING=true npm run dev

# Check browser console and Network tab
```

#### Backend Debug
```bash
# Enable debug logging
ENVIRONMENT=development ./server

# Check server logs
tail -f /var/log/homegenie/server.log
```

---

## 📈 Scaling and Performance

### Frontend Scaling
- **CDN Distribution**: Vercel/Netlify provide global CDN
- **Code Splitting**: Vite automatically splits code
- **Image Optimization**: Use WebP format, lazy loading
- **Bundle Analysis**: `npm run analyze`

### Backend Scaling

#### Horizontal Scaling
```bash
# Docker Compose scaling
docker-compose up -d --scale backend=3

# Kubernetes scaling
kubectl scale deployment homegenie-backend --replicas=5
```

#### Database Scaling
```bash
# Read replicas
DATABASE_READ_URL=postgres://readonly:pass@read-replica:5432/db

# Connection pooling
MAX_DB_CONNECTIONS=25
DB_MAX_IDLE_CONNECTIONS=5
```

#### Caching
```bash
# Redis for session storage and caching
REDIS_URL=redis://localhost:6379

# Database query caching
ENABLE_QUERY_CACHE=true
CACHE_TTL=3600
```

---

## 🎯 Production Checklist

### Pre-Deployment
- ✅ Frontend built and tested locally
- ✅ Backend tests passing
- ✅ Database migrations tested
- ✅ Environment variables configured
- ✅ CORS settings updated for production domains
- ✅ SSL certificates configured
- ✅ Monitoring and error tracking set up
- ✅ CI/CD pipeline tested
- ✅ Security headers configured
- ✅ Performance optimization completed

### Post-Deployment
- ✅ Health checks responding correctly
- ✅ Frontend loading and functional
- ✅ API endpoints responding
- ✅ Database connectivity confirmed
- ✅ User registration/login working
- ✅ WebSocket connections established
- ✅ File uploads functioning
- ✅ Error tracking receiving events
- ✅ Performance monitoring active
- ✅ Backup systems configured

---

## 📞 Support and Resources

### Documentation
- [Frontend API Integration Guide](./API_INTEGRATION.md)
- [Backend API Documentation](./backend/README.md)
- [Database Schema](./backend/pkg/database/migrations.go)

### External Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Go Documentation](https://golang.org/doc)
- [React Documentation](https://reactjs.org/docs)

### Getting Help
1. Check the troubleshooting section above
2. Review application logs
3. Test with a minimal reproduction case
4. Check GitHub Issues for similar problems

---

## 🚀 Quick Deployment Commands

```bash
# Full local development
docker-compose up -d

# Frontend only (development)
cd frontend && npm run dev

# Backend only (development)
cd backend && go run ./cmd/server

# Production deployment (separate services)
cd frontend && vercel --prod
cd backend && railway up

# Full stack deployment (Docker)
docker-compose -f docker-compose.prod.yml up -d

# Health checks
curl https://your-frontend.com/
curl https://your-backend.com/health
```

Choose the deployment strategy that best fits your infrastructure needs, team expertise, and scaling requirements. Start with separate service deployment (Option 1) for simplicity, then consider containerized deployment (Option 2) as you scale.