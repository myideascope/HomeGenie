// API Configuration
// Environment-based configuration for API endpoints and settings

// Environment variables with defaults
const config = {
  // API Base URLs
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws',
  
  // API Settings
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'), // 30 seconds
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(import.meta.env.VITE_RETRY_DELAY || '1000'), // 1 second
  
  // Authentication
  TOKEN_STORAGE_KEY: 'homegenie_auth_token',
  REFRESH_TOKEN_STORAGE_KEY: 'homegenie_refresh_token',
  TOKEN_REFRESH_BUFFER: parseInt(import.meta.env.VITE_TOKEN_REFRESH_BUFFER || '300'), // 5 minutes
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '20'),
  MAX_PAGE_SIZE: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '100'),
  
  // File Upload
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf').split(','),
  
  // Notifications
  NOTIFICATION_POLLING_INTERVAL: parseInt(import.meta.env.VITE_NOTIFICATION_POLLING_INTERVAL || '30000'), // 30 seconds
  ENABLE_PUSH_NOTIFICATIONS: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false',
  
  // Development
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  ENABLE_API_LOGGING: import.meta.env.VITE_ENABLE_API_LOGGING === 'true',
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  
  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_FILE_UPLOAD: import.meta.env.VITE_ENABLE_FILE_UPLOAD !== 'false',
  ENABLE_WEBSOCKETS: import.meta.env.VITE_ENABLE_WEBSOCKETS !== 'false',
  ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  
  // External Services
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  ANALYTICS_TRACKING_ID: import.meta.env.VITE_ANALYTICS_TRACKING_ID || '',
  
  // Theme and UI
  DEFAULT_THEME: import.meta.env.VITE_DEFAULT_THEME || 'light',
  ENABLE_DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE !== 'false',
} as const;

// Validation
const validateConfig = () => {
  const errors: string[] = [];
  
  // Validate required URLs
  if (!config.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }
  
  // Validate numeric values
  if (config.API_TIMEOUT < 1000) {
    errors.push('API_TIMEOUT must be at least 1000ms');
  }
  
  if (config.RETRY_ATTEMPTS < 1 || config.RETRY_ATTEMPTS > 10) {
    errors.push('RETRY_ATTEMPTS must be between 1 and 10');
  }
  
  if (config.DEFAULT_PAGE_SIZE < 1 || config.DEFAULT_PAGE_SIZE > config.MAX_PAGE_SIZE) {
    errors.push('DEFAULT_PAGE_SIZE must be between 1 and MAX_PAGE_SIZE');
  }
  
  if (config.MAX_FILE_SIZE < 1024) {
    errors.push('MAX_FILE_SIZE must be at least 1KB');
  }
  
  // Log warnings for missing optional config
  if (config.IS_PRODUCTION) {
    if (!config.SENTRY_DSN) {
      console.warn('SENTRY_DSN not configured - error tracking disabled');
    }
    
    if (config.ENABLE_ANALYTICS && !config.ANALYTICS_TRACKING_ID) {
      console.warn('ANALYTICS_TRACKING_ID not configured - analytics disabled');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// Validate configuration on module load
if (config.IS_PRODUCTION) {
  validateConfig();
}

// API Endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  
  // Tasks
  tasks: {
    list: '/tasks',
    create: '/tasks',
    get: (id: number) => `/tasks/${id}`,
    update: (id: number) => `/tasks/${id}`,
    delete: (id: number) => `/tasks/${id}`,
    complete: (id: number) => `/tasks/${id}/complete`,
    history: (id: number) => `/tasks/${id}/history`,
    upcoming: '/tasks/upcoming',
    overdue: '/tasks/overdue',
  },
  
  // Properties
  properties: {
    list: '/properties',
    create: '/properties',
    get: (id: number) => `/properties/${id}`,
    update: (id: number) => `/properties/${id}`,
    delete: (id: number) => `/properties/${id}`,
    tasks: (id: number) => `/properties/${id}/tasks`,
    maintenance: (id: number) => `/properties/${id}/maintenance-history`,
    addMaintenance: (id: number) => `/properties/${id}/maintenance-history`,
  },
  
  // Notifications
  notifications: {
    list: '/notifications',
    markRead: (id: number) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    delete: (id: number) => `/notifications/${id}`,
    clear: '/notifications',
    settings: '/notifications/settings',
    test: '/notifications/test',
  },
  
  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    tasks: '/analytics/tasks',
    properties: '/analytics/properties',
  },
  
  // Files
  files: {
    upload: '/files/upload',
    delete: (filename: string) => `/files/${filename}`,
  },
  
  // Health
  health: {
    check: '/health',
    database: '/health/database',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Default Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Client-Version': '1.0.0',
  'X-Client-Platform': 'web',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Task events
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_COMPLETED: 'task_completed',
  
  // Property events
  PROPERTY_CREATED: 'property_created',
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_DELETED: 'property_deleted',
  
  // Notification events
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_READ: 'notification_read',
  
  // System events
  USER_ACTIVITY: 'user_activity',
  SYSTEM_MAINTENANCE: 'system_maintenance',
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  // Cache TTL in milliseconds
  TTL: {
    SHORT: 5 * 60 * 1000,      // 5 minutes
    MEDIUM: 30 * 60 * 1000,    // 30 minutes
    LONG: 2 * 60 * 60 * 1000,  // 2 hours
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Cache keys
  KEYS: {
    USER_PROFILE: 'user_profile',
    DASHBOARD_STATS: 'dashboard_stats',
    TASK_ANALYTICS: 'task_analytics',
    PROPERTY_ANALYTICS: 'property_analytics',
    NOTIFICATION_SETTINGS: 'notification_settings',
  },
} as const;

// Export configuration
export default config;

// Helper functions
export const getApiUrl = (path: string): string => {
  return `${config.API_BASE_URL}${path}`;
};

export const getWsUrl = (path: string = ''): string => {
  return `${config.WS_BASE_URL}${path}`;
};

export const isValidFileType = (file: File): boolean => {
  return config.ALLOWED_FILE_TYPES.includes(file.type);
};

export const isValidFileSize = (file: File): boolean => {
  return file.size <= config.MAX_FILE_SIZE;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Development helpers
export const debugApi = {
  logRequest: (method: string, url: string, data?: any) => {
    if (config.ENABLE_API_LOGGING) {
      console.group(`🔄 API ${method.toUpperCase()} ${url}`);
      console.log('Request URL:', url);
      if (data) console.log('Request Data:', data);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },
  
  logResponse: (method: string, url: string, status: number, data?: any) => {
    if (config.ENABLE_API_LOGGING) {
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.group(`${emoji} API ${method.toUpperCase()} ${url} - ${status}`);
      console.log('Response Status:', status);
      if (data) console.log('Response Data:', data);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },
  
  logError: (method: string, url: string, error: any) => {
    if (config.ENABLE_API_LOGGING) {
      console.group(`💥 API ${method.toUpperCase()} ${url} - ERROR`);
      console.error('Error:', error);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },
};