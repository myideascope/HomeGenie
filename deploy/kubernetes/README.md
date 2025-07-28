# 🚀 HomeGenie Kubernetes Deployment Guide

This guide will walk you through deploying HomeGenie to any Kubernetes cluster step-by-step.

## 📋 Prerequisites

Before starting, ensure you have:

- **kubectl** installed and configured
- **Docker** installed for building images
- **Kubernetes cluster** access (EKS, GKE, AKS, or self-hosted)
- **Docker registry** access (Docker Hub, ECR, GCR, etc.)

## 🔧 Quick Start

### Option 1: Automated Deployment Script

```bash
cd deploy/kubernetes
chmod +x deploy
./deploy
```

The script will guide you through:
1. Prerequisites check
2. Building and pushing Docker images
3. Creating secrets
4. Deploying to Kubernetes
5. Setting up access

### Option 2: Manual Step-by-Step

## 📦 Step 1: Build and Push Docker Images

### 1.1 Build Images

```bash
# Build backend image
cd homegenie
docker build -t your-registry/homegenie-backend:latest .

# Build frontend image  
cd ../homegenie-frontend
docker build -t your-registry/homegenie-frontend:latest .
```

### 1.2 Push to Registry

```bash
# Login to your registry
docker login

# Push images
docker push your-registry/homegenie-backend:latest
docker push your-registry/homegenie-frontend:latest
```

## ⚙️ Step 2: Configure Kubernetes Manifests

### 2.1 Update Image References

Edit `deploy/kubernetes/base/kustomization.yaml`:

```yaml
images:
  - name: homegenie/backend
    newName: your-registry/homegenie-backend
    newTag: latest
  - name: homegenie/frontend
    newName: your-registry/homegenie-frontend
    newTag: latest
```

### 2.2 Create Namespace

```bash
kubectl create namespace homegenie-dev
```

## 🔐 Step 3: Create Secrets

### 3.1 Create Backend Secrets

```bash
kubectl create secret generic backend-secret \
  --from-literal=jwt-secret="$(echo -n 'your-jwt-secret-here' | base64 -w 0)" \
  --from-literal=openai-api-key="$(echo -n 'sk-your-openai-key' | base64 -w 0)" \
  --namespace=homegenie-dev
```

### 3.2 Create Database Secret

```bash
kubectl create secret generic postgres-secret \
  --from-literal=postgres-password="$(echo -n 'secure-db-password' | base64 -w 0)" \
  --namespace=homegenie-dev
```

## 🚀 Step 4: Deploy to Kubernetes

### 4.1 Apply Base Configuration

```bash
cd deploy/kubernetes
kubectl apply -k base/ --namespace=homegenie-dev
```

### 4.2 Wait for Deployments

```bash
# Check deployment status
kubectl get pods -n homegenie-dev

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=homegenie -n homegenie-dev --timeout=300s
```

## 🌐 Step 5: Setup Access

### Option A: Using Ingress (Recommended)

If you have an ingress controller installed:

```bash
# Check ingress status
kubectl get ingress -n homegenie-dev

# Get ingress IP/hostname
kubectl get ingress homegenie-ingress -n homegenie-dev -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### Option B: Port Forwarding (Development)

```bash
# Forward frontend
kubectl port-forward svc/frontend-service 3000:80 -n homegenie-dev

# Forward backend (in another terminal)
kubectl port-forward svc/backend-service 8080:8080 -n homegenie-dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1/health

### Option C: LoadBalancer Service

If your cluster supports LoadBalancer services, edit the service manifests:

```yaml
# Change ClusterIP to LoadBalancer
spec:
  type: LoadBalancer
```

## 🔍 Step 6: Verify Deployment

### 6.1 Check Pod Status

```bash
kubectl get pods -n homegenie-dev
```

Expected output:
```
NAME                        READY   STATUS    RESTARTS   AGE
backend-xxx                 1/1     Running   0          2m
frontend-xxx                1/1     Running   0          2m
postgres-xxx                1/1     Running   0          2m
```

### 6.2 Check Services

```bash
kubectl get services -n homegenie-dev
```

### 6.3 Test API Health

```bash
# If using port-forward
curl http://localhost:8080/api/v1/health

# If using ingress
curl http://your-domain/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected"
}
```

## 📊 Step 7: Monitor and Scale

### 7.1 View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n homegenie-dev

# Frontend logs  
kubectl logs -f deployment/frontend -n homegenie-dev

# Database logs
kubectl logs -f deployment/postgres -n homegenie-dev
```

### 7.2 Scale Applications

```bash
# Scale backend
kubectl scale deployment backend --replicas=3 -n homegenie-dev

# Scale frontend
kubectl scale deployment frontend --replicas=2 -n homegenie-dev
```

### 7.3 Monitor Resources

```bash
# Check resource usage
kubectl top pods -n homegenie-dev

# Check events
kubectl get events -n homegenie-dev --sort-by='.lastTimestamp'
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Update backend image
kubectl set image deployment/backend backend=your-registry/homegenie-backend:v2 -n homegenie-dev

# Update frontend image
kubectl set image deployment/frontend frontend=your-registry/homegenie-frontend:v2 -n homegenie-dev

# Check rollout status
kubectl rollout status deployment/backend -n homegenie-dev
```

### Rollback Deployment

```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n homegenie-dev

# Check rollout history
kubectl rollout history deployment/backend -n homegenie-dev
```

## 🏭 Production Environment

### Deploy to Production

```bash
# Use production overlay
kubectl apply -k overlays/production/ --namespace=homegenie-prod
```

Production features:
- Increased resource limits
- Multiple replicas
- Security contexts
- Pod anti-affinity
- Health checks
- Proper SSL/TLS

### Production Checklist

- ✅ Use specific image tags (not `latest`)
- ✅ Set resource requests and limits
- ✅ Configure proper secrets management
- ✅ Setup monitoring and alerting
- ✅ Configure backup for PostgreSQL
- ✅ Use ingress with SSL/TLS
- ✅ Implement network policies
- ✅ Configure pod security policies

## 🗂️ Different Kubernetes Environments

### Amazon EKS

```bash
# Create EKS cluster
eksctl create cluster --name homegenie --region us-west-2 --nodegroup-name workers --node-type t3.medium --nodes 2

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name homegenie

# Install AWS Load Balancer Controller
kubectl apply -f https://github.com/kubernetes-sigs/aws-load-balancer-controller/releases/download/v2.7.2/v2_7_2_full.yaml
```

### Google GKE

```bash
# Create GKE cluster
gcloud container clusters create homegenie \
  --zone us-central1-a \
  --num-nodes 2 \
  --machine-type e2-medium \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 5

# Get credentials
gcloud container clusters get-credentials homegenie --zone us-central1-a
```

### Azure AKS

```bash
# Create resource group
az group create --name HomeGenieRG --location eastus

# Create AKS cluster
az aks create \
  --resource-group HomeGenieRG \
  --name homegenie \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group HomeGenieRG --name homegenie
```

## 🔧 Troubleshooting

### Common Issues

**Pods in Pending State:**
```bash
# Check events
kubectl describe pod <pod-name> -n homegenie-dev

# Common causes: insufficient resources, image pull issues
```

**Image Pull Errors:**
```bash
# Check if image exists
docker pull your-registry/homegenie-backend:latest

# Verify registry credentials
kubectl get secrets -n homegenie-dev
```

**Database Connection Issues:**
```bash
# Check PostgreSQL logs
kubectl logs deployment/postgres -n homegenie-dev

# Verify service connectivity
kubectl exec -it deployment/backend -n homegenie-dev -- nslookup postgres-service
```

**Ingress Not Working:**
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Verify ingress configuration
kubectl describe ingress homegenie-ingress -n homegenie-dev
```

### Debug Commands

```bash
# Get detailed pod information
kubectl describe pod <pod-name> -n homegenie-dev

# Check resource quotas
kubectl describe resourcequota -n homegenie-dev

# View all events
kubectl get events --sort-by=.metadata.creationTimestamp -n homegenie-dev

# Check node status
kubectl describe node <node-name>

# Test service connectivity
kubectl run debug --image=busybox -it --rm --restart=Never -- nslookup postgres-service.homegenie-dev.svc.cluster.local
```

## 🧹 Cleanup

### Remove Application

```bash
# Delete namespace (removes everything)
kubectl delete namespace homegenie-dev

# Or delete specific resources
kubectl delete -k base/ --namespace=homegenie-dev
```

### Remove Cluster (if needed)

```bash
# EKS
eksctl delete cluster --name homegenie

# GKE  
gcloud container clusters delete homegenie --zone us-central1-a

# AKS
az aks delete --resource-group HomeGenieRG --name homegenie
```

---

## 🎯 Next Steps

After successful deployment:

1. **Setup Monitoring** - Deploy observability stack
2. **Configure SSL** - Setup cert-manager for automatic certificates
3. **Backup Strategy** - Configure PostgreSQL backups
4. **CI/CD Pipeline** - Automate deployments
5. **Security Hardening** - Implement security best practices

You now have HomeGenie running on Kubernetes! 🎉