# Contributing to HomeGenie

Thank you for your interest in contributing to HomeGenie! This guide will help you get started.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/HomeGenie.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Test thoroughly
6. Commit and push
7. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Go 1.22+
- PostgreSQL 12+
- Docker & Docker Compose

### Local Development
```bash
# Clone the repository
git clone https://github.com/myideascope/HomeGenie.git
cd HomeGenie

# Start development environment with Docker
docker-compose up -d

# Or set up manually:
# Backend
cd backend && go mod download && go run ./cmd/server

# Frontend
cd frontend && npm install && npm run dev
```

## 📝 Pull Request Process

1. **Branch Naming**: Use descriptive branch names
   - `feature/user-authentication`
   - `fix/database-migration-bug`
   - `docs/api-documentation-update`

2. **Commit Messages**: Follow conventional commits
   - `feat: add user authentication system`
   - `fix: resolve database connection timeout`
   - `docs: update API documentation`

3. **Testing**: Ensure all tests pass
   ```bash
   # Frontend tests
   cd frontend && npm run test && npm run lint

   # Backend tests
   cd backend && go test ./... && golangci-lint run
   ```

4. **Documentation**: Update relevant documentation

## 🧪 Testing Guidelines

### Frontend Testing
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- Type checking with TypeScript

### Backend Testing
- Unit tests with Go's testing package
- Integration tests with test database
- API endpoint tests
- Performance benchmarks

## 🎨 Code Style

### Frontend (TypeScript/React)
- Use ESLint and Prettier
- Follow React best practices
- Use TypeScript strictly
- Component naming: PascalCase
- File naming: kebab-case

### Backend (Go)
- Follow Go conventions
- Use `gofmt` and `goimports`
- Write godoc comments
- Package naming: lowercase
- Function naming: camelCase (exported: PascalCase)

## 🏗️ Architecture Guidelines

### Frontend Architecture
```
src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── hooks/         # Custom React hooks
├── services/      # API and external services
├── stores/        # State management
├── utils/         # Utility functions
└── types/         # TypeScript definitions
```

### Backend Architecture
```
backend/
├── cmd/server/    # Application entry point
├── internal/      # Private application code
│   ├── auth/     # Authentication service
│   ├── tasks/    # Task management
│   └── ...       # Other services
├── pkg/          # Shared packages
└── api/v1/       # API handlers
```

## 🔄 Development Workflow

1. **Issue First**: Create or comment on an issue before starting work
2. **Small PRs**: Keep pull requests focused and small
3. **Documentation**: Update docs for new features
4. **Tests**: Add tests for new functionality
5. **Review**: Be responsive to code review feedback

## 🐛 Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Environment details (OS, browser, versions)
- Console errors or logs

Use the bug report template:
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96.0]
- Node.js: [e.g., 18.0.0]
- Go: [e.g., 1.22.0]
```

## ✨ Feature Requests

For feature requests, please:
- Check existing issues first
- Explain the use case
- Describe the proposed solution
- Consider implementation complexity
- Discuss API design if applicable

## 📋 Project Structure

### Key Files
- `DEPLOYMENT.md` - Deployment instructions
- `docker-compose.yml` - Development environment
- `.github/workflows/` - CI/CD pipelines
- `frontend/src/backend/api.ts` - API client
- `backend/pkg/database/` - Database layer

### Environment Setup
- Copy `.env.example` files and configure
- Use Docker Compose for consistent development
- Follow security best practices

## 🔒 Security

- Report security vulnerabilities privately
- Use environment variables for secrets
- Follow OWASP guidelines
- Keep dependencies updated
- Use HTTPS in production

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and provide helpful feedback
- Focus on constructive criticism
- Credit contributors appropriately

## 📞 Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community chat
- **Documentation**: Check existing docs first
- **Code Review**: Learn from PR feedback

## 🎯 Areas for Contribution

### High Priority
- [ ] Complete backend service implementation
- [ ] Add comprehensive test coverage
- [ ] Improve error handling
- [ ] Add API documentation

### Medium Priority
- [ ] Performance optimizations
- [ ] Mobile responsiveness improvements
- [ ] Accessibility enhancements
- [ ] Internationalization

### Nice to Have
- [ ] Advanced analytics
- [ ] Integrations with external services
- [ ] Mobile applications
- [ ] Advanced user roles

## 📚 Resources

- [React Documentation](https://reactjs.org/docs)
- [Go Documentation](https://golang.org/doc)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [Conventional Commits](https://www.conventionalcommits.org)

## ⭐ Recognition

Contributors are recognized in:
- GitHub contributor graph
- Release notes
- Project README
- Community highlights

Thank you for contributing to HomeGenie! 🏠✨