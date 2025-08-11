#!/bin/bash

# HomeGenie Frontend Development Setup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Created .env.local from .env.example"
            print_warning "Please update .env.local with your backend URLs and API keys"
        else
            print_warning ".env.example not found, creating basic .env.local"
            cat > .env.local << EOF
# HomeGenie Frontend Development Configuration
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8080/ws
VITE_ENABLE_API_LOGGING=true
VITE_MOCK_API=false
EOF
        fi
    else
        print_status ".env.local already exists"
    fi
}

# Function to check Node.js version
check_node_version() {
    print_status "Checking Node.js version..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed"
        print_status "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_VERSION="18.0.0"
    
    if command_exists npx; then
        if npx semver -r ">=$REQUIRED_VERSION" "$NODE_VERSION" >/dev/null 2>&1; then
            print_success "Node.js version $NODE_VERSION is compatible"
        else
            print_error "Node.js version $NODE_VERSION is not supported"
            print_status "Please upgrade to Node.js $REQUIRED_VERSION or higher"
            exit 1
        fi
    else
        print_warning "Cannot verify Node.js version compatibility"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to setup Git hooks (optional)
setup_git_hooks() {
    if [ -d ".git" ]; then
        print_status "Setting up Git hooks..."
        
        # Create pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# HomeGenie Frontend Pre-commit Hook

echo "Running pre-commit checks..."

# Check if npm run lint exists and run it
if npm run lint >/dev/null 2>&1; then
    echo "Running linter..."
    npm run lint
    if [ $? -ne 0 ]; then
        echo "Linting failed. Please fix the issues before committing."
        exit 1
    fi
fi

# Check if npm run type-check exists and run it
if npm run type-check >/dev/null 2>&1; then
    echo "Running type check..."
    npm run type-check
    if [ $? -ne 0 ]; then
        echo "Type checking failed. Please fix the issues before committing."
        exit 1
    fi
fi

echo "Pre-commit checks passed!"
EOF

        chmod +x .git/hooks/pre-commit
        print_success "Git hooks configured"
    else
        print_warning "Not a Git repository, skipping Git hooks setup"
    fi
}

# Function to start development server
start_dev_server() {
    print_status "Starting development server..."
    
    # Check if backend is running
    if curl -f -s http://localhost:8080/api/v1/health >/dev/null 2>&1; then
        print_success "Backend server detected at http://localhost:8080"
    else
        print_warning "Backend server not detected at http://localhost:8080"
        print_status "Make sure your Go backend is running for full functionality"
    fi
    
    print_success "Setup complete! Starting development server..."
    print_status "Frontend will be available at http://localhost:3000"
    
    npm run dev
}

# Function to show help
show_help() {
    echo "HomeGenie Frontend Development Setup"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --no-install    Skip dependency installation"
    echo "  --no-hooks      Skip Git hooks setup"
    echo "  --no-start      Skip starting the development server"
    echo "  --help          Show this help message"
    echo ""
    echo "This script will:"
    echo "  1. Check Node.js version compatibility"
    echo "  2. Set up environment configuration"
    echo "  3. Install dependencies"
    echo "  4. Configure Git hooks (optional)"
    echo "  5. Start the development server"
}

# Parse command line arguments
SKIP_INSTALL=false
SKIP_HOOKS=false
SKIP_START=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-install)
            SKIP_INSTALL=true
            shift
            ;;
        --no-hooks)
            SKIP_HOOKS=true
            shift
            ;;
        --no-start)
            SKIP_START=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main setup function
main() {
    echo "🏠 HomeGenie Frontend Development Setup"
    echo ""
    
    check_node_version
    setup_environment
    
    if [ "$SKIP_INSTALL" = false ]; then
        install_dependencies
    else
        print_warning "Skipping dependency installation"
    fi
    
    if [ "$SKIP_HOOKS" = false ]; then
        setup_git_hooks
    else
        print_warning "Skipping Git hooks setup"
    fi
    
    if [ "$SKIP_START" = false ]; then
        start_dev_server
    else
        print_success "Setup complete! Run 'npm run dev' to start the development server."
    fi
}

# Run main function
main