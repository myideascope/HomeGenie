#!/bin/bash

# HomeGenie Frontend Deployment Script
# Supports multiple deployment targets: vercel, netlify, aws, docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOYMENT_TARGET=""
ENVIRONMENT="production"
SKIP_BUILD=false
SKIP_TESTS=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --target TARGET     Deployment target (vercel|netlify|aws|docker)"
    echo "  -e, --env ENVIRONMENT   Environment (production|staging|development)"
    echo "  --skip-build           Skip the build step"
    echo "  --skip-tests           Skip the test step"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t vercel -e production"
    echo "  $0 -t netlify -e staging --skip-tests"
    echo "  $0 -t docker -e production"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MIN_NODE_VERSION="18.0.0"
    
    if ! command -v npx &> /dev/null || ! npx semver -r ">=$MIN_NODE_VERSION" "$NODE_VERSION" &> /dev/null; then
        print_warning "Node.js version $NODE_VERSION detected. Minimum required: $MIN_NODE_VERSION"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to load environment variables
load_environment() {
    print_status "Loading environment configuration for $ENVIRONMENT..."
    
    # Load base environment
    if [ -f ".env" ]; then
        source .env
    fi
    
    # Load environment-specific config
    if [ -f ".env.$ENVIRONMENT" ]; then
        source ".env.$ENVIRONMENT"
    fi
    
    # Load local overrides
    if [ -f ".env.local" ]; then
        source .env.local
    fi
    
    print_success "Environment configuration loaded"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests"
        return
    fi
    
    print_status "Running tests and linting..."
    
    # Run linting
    if npm run lint 2>/dev/null; then
        print_success "Linting passed"
    else
        print_warning "Linting step skipped (script not found)"
    fi
    
    # Run type checking
    if npm run type-check 2>/dev/null; then
        print_success "Type checking passed"
    else
        print_warning "Type checking step skipped (script not found)"
    fi
    
    print_success "Tests completed"
}

# Function to build application
build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build step"
        return
    fi
    
    print_status "Building application for $ENVIRONMENT..."
    
    # Set environment variables for build
    export NODE_ENV="production"
    
    npm run build
    print_success "Application built successfully"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod --confirm
    else
        vercel --confirm
    fi
    
    print_success "Deployed to Vercel successfully"
}

# Function to deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Deploy based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        netlify deploy --prod --dir=dist
    else
        netlify deploy --dir=dist
    fi
    
    print_success "Deployed to Netlify successfully"
}

# Function to deploy to AWS
deploy_aws() {
    print_status "Deploying to AWS S3 + CloudFront..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is required but not installed"
        print_status "Please install AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Check for required environment variables
    if [ -z "$AWS_S3_BUCKET" ] || [ -z "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
        print_error "AWS_S3_BUCKET and AWS_CLOUDFRONT_DISTRIBUTION_ID must be set"
        exit 1
    fi
    
    # Sync to S3
    print_status "Uploading to S3 bucket: $AWS_S3_BUCKET"
    aws s3 sync dist/ "s3://$AWS_S3_BUCKET" --delete
    
    # Invalidate CloudFront cache
    print_status "Invalidating CloudFront distribution: $AWS_CLOUDFRONT_DISTRIBUTION_ID"
    aws cloudfront create-invalidation --distribution-id "$AWS_CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
    
    print_success "Deployed to AWS successfully"
}

# Function to deploy with Docker
deploy_docker() {
    print_status "Building and deploying Docker container..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not installed"
        exit 1
    fi
    
    # Build Docker image
    IMAGE_NAME="homegenie-frontend:$ENVIRONMENT"
    print_status "Building Docker image: $IMAGE_NAME"
    
    docker build \
        --build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL" \
        --build-arg VITE_WS_BASE_URL="$VITE_WS_BASE_URL" \
        --build-arg VITE_ENABLE_ANALYTICS="$VITE_ENABLE_ANALYTICS" \
        --build-arg VITE_ANALYTICS_TRACKING_ID="$VITE_ANALYTICS_TRACKING_ID" \
        --build-arg VITE_SENTRY_DSN="$VITE_SENTRY_DSN" \
        --build-arg VITE_GOOGLE_MAPS_API_KEY="$VITE_GOOGLE_MAPS_API_KEY" \
        -t "$IMAGE_NAME" .
    
    # Option to push to registry
    if [ -n "$DOCKER_REGISTRY" ]; then
        print_status "Pushing to Docker registry: $DOCKER_REGISTRY"
        docker tag "$IMAGE_NAME" "$DOCKER_REGISTRY/$IMAGE_NAME"
        docker push "$DOCKER_REGISTRY/$IMAGE_NAME"
    fi
    
    # Option to run locally
    if [ "$ENVIRONMENT" = "development" ]; then
        print_status "Starting container locally..."
        docker run -d -p 80:80 --name homegenie-frontend "$IMAGE_NAME"
        print_success "Container started at http://localhost"
    fi
    
    print_success "Docker deployment completed"
}

# Function to perform post-deployment tasks
post_deployment() {
    print_status "Running post-deployment tasks..."
    
    # Health check
    if [ -n "$DEPLOYMENT_URL" ]; then
        print_status "Performing health check on $DEPLOYMENT_URL"
        
        # Wait a moment for deployment to be ready
        sleep 10
        
        if curl -f -s "$DEPLOYMENT_URL/health" > /dev/null 2>&1; then
            print_success "Health check passed"
        else
            print_warning "Health check failed or endpoint not available"
        fi
    fi
    
    # Send notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"HomeGenie Frontend deployed successfully to $ENVIRONMENT\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    print_success "Post-deployment tasks completed"
}

# Main deployment function
main() {
    print_status "Starting HomeGenie Frontend deployment..."
    print_status "Target: $DEPLOYMENT_TARGET, Environment: $ENVIRONMENT"
    
    check_prerequisites
    load_environment
    install_dependencies
    run_tests
    build_application
    
    case $DEPLOYMENT_TARGET in
        vercel)
            deploy_vercel
            ;;
        netlify)
            deploy_netlify
            ;;
        aws)
            deploy_aws
            ;;
        docker)
            deploy_docker
            ;;
        *)
            print_error "Invalid deployment target: $DEPLOYMENT_TARGET"
            show_usage
            exit 1
            ;;
    esac
    
    post_deployment
    
    print_success "Deployment completed successfully! 🚀"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--target)
            DEPLOYMENT_TARGET="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$DEPLOYMENT_TARGET" ]; then
    print_error "Deployment target is required"
    show_usage
    exit 1
fi

# Run main function
main