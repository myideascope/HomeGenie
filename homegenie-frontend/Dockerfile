# Production Dockerfile for HomeGenie Frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_ENABLE_ANALYTICS
ARG VITE_ANALYTICS_TRACKING_ID
ARG VITE_SENTRY_DSN
ARG VITE_GOOGLE_MAPS_API_KEY

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy health check script
COPY docker-healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Add labels for metadata
LABEL maintainer="HomeGenie Team"
LABEL version="1.0.0"
LABEL description="HomeGenie Frontend - React Application"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]