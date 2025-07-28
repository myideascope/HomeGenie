# AWS ECS Deployment

This directory contains Terraform configurations for deploying HomeGenie to AWS using ECS Fargate.

## Architecture

The deployment creates:

- **VPC** with public and private subnets across 2 AZs
- **Application Load Balancer** for traffic distribution
- **ECS Fargate** cluster with backend and frontend services
- **RDS PostgreSQL** database with automated backups
- **CloudWatch** for logging and monitoring
- **Auto Scaling** for handling traffic spikes
- **Security Groups** with least privilege access

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** >= 1.0 installed
3. **Docker images** built and pushed to a registry

### Required AWS Permissions

Your AWS user/role needs these permissions:
- EC2 (VPC, subnets, security groups, load balancer)
- ECS (cluster, services, task definitions)
- RDS (database instance, subnet groups)
- IAM (roles, policies)
- CloudWatch (log groups)
- SSM (parameter store)
- Application Auto Scaling

## Quick Start

1. **Configure Terraform variables:**
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

2. **Initialize and deploy:**
```bash
terraform init
terraform plan
terraform apply
```

3. **Access your application:**
```bash
# Get the load balancer URL
terraform output load_balancer_url
```

## Configuration

### Required Variables

Edit `terraform.tfvars` and set:

```hcl
# Database password (use a strong password)
db_password = "your-super-secure-password"

# JWT secret (minimum 32 characters)
jwt_secret = "your-super-secret-jwt-key-minimum-32-characters"

# Container images
backend_image = "your-registry/homegenie-backend"
frontend_image = "your-registry/homegenie-frontend"
```

### Optional Customization

```hcl
# Instance sizes (adjust for your workload)
db_instance_class = "db.t3.small"
backend_cpu = 1024
backend_memory = 2048

# Auto scaling limits
backend_max_capacity = 20
frontend_max_capacity = 10

# Enable for production
backup_retention_period = 30
log_retention_days = 90
```

## Container Images

You need to build and push Docker images to a registry (ECR, Docker Hub, etc.):

### Backend Image

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates curl
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

### Frontend Image

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Build and Push

```bash
# Build and tag images
docker build -t your-registry/homegenie-backend:latest ./backend
docker build -t your-registry/homegenie-frontend:latest ./frontend

# Push to registry
docker push your-registry/homegenie-backend:latest
docker push your-registry/homegenie-frontend:latest
```

## Deployment Steps

### 1. Infrastructure Deployment

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan -var-file="terraform.tfvars"

# Deploy infrastructure
terraform apply -var-file="terraform.tfvars"
```

### 2. Database Setup

The RDS instance is created automatically. For initial schema setup:

```bash
# Get database endpoint
DB_ENDPOINT=$(terraform output -raw rds_endpoint)

# Connect and run migrations
psql -h $DB_ENDPOINT -U homegenie -d homegenie -f migrations/001_initial.sql
```

### 3. Verify Deployment

```bash
# Get application URL
APP_URL=$(terraform output -raw load_balancer_url)

# Test backend health
curl $APP_URL/api/health

# Test frontend
curl $APP_URL
```

## Monitoring and Logs

### CloudWatch Logs

View application logs:

```bash
# Backend logs
aws logs tail /ecs/homegenie-backend --follow

# Frontend logs
aws logs tail /ecs/homegenie-frontend --follow
```

### ECS Service Status

```bash
# Check service status
aws ecs describe-services \
  --cluster homegenie-cluster \
  --services homegenie-backend homegenie-frontend

# View running tasks
aws ecs list-tasks --cluster homegenie-cluster
```

### Database Monitoring

- RDS Performance Insights (enabled by default)
- CloudWatch metrics for connections, CPU, memory
- Automated backups with 7-day retention

## Scaling

### Automatic Scaling

Auto scaling is configured for:
- **CPU-based scaling**: Scales when CPU > 70%
- **Backend**: 1-10 instances
- **Frontend**: 1-5 instances

### Manual Scaling

```bash
# Scale backend service
aws ecs update-service \
  --cluster homegenie-cluster \
  --service homegenie-backend \
  --desired-count 5

# Scale frontend service
aws ecs update-service \
  --cluster homegenie-cluster \
  --service homegenie-frontend \
  --desired-count 3
```

## Security

### Network Security

- Private subnets for ECS tasks and RDS
- Security groups with minimal required access
- NAT Gateway for outbound internet access
- Load balancer in public subnets only

### Secrets Management

- Database password stored in SSM Parameter Store
- JWT secret in SSM Parameter Store
- ECS tasks use IAM roles for AWS access

### Database Security

- Encryption at rest enabled
- Automated backups
- VPC security groups restrict access
- Enhanced monitoring for security events

## SSL/HTTPS Setup

To enable HTTPS:

1. **Get an SSL certificate:**
```bash
# Request certificate in ACM
aws acm request-certificate \
  --domain-name homegenie.yourdomain.com \
  --validation-method DNS
```

2. **Update Terraform variables:**
```hcl
domain_name = "homegenie.yourdomain.com"
certificate_arn = "arn:aws:acm:us-west-2:123456789:certificate/12345"
```

3. **Apply changes:**
```bash
terraform apply
```

## Disaster Recovery

### Database Backups

- Automated daily backups (7-day retention)
- Point-in-time recovery available
- Cross-region backup replication (optional)

### Application Recovery

```bash
# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier homegenie-db-restored \
  --db-snapshot-identifier homegenie-db-snapshot-20240101

# Update ECS service to use new database
# (update DB_HOST environment variable)
```

## Cost Optimization

### Development Environment

```hcl
# Minimal resources for dev
db_instance_class = "db.t3.micro"
backend_cpu = 256
backend_memory = 512
frontend_cpu = 256
frontend_memory = 512
enable_nat_gateway = false  # Use public subnets
```

### Production Recommendations

```hcl
# Production sizing
db_instance_class = "db.t3.small"
backend_cpu = 1024
backend_memory = 2048
backup_retention_period = 30
enable_performance_insights = true
```

## Troubleshooting

### Common Issues

1. **ECS tasks failing to start:**
```bash
# Check task logs
aws ecs describe-tasks --cluster homegenie-cluster --tasks TASK_ARN

# Check service events
aws ecs describe-services --cluster homegenie-cluster --services homegenie-backend
```

2. **Database connection issues:**
```bash
# Test connectivity from ECS task
aws ecs execute-command \
  --cluster homegenie-cluster \
  --task TASK_ARN \
  --command "nc -zv DB_ENDPOINT 5432"
```

3. **Load balancer health checks failing:**
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
```

### Debug Commands

```bash
# View ECS service logs
aws ecs describe-services --cluster homegenie-cluster --services homegenie-backend

# Check load balancer targets
aws elbv2 describe-target-groups --load-balancer-arn LOAD_BALANCER_ARN

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=homegenie-backend \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

## Cleanup

To destroy all resources:

```bash
# Destroy infrastructure
terraform destroy

# Clean up ECR repositories (if created)
aws ecr delete-repository --repository-name homegenie-backend --force
aws ecr delete-repository --repository-name homegenie-frontend --force
```

## Support

- AWS ECS Documentation: https://docs.aws.amazon.com/ecs/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/
- RDS Documentation: https://docs.aws.amazon.com/rds/