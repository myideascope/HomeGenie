// HomeGenie API Integration Layer
// Comprehensive client for connecting with Go backend services

// Type definitions for API communication
interface Task {
  id: number;
  title: string;
  description?: string;
  property: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  category: string;
  estimatedTime?: number;
  assignee?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  type: "house" | "apartment" | "condo" | "townhouse" | "other";
  yearBuilt?: number;
  squareFootage?: number;
  rooms: Room[];
  maintenanceHistory: MaintenanceRecord[];
  notes?: string;
  createdAt: string;
}

interface Room {
  id: number;
  name: string;
  type: "bedroom" | "bathroom" | "kitchen" | "living" | "garage" | "basement" | "attic" | "office" | "other";
  floorArea?: number;
  description?: string;
}

interface MaintenanceRecord {
  id: number;
  taskId?: number;
  title: string;
  description: string;
  completedDate: string;
  cost?: number;
  contractor?: string;
  notes?: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  timezone: string;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    theme: "light" | "dark" | "system";
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    timeFormat: "12h" | "24h";
  };
  createdAt: string;
  lastLoginAt?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "task_reminder" | "maintenance_due" | "system" | "alert";
  priority: "low" | "medium" | "high";
  read: boolean;
  taskId?: number;
  propertyId?: number;
  createdAt: string;
  scheduledFor?: string;
  actionUrl?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  reminderAdvance: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  taskReminders: boolean;
  maintenanceAlerts: boolean;
  systemNotifications: boolean;
}

// Environment configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const API_TIMEOUT = 30000; // 30 seconds

// API Response types
interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
}

interface ApiError {
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication types
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  timezone?: string;
}

// Request types for different entities
interface CreateTaskRequest {
  title: string;
  description?: string;
  propertyId: number;
  priority: Task['priority'];
  dueDate: string;
  category: string;
  estimatedTime?: number;
  assignee?: string;
  notes?: string;
}

interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: Task['status'];
  completedAt?: string;
}

interface CreatePropertyRequest {
  name: string;
  address: string;
  type: Property['type'];
  yearBuilt?: number;
  squareFootage?: number;
  notes?: string;
}

interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {}

// HTTP Client class with authentication and error handling
class HttpClient {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor(baseURL: string, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    
    // Try to load token from localStorage
    this.authToken = localStorage.getItem('homegenie_auth_token');
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('homegenie_auth_token', token);
    } else {
      localStorage.removeItem('homegenie_auth_token');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add authentication header if token exists
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: 'HTTP_ERROR',
          timestamp: new Date().toISOString()
        }));

        // Handle 401 Unauthorized - clear token and redirect to login
        if (response.status === 401) {
          this.setAuthToken(null);
          window.location.href = '/login';
        }

        throw new ApiError(errorData.error, response.status, errorData);
      }

      // Parse JSON response
      const data: ApiResponse<T> = await response.json();
      return data.data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, { timeout: this.timeout });
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        { originalError: error }
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return this.makeRequest<T>(endpoint + url.search, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

// Custom API Error class
class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = details?.code || 'API_ERROR';
    this.details = details;
  }
}

// Initialize HTTP client
const httpClient = new HttpClient(API_BASE_URL);

// Authentication Service
export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/login', credentials);
    
    // Store authentication token
    httpClient.setAuthToken(response.token);
    
    return response;
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/register', userData);
    
    // Store authentication token
    httpClient.setAuthToken(response.token);
    
    return response;
  }

  static async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } finally {
      // Always clear token, even if logout request fails
      httpClient.setAuthToken(null);
    }
  }

  static async refreshToken(): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/refresh');
    httpClient.setAuthToken(response.token);
    return response;
  }

  static async getCurrentUser(): Promise<User> {
    return httpClient.get<User>('/auth/me');
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    return httpClient.put<User>('/auth/profile', updates);
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return httpClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  static async forgotPassword(email: string): Promise<void> {
    return httpClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    return httpClient.post('/auth/reset-password', { token, newPassword });
  }
}

// Task Service
export class TaskService {
  static async getTasks(filters?: {
    status?: Task['status'];
    priority?: Task['priority'];
    propertyId?: number;
    assignee?: string;
    dueAfter?: string;
    dueBefore?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Task>> {
    return httpClient.get<PaginatedResponse<Task>>('/tasks', filters);
  }

  static async getTask(id: number): Promise<Task> {
    return httpClient.get<Task>(`/tasks/${id}`);
  }

  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    return httpClient.post<Task>('/tasks', taskData);
  }

  static async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    return httpClient.put<Task>(`/tasks/${id}`, updates);
  }

  static async deleteTask(id: number): Promise<void> {
    return httpClient.delete(`/tasks/${id}`);
  }

  static async completeTask(id: number): Promise<Task> {
    return httpClient.patch<Task>(`/tasks/${id}/complete`);
  }

  static async getTaskHistory(id: number): Promise<Task[]> {
    return httpClient.get<Task[]>(`/tasks/${id}/history`);
  }

  static async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    return httpClient.get<Task[]>('/tasks/upcoming', { days });
  }

  static async getOverdueTasks(): Promise<Task[]> {
    return httpClient.get<Task[]>('/tasks/overdue');
  }
}

// Property Service
export class PropertyService {
  static async getProperties(filters?: {
    type?: Property['type'];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Property>> {
    return httpClient.get<PaginatedResponse<Property>>('/properties', filters);
  }

  static async getProperty(id: number): Promise<Property> {
    return httpClient.get<Property>(`/properties/${id}`);
  }

  static async createProperty(propertyData: CreatePropertyRequest): Promise<Property> {
    return httpClient.post<Property>('/properties', propertyData);
  }

  static async updateProperty(id: number, updates: UpdatePropertyRequest): Promise<Property> {
    return httpClient.put<Property>(`/properties/${id}`, updates);
  }

  static async deleteProperty(id: number): Promise<void> {
    return httpClient.delete(`/properties/${id}`);
  }

  static async getPropertyTasks(id: number, filters?: {
    status?: Task['status'];
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Task>> {
    return httpClient.get<PaginatedResponse<Task>>(`/properties/${id}/tasks`, filters);
  }

  static async getPropertyMaintenanceHistory(id: number): Promise<Property['maintenanceHistory']> {
    return httpClient.get<Property['maintenanceHistory']>(`/properties/${id}/maintenance-history`);
  }

  static async addMaintenanceRecord(propertyId: number, record: Omit<Property['maintenanceHistory'][0], 'id'>): Promise<Property['maintenanceHistory'][0]> {
    return httpClient.post<Property['maintenanceHistory'][0]>(`/properties/${propertyId}/maintenance-history`, record);
  }
}

// Notification Service
export class NotificationService {
  static async getNotifications(filters?: {
    read?: boolean;
    type?: Notification['type'];
    priority?: Notification['priority'];
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Notification>> {
    return httpClient.get<PaginatedResponse<Notification>>('/notifications', filters);
  }

  static async markAsRead(id: number): Promise<void> {
    return httpClient.patch(`/notifications/${id}/read`);
  }

  static async markAllAsRead(): Promise<void> {
    return httpClient.patch('/notifications/read-all');
  }

  static async deleteNotification(id: number): Promise<void> {
    return httpClient.delete(`/notifications/${id}`);
  }

  static async clearAllNotifications(): Promise<void> {
    return httpClient.delete('/notifications');
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    return httpClient.get<NotificationSettings>('/notifications/settings');
  }

  static async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return httpClient.put<NotificationSettings>('/notifications/settings', settings);
  }

  static async testNotification(type: Notification['type']): Promise<void> {
    return httpClient.post('/notifications/test', { type });
  }
}

// Analytics Service
export class AnalyticsService {
  static async getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalProperties: number;
    recentActivity: Array<{
      id: number;
      type: 'task' | 'property' | 'maintenance';
      title: string;
      timestamp: string;
    }>;
  }> {
    return httpClient.get('/analytics/dashboard');
  }

  static async getTaskAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    tasksByStatus: Record<Task['status'], number>;
    tasksByPriority: Record<Task['priority'], number>;
    tasksByCategory: Record<string, number>;
    completionTrend: Array<{
      date: string;
      completed: number;
      created: number;
    }>;
  }> {
    return httpClient.get('/analytics/tasks', { period });
  }

  static async getPropertyAnalytics(): Promise<{
    propertiesByType: Record<Property['type'], number>;
    maintenanceCosts: Array<{
      propertyId: number;
      propertyName: string;
      totalCost: number;
      averageCost: number;
    }>;
    taskDistribution: Array<{
      propertyId: number;
      propertyName: string;
      taskCount: number;
      completedTasks: number;
    }>;
  }> {
    return httpClient.get('/analytics/properties');
  }
}

// File Upload Service
export class FileService {
  static async uploadFile(file: File, category: 'avatar' | 'property' | 'task' | 'maintenance'): Promise<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    // Special handling for file uploads
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': httpClient['authToken'] ? `Bearer ${httpClient['authToken']}` : ''
      },
      body: formData
    });

    if (!response.ok) {
      throw new ApiError(`Upload failed: ${response.statusText}`, response.status);
    }

    const data: ApiResponse<any> = await response.json();
    return data.data;
  }

  static async deleteFile(filename: string): Promise<void> {
    return httpClient.delete(`/files/${filename}`);
  }
}

// Health Check Service
export class HealthService {
  static async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    version: string;
    timestamp: string;
    services: Record<string, 'up' | 'down'>;
  }> {
    return httpClient.get('/health');
  }

  static async checkDatabase(): Promise<{
    status: 'connected' | 'disconnected';
    latency: number;
  }> {
    return httpClient.get('/health/database');
  }
}

// Error Handling Utilities
export class ErrorHandler {
  static handleApiError(error: any): string {
    if (error instanceof ApiError) {
      // Handle specific error codes
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return 'Please check your input and try again.';
        case 'AUTHENTICATION_ERROR':
          return 'Please log in to continue.';
        case 'AUTHORIZATION_ERROR':
          return 'You do not have permission to perform this action.';
        case 'NOT_FOUND':
          return 'The requested resource was not found.';
        case 'CONFLICT':
          return 'This action conflicts with existing data.';
        case 'RATE_LIMITED':
          return 'Too many requests. Please wait a moment and try again.';
        default:
          return error.message;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  static isNetworkError(error: any): boolean {
    return error instanceof ApiError && (
      error.status === 0 || 
      error.status === 408 || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('timeout')
    );
  }

  static shouldRetry(error: any): boolean {
    if (!(error instanceof ApiError)) return false;
    
    // Retry on network errors and 5xx server errors
    return error.status === 0 || 
           error.status === 408 || 
           (error.status >= 500 && error.status < 600);
  }
}

// Retry Utility
export class RetryUtil {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt or if shouldn't retry
        if (attempt === maxAttempts || !ErrorHandler.shouldRetry(error)) {
          throw error;
        }
        
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Export the HTTP client and error classes for direct use
export { httpClient, ApiError };

// Type exports for use in components
export type {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreatePropertyRequest,
  UpdatePropertyRequest
};