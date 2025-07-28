# HomeGenie Deployment Guide

## Overview

HomeGenie is a comprehensive home maintenance management application with a Go backend API, React frontend, and PostgreSQL database. This guide covers deployment across multiple cloud providers with full observability.

## Architecture

- **Backend**: Go microservice with REST API
- **Frontend**: React SPA with Vite
- **Database**: PostgreSQL with automated migrations
- **Observability**: OpenTelemetry with Jaeger, Prometheus, and Grafana
- **Infrastructure**: Containerized with Docker, orchestrated with Kubernetes

## Quick Start

Choose your deployment method:

1. **[Kubernetes](#kubernetes-deployment)** - Recommended for production
2. **[AWS ECS](#aws-deployment)** - Fully managed containers
3. **[Google Cloud Run](#google-cloud-deployment)** - Serverless containers
4. **[DigitalOcean App Platform](#digitalocean-deployment)** - Simple PaaS
5. **[Local Development](#local-development)** - Docker Compose

## Prerequisites

- Docker and Docker Compose
- kubectl (for Kubernetes)
- Terraform (for cloud infrastructure)
- Cloud provider CLI tools

## Environment Variables

All deployments require these environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/homegenie
DB_HOST=localhost
DB_PORT=5432
DB_NAME=homegenie
DB_USER=homegenie
DB_PASSWORD=your-secure-password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_EXPIRY=24h

# API Configuration
API_PORT=8080
API_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# OpenTelemetry
OTEL_SERVICE_NAME=homegenie-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:14268/api/traces
OTEL_RESOURCE_ATTRIBUTES=service.name=homegenie,service.version=1.0.0

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Upload
MAX_UPLOAD_SIZE=10MB
UPLOAD_PATH=/app/uploads

# Redis (for caching)
REDIS_URL=redis://redis:6379
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured
- Helm (optional)

### Deploy with Scripts

```bash
cd deploy/kubernetes
./deploy --environment production
```

### Manual Deployment

1. **Create namespace:**
```bash
kubectl create namespace homegenie
```

2. **Deploy secrets:**
```bash
kubectl apply -f base/secrets.yaml
```

3. **Deploy database:**
```bash
kubectl apply -f base/database.yaml
```

4. **Deploy backend:**
```bash
kubectl apply -f base/backend.yaml
```

5. **Deploy frontend:**
```bash
kubectl apply -f base/frontend.yaml
```

6. **Deploy observability (optional):**
```bash
kubectl apply -f observability/
```

### Access the Application

```bash
# Port forward to access locally
kubectl port-forward service/homegenie-frontend 3000:80
kubectl port-forward service/homegenie-backend 8080:8080

# Or use LoadBalancer/Ingress (see ingress.yaml)
```

---

## AWS Deployment

### Prerequisites
- AWS CLI configured
- Terraform installed

### Deploy Infrastructure

```bash
cd deploy/aws/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="environment=production"

# Deploy
terraform apply -var="environment=production"
```

### What Gets Created
- VPC with public/private subnets
- ECS Fargate cluster
- Application Load Balancer
- RDS PostgreSQL instance
- CloudWatch logs and monitoring
- IAM roles and security groups

### Access
After deployment, Terraform outputs the Load Balancer URL.

---

## Google Cloud Deployment

### Prerequisites
- gcloud CLI configured
- Project with billing enabled

### Deploy with Cloud Run

```bash
cd deploy/gcp

# Deploy backend
gcloud run deploy homegenie-backend \
  --source=../../ \
  --region=us-central1 \
  --set-env-vars="DATABASE_URL=$DATABASE_URL"

# Deploy frontend  
gcloud run deploy homegenie-frontend \
  --source=../../frontend \
  --region=us-central1
```

### Infrastructure with Terraform

```bash
cd deploy/gcp/terraform
terraform init
terraform plan -var="project_id=your-project-id"
terraform apply -var="project_id=your-project-id"
```

---

## DigitalOcean Deployment

### App Platform Deployment

```bash
cd deploy/digitalocean

# Deploy using doctl
doctl apps create --spec app.yaml

# Or upload app.yaml through DO console
```

### Manual Setup
1. Fork repository to your GitHub
2. Connect GitHub to DigitalOcean Apps
3. Upload `deploy/digitalocean/app.yaml` as app spec
4. Configure environment variables
5. Deploy

---

## Local Development

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Grafana: http://localhost:3001 (admin/admin)
- Jaeger: http://localhost:16686
- Prometheus: http://localhost:9090

---

## Observability

### Included Tools
- **Jaeger**: Distributed tracing
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and alerting
- **OpenTelemetry**: Unified observability

### Key Metrics
- Request latency and throughput
- Error rates and types
- Database query performance
- Memory and CPU usage
- Custom business metrics

### Dashboards
Pre-configured Grafana dashboards for:
- Application overview
- Database performance
- Infrastructure metrics
- Business KPIs

---

## Security

### Best Practices Implemented
- Secrets management with Kubernetes secrets
- Network policies and security groups
- HTTPS/TLS termination
- Database encryption at rest
- Container security scanning
- Least privilege IAM

### Required Secrets
- Database credentials
- JWT signing key
- API keys for external services
- TLS certificates

---

## Scaling

### Horizontal Pod Autoscaler (Kubernetes)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: homegenie-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: homegenie-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Scaling
- Read replicas for PostgreSQL
- Connection pooling with PgBouncer
- Database sharding for large datasets

---

## Monitoring and Alerts

### Health Checks
- `/health` endpoint for basic health
- `/ready` endpoint for readiness
- Database connectivity checks
- External service dependency checks

### Recommended Alerts
- High error rate (>5% 5xx responses)
- High latency (>500ms p95)
- Database connection issues
- Memory/CPU usage >80%
- Disk space usage >85%

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Check firewall rules

2. **High Memory Usage**
   - Review connection pool settings
   - Check for memory leaks
   - Increase resource limits

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Review CORS settings

### Debugging Commands

```bash
# Check pod logs
kubectl logs -f deployment/homegenie-backend

# Get pod status
kubectl get pods -n homegenie

# Check service endpoints
kubectl get endpoints -n homegenie

# View events
kubectl get events --sort-by=.metadata.creationTimestamp
```

---

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Cross-region backup replication

### Application State
- Stateless application design
- Configuration in version control
- Infrastructure as Code

---

## CI/CD Pipeline

### GitHub Actions
- Automated testing on PR
- Container image building
- Security scanning
- Deployment to staging/production

### GitOps
- ArgoCD for Kubernetes deployments
- Automatic sync with Git repository
- Rollback capabilities

---

## Support

For deployment issues:
1. Check the logs for specific error messages
2. Verify all environment variables are set
3. Test database connectivity
4. Review resource limits and requests
5. Check network policies and firewall rules

## Next Steps

1. **Security Hardening**: Implement additional security measures
2. **Performance Optimization**: Fine-tune for your workload
3. **Disaster Recovery**: Set up backup and recovery procedures
4. **Cost Optimization**: Right-size resources and implement cost controls