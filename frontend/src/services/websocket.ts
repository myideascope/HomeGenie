// WebSocket Client for Real-time Communication
// Handles real-time updates for tasks, notifications, and system events

import config, { WS_EVENTS } from '../config/api';

// WebSocket Message Types
interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
  id?: string;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastConnected: Date | null;
  lastError: string | null;
}

// Event Listeners
type EventListener<T = any> = (data: T) => void;
type EventListeners = Map<string, Set<EventListener>>;

// WebSocket Client Class
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 5000; // 5 seconds
  private maxReconnectAttempts: number = 10;
  private pingInterval: number = 30000; // 30 seconds
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  private state: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastConnected: null,
    lastError: null
  };
  
  private listeners: EventListeners = new Map();
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    this.url = baseUrl || config.WS_BASE_URL;
    
    // Get auth token from localStorage
    this.authToken = localStorage.getItem(config.TOKEN_STORAGE_KEY);
    
    // Listen for auth token changes
    this.setupAuthListener();
  }

  // Setup listener for authentication changes
  private setupAuthListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === config.TOKEN_STORAGE_KEY) {
        this.authToken = event.newValue;
        
        // Reconnect with new token
        if (this.state.isConnected) {
          this.disconnect();
          this.connect();
        }
      }
    });
  }

  // Connect to WebSocket server
  public connect(): Promise<void> {
    if (this.state.isConnecting || this.state.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.state.isConnecting = true;
        this.state.lastError = null;

        // Build WebSocket URL with auth token
        const wsUrl = new URL(this.url);
        if (this.authToken) {
          wsUrl.searchParams.set('token', this.authToken);
        }

        this.ws = new WebSocket(wsUrl.toString());

        // Connection opened
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.state.isConnected = true;
          this.state.isConnecting = false;
          this.state.reconnectAttempts = 0;
          this.state.lastConnected = new Date();
          
          this.startPing();
          this.emit('connection', { status: 'connected' });
          resolve();
        };

        // Message received
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        // Connection closed
        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.state.isConnected = false;
          this.state.isConnecting = false;
          
          this.stopPing();
          this.emit('connection', { status: 'disconnected', code: event.code, reason: event.reason });
          
          // Attempt to reconnect if not intentionally closed
          if (event.code !== 1000 && this.state.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        // Connection error
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.state.lastError = 'Connection error';
          this.state.isConnecting = false;
          
          this.emit('connection', { status: 'error', error: 'Connection failed' });
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.state.isConnecting = false;
        this.state.lastError = error instanceof Error ? error.message : 'Unknown error';
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPing();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.state.isConnected = false;
    this.state.isConnecting = false;
    this.state.reconnectAttempts = 0;
  }

  // Send message to server
  public send<T = any>(type: string, data: T): boolean {
    if (!this.state.isConnected || !this.ws) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const message: WebSocketMessage<T> = {
        type,
        data,
        timestamp: new Date().toISOString(),
        id: this.generateMessageId()
      };

      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  // Subscribe to events
  public on<T = any>(event: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Unsubscribe from events
  public off(event: string, listener?: EventListener): void {
    if (!listener) {
      // Remove all listeners for this event
      this.listeners.delete(event);
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit event to listeners
  private emit<T = any>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for '${event}':`, error);
        }
      });
    }
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    const { type, data } = message;
    
    // Handle built-in message types
    switch (type) {
      case 'ping':
        this.send('pong', { timestamp: new Date().toISOString() });
        break;
        
      case 'pong':
        // Server responded to ping
        break;
        
      case 'auth_required':
        console.warn('WebSocket authentication required');
        this.emit('auth_required', data);
        break;
        
      case 'auth_success':
        console.log('WebSocket authentication successful');
        this.emit('auth_success', data);
        break;
        
      case 'auth_failed':
        console.error('WebSocket authentication failed');
        this.emit('auth_failed', data);
        break;
        
      default:
        // Emit custom event
        this.emit(type, data);
        break;
    }
  }

  // Start ping to keep connection alive
  private startPing(): void {
    this.stopPing();
    
    this.pingTimer = setInterval(() => {
      if (this.state.isConnected) {
        this.send('ping', { timestamp: new Date().toISOString() });
      }
    }, this.pingInterval);
  }

  // Stop ping timer
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.state.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.state.reconnectAttempts - 1), 30000);
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.state.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.state.isConnected) {
        console.log(`Attempting WebSocket reconnect ${this.state.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect().catch(() => {
          // Connection failed, will be handled by onclose
        });
      }
    }, delay);
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get connection state
  public getState(): ConnectionState {
    return { ...this.state };
  }

  // Check if connected
  public isConnected(): boolean {
    return this.state.isConnected;
  }

  // Update auth token
  public setAuthToken(token: string | null): void {
    this.authToken = token;
    
    // If connected, send auth message
    if (this.state.isConnected && token) {
      this.send('auth', { token });
    }
  }
}

// Singleton WebSocket client instance
let wsClient: WebSocketClient | null = null;

// Get or create WebSocket client
export const getWebSocketClient = (): WebSocketClient => {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
};

// React hook for WebSocket connection
export const useWebSocket = () => {
  const client = getWebSocketClient();
  
  return {
    client,
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    send: (type: string, data: any) => client.send(type, data),
    on: (event: string, listener: EventListener) => client.on(event, listener),
    off: (event: string, listener?: EventListener) => client.off(event, listener),
    isConnected: () => client.isConnected(),
    getState: () => client.getState()
  };
};

// Specific event hooks
export const useTaskEvents = (onTaskUpdate?: (task: any) => void) => {
  const client = getWebSocketClient();
  
  return {
    subscribeToTaskUpdates: () => {
      const unsubscribers = [
        client.on(WS_EVENTS.TASK_CREATED, onTaskUpdate || (() => {})),
        client.on(WS_EVENTS.TASK_UPDATED, onTaskUpdate || (() => {})),
        client.on(WS_EVENTS.TASK_DELETED, onTaskUpdate || (() => {})),
        client.on(WS_EVENTS.TASK_COMPLETED, onTaskUpdate || (() => {}))
      ];
      
      return () => unsubscribers.forEach(unsub => unsub());
    }
  };
};

export const useNotificationEvents = (onNotification?: (notification: any) => void) => {
  const client = getWebSocketClient();
  
  return {
    subscribeToNotifications: () => {
      const unsubscribers = [
        client.on(WS_EVENTS.NOTIFICATION_RECEIVED, onNotification || (() => {})),
        client.on(WS_EVENTS.NOTIFICATION_READ, () => {
          // Handle notification read event
        })
      ];
      
      return () => unsubscribers.forEach(unsub => unsub());
    }
  };
};

// Auto-connect when enabled
if (config.ENABLE_WEBSOCKETS && typeof window !== 'undefined') {
  // Connect when auth token is available
  const checkAndConnect = () => {
    const token = localStorage.getItem(config.TOKEN_STORAGE_KEY);
    if (token) {
      const client = getWebSocketClient();
      client.setAuthToken(token);
      client.connect().catch(error => {
        console.warn('Failed to auto-connect WebSocket:', error);
      });
    }
  };
  
  // Check on page load
  if (document.readyState === 'complete') {
    checkAndConnect();
  } else {
    window.addEventListener('load', checkAndConnect);
  }
  
  // Listen for auth changes
  window.addEventListener('storage', (event) => {
    if (event.key === config.TOKEN_STORAGE_KEY && event.newValue) {
      checkAndConnect();
    }
  });
}

export default getWebSocketClient;