# Google Cloud Deployment

This directory contains configurations for deploying HomeGenie to Google Cloud using Cloud Run and Cloud SQL.

## Architecture

The deployment creates:

- **Cloud Run** services for backend and frontend
- **Cloud SQL** PostgreSQL database with private networking
- **VPC** with private service connection
- **Secret Manager** for sensitive configuration
- **Cloud Build** for CI/CD automation
- **Load Balancer** (optional) for custom domains
- **Monitoring and Logging** with Cloud Operations

## Prerequisites

1. **Google Cloud SDK** installed and configured
2. **Terraform** >= 1.0 installed
3. **Docker** for building images
4. **Google Cloud Project** with billing enabled

### Required APIs

The following APIs will be enabled automatically:
- Cloud Run API
- Cloud SQL Admin API
- Service Networking API
- VPC Access API
- Cloud Build API
- Container Registry API
- Secret Manager API
- Cloud Logging API
- Cloud Monitoring API

## Quick Start

### 1. Configure Project

```bash
# Set your project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Enable required APIs (optional - Terraform does this)
gcloud services enable run.googleapis.com sqladmin.googleapis.com
```

### 2. Configure Terraform

```bash
cd deploy/gcp/terraform

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

### 3. Build and Deploy with Cloud Build

```bash
# Submit build to Cloud Build
gcloud builds submit --config=deploy/gcp/cloudbuild.yaml .
```

## Configuration

### Required Variables

Edit `terraform.tfvars`:

```hcl
# Your Google Cloud project ID
project_id = "your-gcp-project-id"

# Strong database password
db_password = "your-super-secure-password"

# JWT secret (minimum 32 characters)
jwt_secret = "your-super-secret-jwt-key-minimum-32-characters"

# Container images
backend_image = "gcr.io/your-gcp-project-id/homegenie-backend"
frontend_image = "gcr.io/your-gcp-project-id/homegenie-frontend"
```

### Optional Customization

```hcl
# Instance sizes
db_instance_class = "db-custom-2-4096"  # 2 vCPU, 4GB RAM
backend_cpu = "2000m"
backend_memory = "4Gi"

# Scaling
backend_max_instances = 100
frontend_max_instances = 50

# Load balancer with custom domain
enable_load_balancer = true
domain_name = "homegenie.yourdomain.com"
```

## Container Images

### Building Images

Create Dockerfiles for your applications:

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates curl
WORKDIR /root/

COPY --from=builder /app/main .
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./main"]
```

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

#### Frontend nginx.conf

```nginx
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass $REACT_APP_API_URL/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Manual Build and Push

```bash
# Build images
docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/homegenie-backend:latest ./backend
docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/homegenie-frontend:latest ./frontend

# Push to Container Registry
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/homegenie-backend:latest
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/homegenie-frontend:latest
```

## Deployment Methods

### Method 1: Terraform Only

Deploy infrastructure and then update Cloud Run services:

```bash
# Deploy infrastructure
terraform apply

# Get database IP
DB_HOST=$(terraform output -raw database_private_ip)

# Deploy backend
gcloud run deploy homegenie-backend \
  --image=gcr.io/$GOOGLE_CLOUD_PROJECT/homegenie-backend:latest \
  --region=us-central1 \
  --vpc-connector=homegenie-connector \
  --vpc-egress=private-ranges-only \
  --set-env-vars="DB_HOST=$DB_HOST" \
  --set-secrets="DB_PASSWORD=homegenie-db-password:latest"

# Deploy frontend
gcloud run deploy homegenie-frontend \
  --image=gcr.io/$GOOGLE_CLOUD_PROJECT/homegenie-frontend:latest \
  --region=us-central1
```

### Method 2: Cloud Build (Recommended)

Set up automated CI/CD:

```bash
# Create build trigger
gcloud builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=deploy/gcp/cloudbuild.yaml

# Or submit build manually
gcloud builds submit --config=deploy/gcp/cloudbuild.yaml .
```

## Database Setup

### Initial Schema Migration

After deployment, run database migrations:

```bash
# Get backend service URL
BACKEND_URL=$(gcloud run services describe homegenie-backend \
  --region=us-central1 --format='value(status.url)')

# Run migrations via API endpoint
curl -X POST "$BACKEND_URL/admin/migrate"

# Or run migration job manually
gcloud run jobs create homegenie-migrate \
  --image=gcr.io/$GOOGLE_CLOUD_PROJECT/homegenie-backend:latest \
  --region=us-central1 \
  --vpc-connector=homegenie-connector \
  --set-secrets="DB_PASSWORD=homegenie-db-password:latest" \
  --args="migrate"

gcloud run jobs execute homegenie-migrate --region=us-central1
```

### Database Connection

The database is configured with:
- **Private IP** access only
- **VPC peering** for Cloud Run connectivity
- **Automated backups** with point-in-time recovery
- **SSL/TLS** encryption in transit

Connection string format:
```
postgresql://homegenie:PASSWORD@PRIVATE_IP:5432/homegenie
```

## Monitoring and Logging

### Cloud Logging

View application logs:

```bash
# Backend logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=homegenie-backend" --limit=50

# Frontend logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=homegenie-frontend" --limit=50

# Database logs
gcloud logs read "resource.type=cloudsql_database AND resource.labels.database_id=$PROJECT_ID:homegenie-db" --limit=50
```

### Cloud Monitoring

Access metrics at: https://console.cloud.google.com/monitoring

Key metrics to monitor:
- **Request count and latency**
- **Error rates**
- **Memory and CPU usage**
- **Database connections**
- **Cold start frequency**

### Custom Dashboards

Create monitoring dashboards:

```bash
# View Cloud Run metrics
gcloud logging metrics list --filter="name:cloud_run"

# Create custom metric
gcloud logging metrics create homegenie_errors \
  --description="HomeGenie application errors" \
  --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR'
```

## Scaling

### Automatic Scaling

Cloud Run automatically scales based on:
- **Request volume**
- **CPU utilization**
- **Memory usage**
- **Concurrency**

Configure scaling:

```bash
# Update scaling settings
gcloud run services update homegenie-backend \
  --region=us-central1 \
  --min-instances=2 \
  --max-instances=100 \
  --concurrency=80 \
  --cpu=2 \
  --memory=4Gi
```

### Database Scaling

```bash
# Scale database vertically
gcloud sql instances patch homegenie-db \
  --tier=db-custom-4-8192

# Enable read replicas
gcloud sql instances create homegenie-db-replica \
  --master-instance-name=homegenie-db \
  --region=us-east1
```

## Security

### Network Security

- **Private VPC** for database connectivity
- **VPC connectors** for secure egress
- **Private Google Access** enabled
- **Cloud Armor** (optional) for DDoS protection

### Secrets Management

All secrets are stored in Secret Manager:

```bash
# View secrets
gcloud secrets list

# Update secret
echo "new-password" | gcloud secrets versions add homegenie-db-password --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding homegenie-db-password \
  --member="serviceAccount:homegenie-cloudrun-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### IAM Best Practices

- **Least privilege** service accounts
- **Workload Identity** for GKE (if applicable)
- **Binary Authorization** for container security
- **VPC firewall rules** for network security

## SSL/HTTPS Setup

### Custom Domain with Load Balancer

1. **Set up domain verification:**
```bash
gcloud domains verify yourdomain.com
```

2. **Enable load balancer in Terraform:**
```hcl
enable_load_balancer = true
domain_name = "homegenie.yourdomain.com"
```

3. **Apply changes:**
```bash
terraform apply
```

4. **Update DNS records:**
```bash
# Get load balancer IP
LB_IP=$(terraform output -raw load_balancer_ip)

# Create DNS A record pointing to $LB_IP
```

### Cloud Run Custom Domain (Alternative)

```bash
# Map custom domain to Cloud Run
gcloud run domain-mappings create \
  --service=homegenie-frontend \
  --domain=homegenie.yourdomain.com \
  --region=us-central1
```

## Disaster Recovery

### Database Backups

- **Automated daily backups**
- **Point-in-time recovery** (up to 7 days)
- **Cross-region backup replication**

```bash
# Create manual backup
gcloud sql backups create --instance=homegenie-db \
  --description="Manual backup before deployment"

# Restore from backup
gcloud sql backups restore BACKUP_ID --restore-instance=homegenie-db
```

### Application Recovery

```bash
# Rollback to previous revision
gcloud run services update-traffic homegenie-backend \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1
```

## Cost Optimization

### Development Environment

```hcl
# Minimal resources for development
db_instance_class = "db-f1-micro"
backend_cpu = "1000m"
backend_memory = "1Gi"
backend_min_instances = 0  # Scale to zero
enable_load_balancer = false
```

### Production Optimization

- **Use committed use discounts**
- **Right-size instances** based on metrics
- **Enable preemptible instances** where possible
- **Set up billing alerts**

```bash
# Set billing budget
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="HomeGenie Budget" \
  --budget-amount=100USD
```

## Troubleshooting

### Common Issues

1. **Service not accessible:**
```bash
# Check service status
gcloud run services describe homegenie-backend --region=us-central1

# Check logs
gcloud logs read "resource.type=cloud_run_revision" --limit=10
```

2. **Database connection issues:**
```bash
# Test VPC connectivity
gcloud compute ssh test-vm --zone=us-central1-a --command="nc -zv DB_PRIVATE_IP 5432"

# Check VPC connector
gcloud compute networks vpc-access connectors describe homegenie-connector --region=us-central1
```

3. **Build failures:**
```bash
# Check build logs
gcloud builds log BUILD_ID

# Verify Cloud Build service account permissions
gcloud projects get-iam-policy $PROJECT_ID
```

### Debug Commands

```bash
# Check service account permissions
gcloud iam service-accounts get-iam-policy \
  homegenie-cloudrun-sa@$PROJECT_ID.iam.gserviceaccount.com

# Test secret access
gcloud secrets versions access latest --secret=homegenie-db-password

# Monitor real-time logs
gcloud logs tail "resource.type=cloud_run_revision" --buffer-window=5s
```

## CI/CD Pipeline

### GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Google Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Submit to Cloud Build
        run: gcloud builds submit --config=deploy/gcp/cloudbuild.yaml .
```

### Automated Testing

Add testing steps to `cloudbuild.yaml`:

```yaml
- name: 'golang:1.21'
  entrypoint: 'bash'
  args:
    - '-c'
    - |
      cd backend
      go test -v ./...
      go vet ./...
```

## Cleanup

To destroy all resources:

```bash
# Destroy Terraform resources
terraform destroy

# Delete Cloud Build triggers
gcloud builds triggers list
gcloud builds triggers delete TRIGGER_ID

# Delete container images
gcloud container images delete gcr.io/$PROJECT_ID/homegenie-backend --force-delete-tags
gcloud container images delete gcr.io/$PROJECT_ID/homegenie-frontend --force-delete-tags
```

## Support

- Google Cloud Run Documentation: https://cloud.google.com/run/docs
- Cloud SQL Documentation: https://cloud.google.com/sql/docs
- Cloud Build Documentation: https://cloud.google.com/build/docs
- Terraform Google Provider: https://registry.terraform.io/providers/hashicorp/google/