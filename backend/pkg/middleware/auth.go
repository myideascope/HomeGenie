package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthService interface for authentication middleware
type AuthService interface {
	ValidateToken(token string) (int, error) // returns userID
}

// AuthRequired middleware that requires a valid JWT token
func AuthRequired(authService AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":     "Authorization token required",
				"code":      "AUTHENTICATION_ERROR",
				"timestamp": getCurrentTimestamp(),
			})
			c.Abort()
			return
		}

		userID, err := authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":     "Invalid or expired token",
				"code":      "AUTHENTICATION_ERROR",
				"timestamp": getCurrentTimestamp(),
				"details":   gin.H{"validation_error": err.Error()},
			})
			c.Abort()
			return
		}

		// Store user ID in context for use in handlers
		c.Set("userID", userID)
		c.Next()
	}
}

// OptionalAuth middleware that validates token if present but doesn't require it
func OptionalAuth(authService AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token != "" {
			if userID, err := authService.ValidateToken(token); err == nil {
				c.Set("userID", userID)
			}
		}
		c.Next()
	}
}

// extractToken extracts the JWT token from the Authorization header
func extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}

	// Bearer token format: "Bearer <token>"
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}

	return parts[1]
}

// GetUserID is a helper function to get the current user ID from context
func GetUserID(c *gin.Context) (int, bool) {
	if userID, exists := c.Get("userID"); exists {
		if id, ok := userID.(int); ok {
			return id, true
		}
	}
	return 0, false
}