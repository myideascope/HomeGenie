# DigitalOcean App Platform Deployment

This directory contains configuration for deploying HomeGenie to DigitalOcean's App Platform.

## Architecture

The deployment creates:

- **Backend Service** - Go API server with auto-scaling
- **Frontend Service** - React application served via nginx
- **Managed Database** - PostgreSQL with automated backups
- **Background Workers** - For async job processing
- **Pre-deploy Jobs** - Database migrations
- **Load Balancer** - Automatic HTTPS and traffic distribution
- **Monitoring** - Built-in metrics and alerts

## Prerequisites

1. **DigitalOcean Account** with App Platform access
2. **GitHub Repository** with your HomeGenie code
3. **doctl CLI** (optional, for command-line deployment)

## Quick Start

### Method 1: Web Interface (Recommended)

1. **Go to DigitalOcean Apps:** https://cloud.digitalocean.com/apps
2. **Create App** → **GitHub** → Select your repository
3. **Upload app.yaml** or configure manually
4. **Set environment variables** (see Configuration section)
5. **Deploy**

### Method 2: Command Line (doctl)

```bash
# Install doctl
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.98.0/doctl-1.98.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init

# Deploy app
doctl apps create --spec deploy/digitalocean/app.yaml
```

### Method 3: Terraform (with DO Provider)

```hcl
resource "digitalocean_app" "homegenie" {
  spec {
    name   = "homegenie"
    region = "nyc"

    service {
      name = "backend"
      
      git {
        repo_clone_url = "https://github.com/your-username/homegenie.git"
        branch         = "main"
      }
      
      source_dir     = "/backend"
      http_port      = 8080
      instance_count = 2
      instance_size_slug = "basic-xxs"
      
      env_var {
        key   = "API_PORT"
        value = "8080"
      }
      
      env_var {
        key   = "JWT_SECRET"
        value = var.jwt_secret
        type  = "SECRET"
      }
    }
    
    database {
      name    = "homegenie-db"
      engine  = "PG"
      version = "15"
      size    = "db-s-1vcpu-1gb"
    }
  }
}
```

## Configuration

### Required Environment Variables

Set these as **encrypted environment variables** in the App Platform:

```bash
# Database (auto-populated by managed database)
DATABASE_URL=postgresql://user:pass@host:port/db

# Application secrets
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
DB_PASSWORD=your-database-password

# Optional: External services
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### App Configuration

Edit `app.yaml` to customize:

```yaml
# Resource allocation
services:
  - name: backend
    instance_count: 2
    instance_size_slug: basic-xs  # 1 vCPU, 1 GB RAM

# Database sizing
databases:
  - name: homegenie-db
    size: db-s-2vcpu-2gb  # 2 vCPU, 2 GB RAM, 25 GB disk
```

### Instance Sizes

| Size | vCPUs | RAM | Price/month |
|------|-------|-----|-------------|
| basic-xxs | 0.5 | 0.5 GB | $5 |
| basic-xs | 1 | 1 GB | $10 |
| basic-s | 1 | 2 GB | $20 |
| basic-m | 2 | 4 GB | $40 |

## Deployment Process

### 1. Repository Setup

Your repository structure should match:

```
├── backend/
│   ├── cmd/
│   │   ├── api/      # Main API server
│   │   ├── worker/   # Background worker
│   │   └── migrate/  # Database migrations
│   ├── Dockerfile    # Optional
│   └── go.mod
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── nginx.conf    # Custom nginx config
└── deploy/
    └── digitalocean/
        └── app.yaml
```

### 2. Build Configuration

#### Backend Build

The app.yaml specifies:

```yaml
build_command: |
  go mod download
  CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

run_command: ./main
```

#### Frontend Build

```yaml
build_command: |
  npm ci
  npm run build

# Serve with nginx
run_command: |
  cp -r dist/* /var/www/html/
  nginx -g 'daemon off;'
```

### 3. Database Setup

The managed PostgreSQL database provides:

- **Automated backups** (7-day retention)
- **High availability** with standby nodes
- **Connection pooling** with PgBouncer
- **SSL encryption** in transit
- **Monitoring and alerts**

### 4. Pre-deploy Migration

Database migrations run automatically before each deployment:

```yaml
jobs:
  - name: migrate
    kind: PRE_DEPLOY
    run_command: ./migrate
```

## Custom Domains

### 1. Add Domain in App Platform

```bash
# Via doctl
doctl apps create-domain <app-id> --domain homegenie.yourdomain.com

# Via web interface
# Go to Settings → Domains → Add Domain
```

### 2. Configure DNS

Point your domain to the App Platform:

```
Type: CNAME
Name: homegenie (or @)
Value: homegenie-abc123.ondigitalocean.app
```

### 3. SSL Certificates

SSL certificates are automatically provisioned and renewed.

## Monitoring and Logs

### Application Logs

```bash
# View logs via doctl
doctl apps logs <app-id> --component backend --follow

# Or view in web interface
# Go to Runtime Logs tab
```

### Metrics and Alerts

Built-in monitoring includes:

- **CPU and memory usage**
- **Request count and latency**
- **Error rates**
- **Database performance**

Configure alerts in `app.yaml`:

```yaml
alerts:
  - rule: CPU_UTILIZATION
    operator: GREATER_THAN
    value: 80
    window: FIVE_MINUTES
```

### Custom Metrics

Add metrics to your Go application:

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests.",
        },
        []string{"method", "endpoint", "status"},
    )
)

func init() {
    prometheus.MustRegister(requestsTotal)
}

// In your handler
requestsTotal.WithLabelValues(method, endpoint, status).Inc()

// Expose metrics endpoint
http.Handle("/metrics", promhttp.Handler())
```

## Scaling

### Horizontal Scaling

```yaml
services:
  - name: backend
    instance_count: 3        # Fixed scaling
    
    # Or auto-scaling (coming soon)
    autoscaling:
      min_instance_count: 2
      max_instance_count: 10
      metrics:
        cpu_percent: 70
```

### Vertical Scaling

```yaml
services:
  - name: backend
    instance_size_slug: basic-m  # 2 vCPU, 4 GB RAM
```

### Database Scaling

```bash
# Scale database via doctl
doctl databases resize <database-id> --size db-s-4vcpu-8gb

# Or via web interface
# Go to Databases → Your DB → Settings → Resize
```

## Environment Management

### Multiple Environments

Create separate apps for different environments:

```bash
# Production
doctl apps create --spec app.yaml

# Staging  
doctl apps create --spec app-staging.yaml
```

### Environment-specific Configuration

```yaml
# app-staging.yaml
name: homegenie-staging
envs:
  - key: ENVIRONMENT
    value: staging
services:
  - name: backend
    instance_count: 1  # Fewer resources for staging
    instance_size_slug: basic-xxs
```

## Security

### Environment Variables

Store sensitive data as encrypted environment variables:

```bash
# Set via doctl
doctl apps update <app-id> --spec app.yaml

# Or via web interface
# Go to Settings → Environment Variables
# Select "Encrypt" for sensitive values
```

### Network Security

- **Automatic HTTPS** with Let's Encrypt
- **DDoS protection** included
- **WAF rules** available (enterprise)
- **VPC support** (enterprise)

### Database Security

- **SSL/TLS encryption** in transit
- **Encrypted backups**
- **IP whitelisting** available
- **User access control**

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      
      - name: Deploy to App Platform
        run: doctl apps create --spec deploy/digitalocean/app.yaml --upsert
```

### Automatic Deployments

Enable auto-deploy in `app.yaml`:

```yaml
services:
  - name: backend
    github:
      repo: your-username/homegenie
      branch: main
      deploy_on_push: true
```

## Cost Optimization

### Development Environment

```yaml
# Minimal setup for development
services:
  - name: backend
    instance_count: 1
    instance_size_slug: basic-xxs  # $5/month

databases:
  - name: homegenie-db
    size: db-s-1vcpu-1gb          # $15/month
```

### Production Optimization

- **Right-size instances** based on metrics
- **Use static sites** for frontend when possible
- **Optimize database** with appropriate sizing
- **Monitor costs** in billing dashboard

### Cost Breakdown

| Component | Size | Monthly Cost |
|-----------|------|--------------|
| Backend (2x basic-xs) | 1 vCPU, 1 GB | $20 |
| Frontend (1x basic-xxs) | 0.5 vCPU, 0.5 GB | $5 |
| Database (db-s-1vcpu-1gb) | 1 vCPU, 1 GB | $15 |
| **Total** | | **$40** |

## Troubleshooting

### Common Issues

1. **Build failures:**
```bash
# Check build logs
doctl apps logs <app-id> --component backend --type build

# Common fixes:
# - Check go.mod dependencies
# - Verify build command
# - Check source directory path
```

2. **Runtime errors:**
```bash
# Check runtime logs
doctl apps logs <app-id> --component backend --type run --follow

# Common fixes:
# - Verify environment variables
# - Check database connectivity
# - Review error messages
```

3. **Database connection issues:**
```bash
# Check database status
doctl databases list
doctl databases get <database-id>

# Verify connection string format
# postgresql://user:pass@host:25060/db?sslmode=require
```

### Debug Commands

```bash
# Get app info
doctl apps get <app-id>

# List all apps
doctl apps list

# Get deployment history
doctl apps list-deployments <app-id>

# Check app health
doctl apps get <app-id> --format json | jq '.spec.services[].health_check'
```

### Health Checks

Configure proper health checks:

```yaml
services:
  - name: backend
    health_check:
      http_path: /health
      initial_delay_seconds: 10
      period_seconds: 30
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
```

Implement health endpoint:

```go
func healthHandler(w http.ResponseWriter, r *http.Request) {
    // Check database connectivity
    err := db.Ping()
    if err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        json.NewEncoder(w).Encode(map[string]string{
            "status": "unhealthy",
            "error":  err.Error(),
        })
        return
    }
    
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "healthy",
    })
}
```

## Backup and Recovery

### Database Backups

- **Automatic daily backups** with 7-day retention
- **Point-in-time recovery** available
- **Manual backups** before major deployments

```bash
# Create manual backup
doctl databases backups create <database-id>

# List backups
doctl databases backups list <database-id>

# Restore from backup
doctl databases restore <database-id> <backup-id>
```

### Application State

- **Stateless application** design
- **Configuration in environment variables**
- **File uploads** should use object storage (Spaces)

## Migration from Other Platforms

### From Heroku

1. **Export environment variables**
2. **Update database connection format**
3. **Adapt Procfile to app.yaml**
4. **Configure build commands**

### From AWS/GCP

1. **Containerize if needed**
2. **Update environment variables**
3. **Configure managed database**
4. **Set up monitoring**

## Support

- **DigitalOcean Documentation:** https://docs.digitalocean.com/products/app-platform/
- **Community Forum:** https://www.digitalocean.com/community/
- **Support Tickets:** Available with paid plans
- **Status Page:** https://status.digitalocean.com/

## Limitations

- **No custom Docker images** (uses buildpacks)
- **Limited background job options**
- **No VPC** in basic plans
- **Regional availability** varies
- **No auto-scaling** (coming soon)

## Best Practices

1. **Use managed database** for production
2. **Set up proper health checks**
3. **Monitor resource usage**
4. **Use environment variables** for configuration
5. **Enable automatic deployments**
6. **Set up alerts** for critical metrics
7. **Regular backup testing**
8. **Security updates** via automated deployments