package database

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// User represents a user in the system
type User struct {
	ID                 int                `json:"id" db:"id"`
	Email              string             `json:"email" db:"email"`
	PasswordHash       string             `json:"-" db:"password_hash"`
	FirstName          string             `json:"firstName" db:"first_name"`
	LastName           string             `json:"lastName" db:"last_name"`
	Phone              *string            `json:"phone,omitempty" db:"phone"`
	Avatar             *string            `json:"avatar,omitempty" db:"avatar"`
	Timezone           string             `json:"timezone" db:"timezone"`
	Preferences        UserPreferences    `json:"preferences" db:"-"`
	CreatedAt          time.Time          `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time          `json:"-" db:"updated_at"`
	LastLoginAt        *time.Time         `json:"lastLoginAt,omitempty" db:"last_login_at"`
}

// UserPreferences represents user preferences
type UserPreferences struct {
	EmailNotifications bool   `json:"emailNotifications"`
	PushNotifications  bool   `json:"pushNotifications"`
	SMSNotifications   bool   `json:"smsNotifications"`
	Theme              string `json:"theme"`
	DateFormat         string `json:"dateFormat"`
	TimeFormat         string `json:"timeFormat"`
}

// Property represents a property managed by a user
type Property struct {
	ID                  int                   `json:"id" db:"id"`
	UserID              int                   `json:"-" db:"user_id"`
	Name                string                `json:"name" db:"name"`
	Address             string                `json:"address" db:"address"`
	Type                string                `json:"type" db:"type"`
	YearBuilt           *int                  `json:"yearBuilt,omitempty" db:"year_built"`
	SquareFootage       *int                  `json:"squareFootage,omitempty" db:"square_footage"`
	Notes               *string               `json:"notes,omitempty" db:"notes"`
	Rooms               []Room                `json:"rooms" db:"-"`
	MaintenanceHistory  []MaintenanceRecord   `json:"maintenanceHistory" db:"-"`
	CreatedAt           time.Time             `json:"createdAt" db:"created_at"`
	UpdatedAt           time.Time             `json:"-" db:"updated_at"`
}

// Room represents a room within a property
type Room struct {
	ID          int     `json:"id" db:"id"`
	PropertyID  int     `json:"-" db:"property_id"`
	Name        string  `json:"name" db:"name"`
	Type        string  `json:"type" db:"type"`
	FloorArea   *int    `json:"floorArea,omitempty" db:"floor_area"`
	Description *string `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"-" db:"created_at"`
	UpdatedAt   time.Time `json:"-" db:"updated_at"`
}

// Task represents a maintenance task
type Task struct {
	ID             int        `json:"id" db:"id"`
	UserID         int        `json:"-" db:"user_id"`
	PropertyID     int        `json:"-" db:"property_id"`
	Property       string     `json:"property" db:"-"` // Property name for display
	Title          string     `json:"title" db:"title"`
	Description    *string    `json:"description,omitempty" db:"description"`
	Priority       string     `json:"priority" db:"priority"`
	Status         string     `json:"status" db:"status"`
	Category       string     `json:"category" db:"category"`
	DueDate        *time.Time `json:"dueDate,omitempty" db:"due_date"`
	EstimatedTime  *int       `json:"estimatedTime,omitempty" db:"estimated_time"`
	Assignee       *string    `json:"assignee,omitempty" db:"assignee"`
	Notes          *string    `json:"notes,omitempty" db:"notes"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time  `json:"-" db:"updated_at"`
	CompletedAt    *time.Time `json:"completedAt,omitempty" db:"completed_at"`
}

// MaintenanceRecord represents a completed maintenance record
type MaintenanceRecord struct {
	ID            int       `json:"id" db:"id"`
	PropertyID    int       `json:"-" db:"property_id"`
	TaskID        *int      `json:"taskId,omitempty" db:"task_id"`
	Title         string    `json:"title" db:"title"`
	Description   string    `json:"description" db:"description"`
	CompletedDate time.Time `json:"completedDate" db:"completed_date"`
	Cost          *float64  `json:"cost,omitempty" db:"cost"`
	Contractor    *string   `json:"contractor,omitempty" db:"contractor"`
	Notes         *string   `json:"notes,omitempty" db:"notes"`
	CreatedAt     time.Time `json:"-" db:"created_at"`
	UpdatedAt     time.Time `json:"-" db:"updated_at"`
}

// Notification represents a system notification
type Notification struct {
	ID           int        `json:"id" db:"id"`
	UserID       int        `json:"-" db:"user_id"`
	Title        string     `json:"title" db:"title"`
	Message      string     `json:"message" db:"message"`
	Type         string     `json:"type" db:"type"`
	Priority     string     `json:"priority" db:"priority"`
	Read         bool       `json:"read" db:"read"`
	TaskID       *int       `json:"taskId,omitempty" db:"task_id"`
	PropertyID   *int       `json:"propertyId,omitempty" db:"property_id"`
	ActionURL    *string    `json:"actionUrl,omitempty" db:"action_url"`
	ScheduledFor *time.Time `json:"scheduledFor,omitempty" db:"scheduled_for"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time  `json:"-" db:"updated_at"`
}

// NotificationSettings represents user notification preferences
type NotificationSettings struct {
	ID                   int       `json:"-" db:"id"`
	UserID               int       `json:"-" db:"user_id"`
	EmailNotifications   bool      `json:"emailNotifications" db:"email_notifications"`
	PushNotifications    bool      `json:"pushNotifications" db:"push_notifications"`
	SMSNotifications     bool      `json:"smsNotifications" db:"sms_notifications"`
	ReminderAdvance      int       `json:"reminderAdvance" db:"reminder_advance"`
	QuietHours           QuietHours `json:"quietHours" db:"-"`
	TaskReminders        bool      `json:"taskReminders" db:"task_reminders"`
	MaintenanceAlerts    bool      `json:"maintenanceAlerts" db:"maintenance_alerts"`
	SystemNotifications  bool      `json:"systemNotifications" db:"system_notifications"`
	CreatedAt            time.Time `json:"-" db:"created_at"`
	UpdatedAt            time.Time `json:"-" db:"updated_at"`
}

// QuietHours represents quiet hours settings
type QuietHours struct {
	Enabled bool   `json:"enabled" db:"quiet_hours_enabled"`
	Start   string `json:"start" db:"quiet_hours_start"`
	End     string `json:"end" db:"quiet_hours_end"`
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	ID        int        `json:"-" db:"id"`
	UserID    int        `json:"-" db:"user_id"`
	Token     string     `json:"-" db:"token"`
	ExpiresAt time.Time  `json:"-" db:"expires_at"`
	CreatedAt time.Time  `json:"-" db:"created_at"`
	RevokedAt *time.Time `json:"-" db:"revoked_at"`
}

// File represents an uploaded file
type File struct {
	ID               int       `json:"-" db:"id"`
	UserID           int       `json:"-" db:"user_id"`
	Filename         string    `json:"filename" db:"filename"`
	OriginalFilename string    `json:"-" db:"original_filename"`
	MimeType         string    `json:"mimeType" db:"mime_type"`
	SizeBytes        int64     `json:"size" db:"size_bytes"`
	Category         string    `json:"-" db:"category"`
	FilePath         string    `json:"-" db:"file_path"`
	URL              string    `json:"url" db:"url"`
	CreatedAt        time.Time `json:"-" db:"created_at"`
}

// API Response and Request types

// APIResponse represents the standard API response format
type APIResponse[T any] struct {
	Data      T      `json:"data,omitempty"`
	Message   string `json:"message,omitempty"`
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse[T any] struct {
	Items   []T  `json:"items"`
	Total   int  `json:"total"`
	Page    int  `json:"page"`
	Limit   int  `json:"limit"`
	HasNext bool `json:"hasNext"`
	HasPrev bool `json:"hasPrev"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	FirstName string  `json:"firstName" binding:"required,min=2,max=50"`
	LastName  string  `json:"lastName" binding:"required,min=2,max=50"`
	Email     string  `json:"email" binding:"required,email"`
	Password  string  `json:"password" binding:"required,min=8"`
	Phone     *string `json:"phone,omitempty"`
	Timezone  *string `json:"timezone,omitempty"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	User         User   `json:"user"`
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
	ExpiresAt    string `json:"expiresAt"`
}

// CreateTaskRequest represents a task creation request
type CreateTaskRequest struct {
	Title         string     `json:"title" binding:"required,min=1,max=255"`
	Description   *string    `json:"description,omitempty"`
	PropertyID    int        `json:"propertyId" binding:"required"`
	Priority      string     `json:"priority" binding:"required,oneof=low medium high"`
	DueDate       *time.Time `json:"dueDate,omitempty"`
	Category      string     `json:"category" binding:"required,min=1,max=100"`
	EstimatedTime *int       `json:"estimatedTime,omitempty"`
	Assignee      *string    `json:"assignee,omitempty"`
	Notes         *string    `json:"notes,omitempty"`
}

// UpdateTaskRequest represents a task update request
type UpdateTaskRequest struct {
	Title         *string    `json:"title,omitempty"`
	Description   *string    `json:"description,omitempty"`
	PropertyID    *int       `json:"propertyId,omitempty"`
	Priority      *string    `json:"priority,omitempty"`
	Status        *string    `json:"status,omitempty"`
	DueDate       *time.Time `json:"dueDate,omitempty"`
	Category      *string    `json:"category,omitempty"`
	EstimatedTime *int       `json:"estimatedTime,omitempty"`
	Assignee      *string    `json:"assignee,omitempty"`
	Notes         *string    `json:"notes,omitempty"`
	CompletedAt   *time.Time `json:"completedAt,omitempty"`
}

// CreatePropertyRequest represents a property creation request
type CreatePropertyRequest struct {
	Name          string  `json:"name" binding:"required,min=1,max=255"`
	Address       string  `json:"address" binding:"required,min=1"`
	Type          string  `json:"type" binding:"required,oneof=house apartment condo townhouse other"`
	YearBuilt     *int    `json:"yearBuilt,omitempty"`
	SquareFootage *int    `json:"squareFootage,omitempty"`
	Notes         *string `json:"notes,omitempty"`
}

// UpdatePropertyRequest represents a property update request
type UpdatePropertyRequest struct {
	Name          *string `json:"name,omitempty"`
	Address       *string `json:"address,omitempty"`
	Type          *string `json:"type,omitempty"`
	YearBuilt     *int    `json:"yearBuilt,omitempty"`
	SquareFootage *int    `json:"squareFootage,omitempty"`
	Notes         *string `json:"notes,omitempty"`
}

// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8"`
}

// ForgotPasswordRequest represents a forgot password request
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents a password reset request
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

// TaskFilters represents filters for task queries
type TaskFilters struct {
	Status     *string    `form:"status"`
	Priority   *string    `form:"priority"`
	PropertyID *int       `form:"propertyId"`
	Assignee   *string    `form:"assignee"`
	DueAfter   *time.Time `form:"dueAfter"`
	DueBefore  *time.Time `form:"dueBefore"`
	Search     *string    `form:"search"`
	Page       int        `form:"page"`
	Limit      int        `form:"limit"`
}

// PropertyFilters represents filters for property queries
type PropertyFilters struct {
	Type   *string `form:"type"`
	Search *string `form:"search"`
	Page   int     `form:"page"`
	Limit  int     `form:"limit"`
}

// NotificationFilters represents filters for notification queries
type NotificationFilters struct {
	Read     *bool   `form:"read"`
	Type     *string `form:"type"`
	Priority *string `form:"priority"`
	Page     int     `form:"page"`
	Limit    int     `form:"limit"`
}

// Custom JSON marshaling for time fields to match frontend expectations

// MarshalJSON customizes the JSON output for time fields
func (t *Task) MarshalJSON() ([]byte, error) {
	type TaskAlias Task
	
	aux := struct {
		*TaskAlias
		DueDate     *string `json:"dueDate,omitempty"`
		CreatedAt   string  `json:"createdAt"`
		CompletedAt *string `json:"completedAt,omitempty"`
	}{
		TaskAlias: (*TaskAlias)(t),
		CreatedAt: t.CreatedAt.Format(time.RFC3339),
	}
	
	if t.DueDate != nil {
		dueDate := t.DueDate.Format(time.RFC3339)
		aux.DueDate = &dueDate
	}
	
	if t.CompletedAt != nil {
		completedAt := t.CompletedAt.Format(time.RFC3339)
		aux.CompletedAt = &completedAt
	}
	
	return json.Marshal(aux)
}

// Value implements the driver.Valuer interface for database storage
func (p UserPreferences) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// Scan implements the sql.Scanner interface for database retrieval
func (p *UserPreferences) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, p)
	case string:
		return json.Unmarshal([]byte(v), p)
	default:
		return fmt.Errorf("cannot scan %T into UserPreferences", value)
	}
}

// Validation methods

// ValidateTaskStatus checks if a task status is valid
func ValidateTaskStatus(status string) bool {
	validStatuses := map[string]bool{
		"pending":     true,
		"in_progress": true,
		"completed":   true,
		"overdue":     true,
	}
	return validStatuses[status]
}

// ValidateTaskPriority checks if a task priority is valid
func ValidateTaskPriority(priority string) bool {
	validPriorities := map[string]bool{
		"low":    true,
		"medium": true,
		"high":   true,
	}
	return validPriorities[priority]
}

// ValidatePropertyType checks if a property type is valid
func ValidatePropertyType(propertyType string) bool {
	validTypes := map[string]bool{
		"house":     true,
		"apartment": true,
		"condo":     true,
		"townhouse": true,
		"other":     true,
	}
	return validTypes[propertyType]
}

// ValidateRoomType checks if a room type is valid
func ValidateRoomType(roomType string) bool {
	validTypes := map[string]bool{
		"bedroom":  true,
		"bathroom": true,
		"kitchen":  true,
		"living":   true,
		"garage":   true,
		"basement": true,
		"attic":    true,
		"office":   true,
		"other":    true,
	}
	return validTypes[roomType]
}

// ValidateNotificationType checks if a notification type is valid
func ValidateNotificationType(notificationType string) bool {
	validTypes := map[string]bool{
		"task_reminder":   true,
		"maintenance_due": true,
		"system":          true,
		"alert":           true,
	}
	return validTypes[notificationType]
}