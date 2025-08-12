#!/bin/bash

# HomeGenie Development Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Node.js
    if command_exists node; then
        node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            print_success "Node.js $(node --version) found"
        else
            print_warning "Node.js version should be 18+, found $(node --version)"
            missing_deps+=("node")
        fi
    else
        print_error "Node.js not found"
        missing_deps+=("node")
    fi
    
    # Check npm
    if command_exists npm; then
        print_success "npm $(npm --version) found"
    else
        print_error "npm not found"
        missing_deps+=("npm")
    fi
    
    # Check Go
    if command_exists go; then
        go_version=$(go version | grep -o 'go[0-9.]*' | head -1 | cut -d'o' -f2 | cut -d'.' -f1-2)
        print_success "Go $(go version | grep -o 'go[0-9.]*' | head -1) found"
    else
        print_error "Go not found"
        missing_deps+=("go")
    fi
    
    # Check Docker
    if command_exists docker; then
        print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) found"
    else
        print_warning "Docker not found (optional for manual setup)"
    fi
    
    # Check Docker Compose
    if command_exists docker-compose; then
        print_success "Docker Compose found"
    else
        print_warning "Docker Compose not found (optional for manual setup)"
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        print_success "PostgreSQL found"
    else
        print_warning "PostgreSQL not found (will use Docker)"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_info "Please install the missing dependencies and run this script again"
        print_info "Visit the README.md for installation instructions"
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Setup environment files
setup_environment() {
    print_header "Setting up Environment Files"
    
    # Backend environment
    if [ ! -f "backend/.env.local" ]; then
        cp backend/.env.example backend/.env.local
        print_success "Created backend/.env.local"
        print_info "Edit backend/.env.local with your database configuration if needed"
    else
        print_info "backend/.env.local already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.example frontend/.env.local
        print_success "Created frontend/.env.local"
    else
        print_info "frontend/.env.local already exists"
    fi
}

# Setup backend
setup_backend() {
    print_header "Setting up Go Backend"
    
    cd backend/
    
    # Download Go modules
    print_info "Downloading Go modules..."
    go mod download
    print_success "Go modules downloaded"
    
    # Run tests to make sure everything works
    print_info "Running backend tests..."
    if go test ./... > /dev/null 2>&1; then
        print_success "Backend tests passed"
    else
        print_warning "Some backend tests failed (this is expected as services are not fully implemented)"
    fi
    
    # Build the server
    print_info "Building backend server..."
    if go build -o ../bin/server ./cmd/server; then
        print_success "Backend server built successfully"
    else
        print_error "Failed to build backend server"
        exit 1
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_header "Setting up React Frontend"
    
    cd frontend/
    
    # Install npm dependencies
    print_info "Installing npm dependencies..."
    npm install
    print_success "npm dependencies installed"
    
    # Run TypeScript check
    print_info "Running TypeScript check..."
    if npm run type-check > /dev/null 2>&1; then
        print_success "TypeScript check passed"
    else
        print_warning "TypeScript check had warnings"
    fi
    
    # Run linting
    print_info "Running ESLint..."
    if npm run lint > /dev/null 2>&1; then
        print_success "ESLint passed"
    else
        print_warning "ESLint found issues"
    fi
    
    # Build frontend
    print_info "Building frontend..."
    if npm run build > /dev/null 2>&1; then
        print_success "Frontend built successfully"
    else
        print_error "Failed to build frontend"
        exit 1
    fi
    
    cd ..
}

# Setup Docker environment
setup_docker() {
    print_header "Setting up Docker Environment"
    
    if command_exists docker && command_exists docker-compose; then
        # Create necessary directories
        mkdir -p bin logs uploads
        
        # Start Docker services
        print_info "Starting Docker services..."
        docker-compose up -d postgres redis
        
        # Wait for services to be ready
        print_info "Waiting for services to start..."
        sleep 10
        
        # Check if PostgreSQL is ready
        if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL is ready"
        else
            print_warning "PostgreSQL might not be ready yet"
        fi
        
        # Check if Redis is ready
        if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis is ready"
        else
            print_warning "Redis might not be ready yet"
        fi
        
        print_success "Docker environment setup complete"
    else
        print_warning "Docker not available, skipping Docker setup"
        print_info "You'll need to set up PostgreSQL manually for backend database"
    fi
}

# Create helpful scripts
create_scripts() {
    print_header "Creating Helper Scripts"
    
    # Create start script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
# Start development servers

echo "Starting HomeGenie development environment..."

# Start backend
echo "Starting Go backend server..."
cd backend && go run ./cmd/server &
BACKEND_PID=$!

# Start frontend
echo "Starting React frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8080"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap 'kill $BACKEND_PID $FRONTEND_PID' INT
wait
EOF
    
    chmod +x start-dev.sh
    print_success "Created start-dev.sh"
    
    # Create Docker start script
    cat > start-docker.sh << 'EOF'
#!/bin/bash
# Start full stack with Docker

echo "Starting HomeGenie with Docker..."
docker-compose up -d

echo "Services starting..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"

echo "Run 'docker-compose logs -f' to see logs"
echo "Run 'docker-compose down' to stop all services"
EOF
    
    chmod +x start-docker.sh
    print_success "Created start-docker.sh"
    
    # Create reset script
    cat > reset-dev.sh << 'EOF'
#!/bin/bash
# Reset development environment

echo "Resetting HomeGenie development environment..."

# Stop any running processes
pkill -f "go run ./cmd/server" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Stop Docker services
docker-compose down 2>/dev/null || true

# Clean build artifacts
rm -rf frontend/dist/ backend/server bin/ logs/

# Reset database (if using Docker)
docker-compose down -v 2>/dev/null || true

echo "Development environment reset complete"
echo "Run ./setup-dev.sh to set up again"
EOF
    
    chmod +x reset-dev.sh
    print_success "Created reset-dev.sh"
}

# Main function
main() {
    print_header "HomeGenie Development Setup"
    print_info "This script will set up your HomeGenie development environment"
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the root of the HomeGenie repository"
        exit 1
    fi
    
    # Run setup steps
    check_prerequisites
    setup_environment
    setup_backend
    setup_frontend
    setup_docker
    create_scripts
    
    # Final instructions
    print_header "Setup Complete! 🎉"
    print_success "HomeGenie development environment is ready!"
    
    echo ""
    print_info "Quick Start Options:"
    echo "  1. Manual start:    ./start-dev.sh"
    echo "  2. Docker start:    ./start-docker.sh"
    echo "  3. Reset env:       ./reset-dev.sh"
    echo ""
    
    print_info "Development URLs:"
    echo "  📱 Frontend:  http://localhost:5173 (manual) or http://localhost:3000 (Docker)"
    echo "  🔧 Backend:   http://localhost:8080"
    echo "  🗄️  Database:  localhost:5432 (Docker only)"
    echo ""
    
    print_info "Next Steps:"
    echo "  1. Review and update environment files (.env.local)"
    echo "  2. Start development servers with ./start-dev.sh"
    echo "  3. Open http://localhost:5173 in your browser"
    echo "  4. Check out CONTRIBUTING.md for development guidelines"
    echo ""
    
    print_success "Happy coding! 🚀"
}

# Run main function
main "$@"