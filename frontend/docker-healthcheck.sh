#!/bin/sh

# Health check script for HomeGenie Frontend Docker container

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if the application is responding
if ! wget --quiet --tries=1 --spider http://localhost/health; then
    echo "Application health check failed"
    exit 1
fi

# Check if main assets are accessible
if ! wget --quiet --tries=1 --spider http://localhost/; then
    echo "Main application page not accessible"
    exit 1
fi

echo "Health check passed"
exit 0