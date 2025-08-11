// React hooks for API integration
// Provides React-friendly wrappers around API services

import { useState, useEffect, useCallback } from 'react';
import {
  AuthService,
  TaskService,
  PropertyService,
  NotificationService,
  AnalyticsService,
  FileService,
  ErrorHandler,
  RetryUtil,
  type LoginRequest,
  type RegisterRequest,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  type CreatePropertyRequest,
  type UpdatePropertyRequest,
  type PaginatedResponse
} from '../backend/api';

// Generic hook state interface
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface ApiMutationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Authentication hooks
export const useAuth = () => {
  const [state, setState] = useState<ApiState<any> & {
    isAuthenticated: boolean;
    user: any | null;
  }>({
    data: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    user: null,
    refetch: async () => {}
  });

  const [loginState, setLoginState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const [registerState, setRegisterState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setState(prev => ({
          ...prev,
          data: user,
          user,
          isAuthenticated: true,
          loading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          data: null,
          user: null,
          isAuthenticated: false,
          loading: false,
          error: ErrorHandler.handleApiError(error)
        }));
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoginState({ loading: true, error: null, success: false });
    
    try {
      const response = await RetryUtil.withRetry(() => 
        AuthService.login(credentials)
      );
      
      setState(prev => ({
        ...prev,
        data: response.user,
        user: response.user,
        isAuthenticated: true,
        error: null
      }));
      
      setLoginState({ loading: false, error: null, success: true });
      return response;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setLoginState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    setRegisterState({ loading: true, error: null, success: false });
    
    try {
      const response = await RetryUtil.withRetry(() => 
        AuthService.register(userData)
      );
      
      setState(prev => ({
        ...prev,
        data: response.user,
        user: response.user,
        isAuthenticated: true,
        error: null
      }));
      
      setRegisterState({ loading: false, error: null, success: true });
      return response;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setRegisterState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } finally {
      setState(prev => ({
        ...prev,
        data: null,
        user: null,
        isAuthenticated: false,
        error: null
      }));
    }
  }, []);

  const updateProfile = useCallback(async (updates: any) => {
    try {
      const updatedUser = await AuthService.updateProfile(updates);
      setState(prev => ({
        ...prev,
        data: updatedUser,
        user: updatedUser
      }));
      return updatedUser;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    loginState,
    registerState
  };
};

// Tasks hooks
export const useTasks = (filters?: any) => {
  const [state, setState] = useState<ApiState<PaginatedResponse<any>>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchTasks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const tasks = await RetryUtil.withRetry(() => 
        TaskService.getTasks(filters)
      );
      
      setState(prev => ({
        ...prev,
        data: tasks,
        loading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: ErrorHandler.handleApiError(error)
      }));
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const refetch = useCallback(() => fetchTasks(), [fetchTasks]);

  return { ...state, refetch };
};

export const useTask = (id: number) => {
  const [state, setState] = useState<ApiState<any>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchTask = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const task = await RetryUtil.withRetry(() => 
        TaskService.getTask(id)
      );
      
      setState(prev => ({
        ...prev,
        data: task,
        loading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: ErrorHandler.handleApiError(error)
      }));
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const refetch = useCallback(() => fetchTask(), [fetchTask]);

  return { ...state, refetch };
};

export const useTaskMutations = () => {
  const [createState, setCreateState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const [updateState, setUpdateState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const [deleteState, setDeleteState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const createTask = useCallback(async (taskData: CreateTaskRequest) => {
    setCreateState({ loading: true, error: null, success: false });
    
    try {
      const task = await RetryUtil.withRetry(() => 
        TaskService.createTask(taskData)
      );
      
      setCreateState({ loading: false, error: null, success: true });
      return task;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setCreateState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (id: number, updates: UpdateTaskRequest) => {
    setUpdateState({ loading: true, error: null, success: false });
    
    try {
      const task = await RetryUtil.withRetry(() => 
        TaskService.updateTask(id, updates)
      );
      
      setUpdateState({ loading: false, error: null, success: true });
      return task;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setUpdateState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    setDeleteState({ loading: true, error: null, success: false });
    
    try {
      await RetryUtil.withRetry(() => 
        TaskService.deleteTask(id)
      );
      
      setDeleteState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setDeleteState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const completeTask = useCallback(async (id: number) => {
    setUpdateState({ loading: true, error: null, success: false });
    
    try {
      const task = await RetryUtil.withRetry(() => 
        TaskService.completeTask(id)
      );
      
      setUpdateState({ loading: false, error: null, success: true });
      return task;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setUpdateState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  return {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    createState,
    updateState,
    deleteState
  };
};

// Properties hooks
export const useProperties = (filters?: any) => {
  const [state, setState] = useState<ApiState<PaginatedResponse<any>>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchProperties = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const properties = await RetryUtil.withRetry(() => 
        PropertyService.getProperties(filters)
      );
      
      setState(prev => ({
        ...prev,
        data: properties,
        loading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: ErrorHandler.handleApiError(error)
      }));
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const refetch = useCallback(() => fetchProperties(), [fetchProperties]);

  return { ...state, refetch };
};

export const usePropertyMutations = () => {
  const [createState, setCreateState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const [updateState, setUpdateState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const [deleteState, setDeleteState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const createProperty = useCallback(async (propertyData: CreatePropertyRequest) => {
    setCreateState({ loading: true, error: null, success: false });
    
    try {
      const property = await RetryUtil.withRetry(() => 
        PropertyService.createProperty(propertyData)
      );
      
      setCreateState({ loading: false, error: null, success: true });
      return property;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setCreateState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const updateProperty = useCallback(async (id: number, updates: UpdatePropertyRequest) => {
    setUpdateState({ loading: true, error: null, success: false });
    
    try {
      const property = await RetryUtil.withRetry(() => 
        PropertyService.updateProperty(id, updates)
      );
      
      setUpdateState({ loading: false, error: null, success: true });
      return property;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setUpdateState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const deleteProperty = useCallback(async (id: number) => {
    setDeleteState({ loading: true, error: null, success: false });
    
    try {
      await RetryUtil.withRetry(() => 
        PropertyService.deleteProperty(id)
      );
      
      setDeleteState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setDeleteState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  return {
    createProperty,
    updateProperty,
    deleteProperty,
    createState,
    updateState,
    deleteState
  };
};

// Notifications hooks
export const useNotifications = (filters?: any) => {
  const [state, setState] = useState<ApiState<PaginatedResponse<any>>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchNotifications = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const notifications = await RetryUtil.withRetry(() => 
        NotificationService.getNotifications(filters)
      );
      
      setState(prev => ({
        ...prev,
        data: notifications,
        loading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: ErrorHandler.handleApiError(error)
      }));
    }
  }, [filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const refetch = useCallback(() => fetchNotifications(), [fetchNotifications]);

  return { ...state, refetch };
};

export const useNotificationMutations = () => {
  const [markReadState, setMarkReadState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const markAsRead = useCallback(async (id: number) => {
    setMarkReadState({ loading: true, error: null, success: false });
    
    try {
      await RetryUtil.withRetry(() => 
        NotificationService.markAsRead(id)
      );
      
      setMarkReadState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setMarkReadState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setMarkReadState({ loading: true, error: null, success: false });
    
    try {
      await RetryUtil.withRetry(() => 
        NotificationService.markAllAsRead()
      );
      
      setMarkReadState({ loading: false, error: null, success: true });
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setMarkReadState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await RetryUtil.withRetry(() => 
        NotificationService.deleteNotification(id)
      );
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markReadState
  };
};

// Analytics hooks
export const useDashboardStats = () => {
  const [state, setState] = useState<ApiState<any>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const stats = await RetryUtil.withRetry(() => 
        AnalyticsService.getDashboardStats()
      );
      
      setState(prev => ({
        ...prev,
        data: stats,
        loading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: ErrorHandler.handleApiError(error)
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => fetchStats(), [fetchStats]);

  return { ...state, refetch };
};

export const useTaskAnalytics = (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
  const [state, setState] = useState<ApiState<any>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const analytics = await RetryUtil.withRetry(() => 
        AnalyticsService.getTaskAnalytics(period)
      );
      
      setState(prev => ({
        ...prev,
        data: analytics,
        loading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: ErrorHandler.handleApiError(error)
      }));
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refetch = useCallback(() => fetchAnalytics(), [fetchAnalytics]);

  return { ...state, refetch };
};

// File upload hook
export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<ApiMutationState & {
    progress: number;
  }>({
    loading: false,
    error: null,
    success: false,
    progress: 0
  });

  const uploadFile = useCallback(async (
    file: File, 
    category: 'avatar' | 'property' | 'task' | 'maintenance'
  ) => {
    setUploadState({ loading: true, error: null, success: false, progress: 0 });
    
    try {
      // For simplicity, we'll just call the upload service
      // In a real implementation, you might want to track upload progress
      const result = await FileService.uploadFile(file, category);
      
      setUploadState({ loading: false, error: null, success: true, progress: 100 });
      return result;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setUploadState({ loading: false, error: errorMessage, success: false, progress: 0 });
      throw error;
    }
  }, []);

  return {
    uploadFile,
    ...uploadState
  };
};

// Generic mutation hook for custom operations
export const useMutation = <T, P>(
  mutationFn: (params: P) => Promise<T>
) => {
  const [state, setState] = useState<ApiMutationState>({
    loading: false,
    error: null,
    success: false
  });

  const mutate = useCallback(async (params: P) => {
    setState({ loading: true, error: null, success: false });
    
    try {
      const result = await RetryUtil.withRetry(() => mutationFn(params));
      setState({ loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const errorMessage = ErrorHandler.handleApiError(error);
      setState({ loading: false, error: errorMessage, success: false });
      throw error;
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return {
    mutate,
    reset,
    ...state
  };
};