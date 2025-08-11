# HomeGenie API Integration Guide

This document explains how to use the HomeGenie API integration layer to connect the React frontend with a Go backend.

## Architecture Overview

The API integration layer consists of several components:

- **HTTP Client** (`src/backend/api.ts`) - Core HTTP client with authentication and error handling
- **React Hooks** (`src/hooks/useApi.ts`) - React-friendly wrappers for API calls
- **WebSocket Client** (`src/services/websocket.ts`) - Real-time communication
- **Configuration** (`src/config/api.ts`) - Environment-based configuration

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure your backend URL:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8080/ws
```

### 2. Using API Hooks in Components

```typescript
import { useAuth, useTasks, useTaskMutations } from '@/hooks/useApi';

function TaskList() {
  // Authentication
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Fetch tasks
  const { data: tasksResponse, loading, error, refetch } = useTasks({
    status: 'pending',
    page: 1,
    limit: 20
  });
  
  // Task mutations
  const { createTask, updateTask, deleteTask, createState } = useTaskMutations();
  
  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      refetch(); // Refresh task list
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {tasksResponse?.items.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  );
}
```

### 3. Direct API Service Usage

```typescript
import { TaskService, AuthService } from '@/backend/api';

// Authentication
const loginResponse = await AuthService.login({
  email: 'user@example.com',
  password: 'password'
});

// Create a task
const newTask = await TaskService.createTask({
  title: 'Fix leaky faucet',
  description: 'Kitchen faucet needs repair',
  propertyId: 1,
  priority: 'high',
  dueDate: '2024-08-15',
  category: 'Plumbing'
});

// Update task
const updatedTask = await TaskService.updateTask(newTask.id, {
  status: 'in_progress'
});
```

## API Services

### Authentication Service

```typescript
import { AuthService } from '@/backend/api';

// Login
const response = await AuthService.login({
  email: 'user@example.com',
  password: 'password'
});

// Register
await AuthService.register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password',
  phone: '+1234567890'
});

// Get current user
const user = await AuthService.getCurrentUser();

// Update profile
await AuthService.updateProfile({
  firstName: 'Jane',
  phone: '+0987654321'
});

// Logout
await AuthService.logout();
```

### Task Service

```typescript
import { TaskService } from '@/backend/api';

// Get tasks with filters
const tasks = await TaskService.getTasks({
  status: 'pending',
  priority: 'high',
  propertyId: 1,
  search: 'HVAC',
  page: 1,
  limit: 20
});

// Get single task
const task = await TaskService.getTask(1);

// Create task
const newTask = await TaskService.createTask({
  title: 'Clean HVAC filters',
  description: 'Replace or clean all filters',
  propertyId: 1,
  priority: 'high',
  dueDate: '2024-08-15',
  category: 'HVAC',
  estimatedTime: 30
});

// Update task
await TaskService.updateTask(1, {
  status: 'completed',
  completedAt: new Date().toISOString()
});

// Delete task
await TaskService.deleteTask(1);

// Get upcoming tasks
const upcoming = await TaskService.getUpcomingTasks(7); // Next 7 days

// Get overdue tasks
const overdue = await TaskService.getOverdueTasks();
```

### Property Service

```typescript
import { PropertyService } from '@/backend/api';

// Get properties
const properties = await PropertyService.getProperties({
  type: 'house',
  search: 'Main',
  page: 1,
  limit: 10
});

// Create property
const newProperty = await PropertyService.createProperty({
  name: 'Main House',
  address: '123 Oak Street, Springfield, IL',
  type: 'house',
  yearBuilt: 1985,
  squareFootage: 2400
});

// Get property tasks
const propertyTasks = await PropertyService.getPropertyTasks(1, {
  status: 'pending'
});

// Add maintenance record
await PropertyService.addMaintenanceRecord(1, {
  title: 'HVAC Service',
  description: 'Annual maintenance',
  completedDate: '2024-08-01',
  cost: 280,
  contractor: 'ABC HVAC Services'
});
```

### Notification Service

```typescript
import { NotificationService } from '@/backend/api';

// Get notifications
const notifications = await NotificationService.getNotifications({
  read: false,
  type: 'task_reminder',
  page: 1,
  limit: 20
});

// Mark as read
await NotificationService.markAsRead(1);

// Mark all as read
await NotificationService.markAllAsRead();

// Update notification settings
await NotificationService.updateNotificationSettings({
  emailNotifications: true,
  pushNotifications: true,
  reminderAdvance: 2,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
});
```

## React Hooks

### Authentication Hook

```typescript
const {
  user,                    // Current user data
  isAuthenticated,         // Boolean auth status
  loading,                 // Initial auth check loading
  error,                   // Auth error message
  login,                   // Login function
  register,               // Register function
  logout,                 // Logout function
  updateProfile,          // Update profile function
  loginState,             // Login mutation state
  registerState           // Register mutation state
} = useAuth();
```

### Tasks Hook

```typescript
const {
  data,                   // Paginated task response
  loading,                // Loading state
  error,                  // Error message
  refetch                 // Refetch function
} = useTasks({
  status: 'pending',
  priority: 'high',
  page: 1,
  limit: 20
});

const {
  createTask,             // Create task function
  updateTask,             // Update task function
  deleteTask,             // Delete task function
  completeTask,           // Complete task function
  createState,            // Create mutation state
  updateState,            // Update mutation state
  deleteState             // Delete mutation state
} = useTaskMutations();
```

### Properties Hook

```typescript
const {
  data,                   // Paginated properties response
  loading,
  error,
  refetch
} = useProperties({
  type: 'house',
  search: 'Main'
});

const {
  createProperty,
  updateProperty,
  deleteProperty,
  createState,
  updateState,
  deleteState
} = usePropertyMutations();
```

### Analytics Hook

```typescript
const {
  data,                   // Dashboard statistics
  loading,
  error,
  refetch
} = useDashboardStats();

const {
  data,                   // Task analytics
  loading,
  error,
  refetch
} = useTaskAnalytics('month');
```

## WebSocket Integration

### Basic Usage

```typescript
import { useWebSocket } from '@/services/websocket';

function RealTimeComponent() {
  const { client, connect, disconnect, on, isConnected } = useWebSocket();
  
  useEffect(() => {
    // Connect to WebSocket
    connect();
    
    // Subscribe to events
    const unsubscribe = on('task_updated', (task) => {
      console.log('Task updated:', task);
      // Update local state
    });
    
    return () => {
      unsubscribe();
      disconnect();
    };
  }, []);
  
  return (
    <div>
      Status: {isConnected() ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### Task Events

```typescript
import { useTaskEvents } from '@/services/websocket';

function TaskManager() {
  const { subscribeToTaskUpdates } = useTaskEvents((task) => {
    console.log('Task event received:', task);
    // Update task list
  });
  
  useEffect(() => {
    const unsubscribe = subscribeToTaskUpdates();
    return unsubscribe;
  }, []);
}
```

### Notification Events

```typescript
import { useNotificationEvents } from '@/services/websocket';

function NotificationManager() {
  const { subscribeToNotifications } = useNotificationEvents((notification) => {
    console.log('New notification:', notification);
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message
      });
    }
  });
  
  useEffect(() => {
    const unsubscribe = subscribeToNotifications();
    return unsubscribe;
  }, []);
}
```

## Error Handling

### Using Error Handler Utility

```typescript
import { ErrorHandler } from '@/backend/api';

try {
  await TaskService.createTask(taskData);
} catch (error) {
  const message = ErrorHandler.handleApiError(error);
  
  if (ErrorHandler.isNetworkError(error)) {
    // Handle network error
    showToast('Network error. Please check your connection.');
  } else {
    // Handle API error
    showToast(message);
  }
}
```

### Retry Utility

```typescript
import { RetryUtil } from '@/backend/api';

// Automatically retry failed requests
const task = await RetryUtil.withRetry(
  () => TaskService.getTask(1),
  3,  // max attempts
  1000 // delay in ms
);
```

## Configuration

### Environment Variables

All configuration is handled through environment variables. See `.env.example` for available options.

### Runtime Configuration

```typescript
import config from '@/config/api';

// Check if feature is enabled
if (config.ENABLE_WEBSOCKETS) {
  // Initialize WebSocket
}

// Get API URL
const apiUrl = config.API_BASE_URL;

// Check file constraints
if (config.isValidFileSize(file) && config.isValidFileType(file)) {
  // Upload file
}
```

## Backend Integration

The API layer expects a Go backend with the following characteristics:

### Authentication
- JWT-based authentication
- `/auth/login` and `/auth/register` endpoints
- Authorization header: `Bearer <token>`

### Response Format
```json
{
  "data": {...},
  "message": "Success",
  "status": "success",
  "timestamp": "2024-08-11T10:30:00Z"
}
```

### Error Format
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {...},
  "timestamp": "2024-08-11T10:30:00Z"
}
```

### Pagination
```json
{
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Testing

### Mock API

Enable mock API for development:

```env
VITE_MOCK_API=true
```

### API Logging

Enable detailed API logging:

```env
VITE_ENABLE_API_LOGGING=true
```

## Best Practices

1. **Use React Hooks** - Prefer API hooks over direct service calls in components
2. **Handle Loading States** - Always show loading indicators during API calls
3. **Error Boundaries** - Implement error boundaries for better error handling
4. **Optimistic Updates** - Update UI immediately, then sync with server
5. **Caching** - Use React Query or SWR for advanced caching strategies
6. **Type Safety** - Always use TypeScript interfaces for API responses
7. **Security** - Never log sensitive data, handle auth tokens securely

## Troubleshooting

### Common Issues

1. **CORS Errors** - Ensure backend CORS is configured properly
2. **Auth Token Expired** - API automatically handles token refresh
3. **Network Errors** - Use retry utility for transient failures
4. **WebSocket Connection** - Check firewall and proxy settings

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
import { debugApi } from '@/config/api';

// This will log all API requests/responses
debugApi.logRequest('GET', '/tasks', {});
```

### Health Check

```typescript
import { HealthService } from '@/backend/api';

// Check API health
const health = await HealthService.checkHealth();
console.log('API Status:', health.status);

// Check database connectivity
const dbHealth = await HealthService.checkDatabase();
console.log('Database Status:', dbHealth.status);
```