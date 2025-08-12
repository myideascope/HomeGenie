package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// responseWriter wraps gin.ResponseWriter to capture response body
type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// Logger middleware that logs HTTP requests and responses with OpenTelemetry integration
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// Get request ID from context
		requestID := getRequestID(c)
		
		// Capture request body for logging (be careful with large payloads)
		var requestBody []byte
		if c.Request.Body != nil && c.Request.ContentLength > 0 && c.Request.ContentLength < 1024*1024 { // Only log bodies < 1MB
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Wrap response writer to capture response body
		responseBody := &bytes.Buffer{}
		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:          responseBody,
		}
		c.Writer = writer

		// Get OpenTelemetry span from context
		span := trace.SpanFromContext(c.Request.Context())
		
		// Add request attributes to span
		span.SetAttributes(
			attribute.String("http.method", c.Request.Method),
			attribute.String("http.url", c.Request.URL.String()),
			attribute.String("http.user_agent", c.Request.UserAgent()),
			attribute.String("http.remote_addr", c.ClientIP()),
			attribute.String("request.id", requestID),
		)

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(start)
		
		// Add response attributes to span
		span.SetAttributes(
			attribute.Int("http.status_code", c.Writer.Status()),
			attribute.Int64("http.response_size", int64(c.Writer.Size())),
			attribute.Int64("http.request_size", c.Request.ContentLength),
			attribute.Float64("http.duration", latency.Seconds()),
		)

		// Create structured log entry
		logEntry := LogEntry{
			RequestID:      requestID,
			Method:         c.Request.Method,
			Path:           c.Request.URL.Path,
			Query:          c.Request.URL.RawQuery,
			StatusCode:     c.Writer.Status(),
			Latency:        latency,
			ClientIP:       c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
			RequestSize:    c.Request.ContentLength,
			ResponseSize:   int64(c.Writer.Size()),
			Timestamp:      start,
			TraceID:        span.SpanContext().TraceID().String(),
			SpanID:         span.SpanContext().SpanID().String(),
		}

		// Add request body to log if present and not sensitive
		if len(requestBody) > 0 && !isSensitiveEndpoint(c.Request.URL.Path) {
			logEntry.RequestBody = string(requestBody)
		}

		// Add response body to log if it's JSON and not too large
		if responseBody.Len() > 0 && responseBody.Len() < 10240 { // < 10KB
			if isJSONResponse(c.Writer.Header().Get("Content-Type")) {
				logEntry.ResponseBody = responseBody.String()
			}
		}

		// Add error information if present
		if len(c.Errors) > 0 {
			logEntry.Errors = make([]string, len(c.Errors))
			for i, err := range c.Errors {
				logEntry.Errors[i] = err.Error()
			}
		}

		// Log the entry
		logHTTPRequest(logEntry)
	}
}

// LogEntry represents a structured log entry for HTTP requests
type LogEntry struct {
	RequestID    string        `json:"request_id"`
	Method       string        `json:"method"`
	Path         string        `json:"path"`
	Query        string        `json:"query,omitempty"`
	StatusCode   int           `json:"status_code"`
	Latency      time.Duration `json:"latency_ns"`
	LatencyMs    float64       `json:"latency_ms"`
	ClientIP     string        `json:"client_ip"`
	UserAgent    string        `json:"user_agent"`
	RequestSize  int64         `json:"request_size"`
	ResponseSize int64         `json:"response_size"`
	Timestamp    time.Time     `json:"timestamp"`
	TraceID      string        `json:"trace_id,omitempty"`
	SpanID       string        `json:"span_id,omitempty"`
	RequestBody  string        `json:"request_body,omitempty"`
	ResponseBody string        `json:"response_body,omitempty"`
	Errors       []string      `json:"errors,omitempty"`
}

// logHTTPRequest logs an HTTP request entry as structured JSON
func logHTTPRequest(entry LogEntry) {
	// Convert latency to milliseconds for easier reading
	entry.LatencyMs = float64(entry.Latency.Nanoseconds()) / 1e6

	// Marshal to JSON
	logData, err := json.Marshal(entry)
	if err != nil {
		log.Printf("Failed to marshal log entry: %v", err)
		return
	}

	// Determine log level based on status code
	statusCode := entry.StatusCode
	switch {
	case statusCode >= 500:
		log.Printf("ERROR: %s", string(logData))
	case statusCode >= 400:
		log.Printf("WARN: %s", string(logData))
	case statusCode >= 300:
		log.Printf("INFO: %s", string(logData))
	default:
		log.Printf("INFO: %s", string(logData))
	}
}

// isSensitiveEndpoint checks if an endpoint might contain sensitive data
func isSensitiveEndpoint(path string) bool {
	sensitiveEndpoints := []string{
		"/api/v1/auth/login",
		"/api/v1/auth/register",
		"/api/v1/auth/change-password",
		"/api/v1/auth/reset-password",
		"/api/v1/auth/forgot-password",
	}

	for _, endpoint := range sensitiveEndpoints {
		if path == endpoint {
			return true
		}
	}
	return false
}

// isJSONResponse checks if the response content type is JSON
func isJSONResponse(contentType string) bool {
	return contentType == "application/json" || 
		   contentType == "application/json; charset=utf-8"
}