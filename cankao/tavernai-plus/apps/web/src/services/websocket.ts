import { io, Socket } from 'socket.io-client';
import { useNotificationsStore } from '@/stores';
import { ElNotification } from 'element-plus';

/**
 * WebSocket Service (T070 - Frontend Integration)
 * Handles real-time communication with backend via Socket.IO
 */
class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      this.socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
      console.log('[WebSocket] Connection initiated');
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.isConnecting = false;

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    });

    // Notification events
    this.socket.on('notification:new', (data: {
      notification: any;
      timestamp: string;
    }) => {
      this.handleNewNotification(data.notification);
    });

    this.socket.on('notification:read', (data: {
      notificationId: string;
      timestamp: string;
    }) => {
      this.handleNotificationRead(data.notificationId);
    });

    this.socket.on('notification:deleted', (data: {
      notificationId: string;
      timestamp: string;
    }) => {
      this.handleNotificationDeleted(data.notificationId);
    });

    this.socket.on('notification:unread_count', (data: {
      count: number;
      timestamp: string;
    }) => {
      this.handleUnreadCountUpdate(data.count);
    });

    this.socket.on('notification:broadcast', (data: {
      notification: any;
      timestamp: string;
    }) => {
      this.handleBroadcastNotification(data.notification);
    });

    // User status events
    this.socket.on('user_online', (data: { userId: string }) => {
      console.log('[WebSocket] User online:', data.userId);
    });

    this.socket.on('user_offline', (data: { userId: string }) => {
      console.log('[WebSocket] User offline:', data.userId);
    });

    // Chat events (existing functionality)
    this.socket.on('message', (data) => {
      console.log('[WebSocket] New message:', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('[WebSocket] User typing:', data);
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error('[WebSocket] Server error:', data);
    });
  }

  /**
   * Handle new notification
   */
  private handleNewNotification(notification: any): void {
    const notificationsStore = useNotificationsStore();

    // Add to store
    notificationsStore.notifications.unshift(notification);
    notificationsStore.unreadCount++;

    // Show toast for urgent/high priority notifications
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      ElNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type === 'error' ? 'error' : notification.type === 'success' ? 'success' : 'info',
        duration: notification.priority === 'urgent' ? 0 : 5000,
        onClick: () => {
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        },
      });
    }

    console.log('[WebSocket] New notification received:', notification.title);
  }

  /**
   * Handle notification read status update
   */
  private handleNotificationRead(notificationId: string): void {
    const notificationsStore = useNotificationsStore();
    const notification = notificationsStore.notifications.find((n: any) => n.id === notificationId);

    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      notificationsStore.unreadCount = Math.max(0, notificationsStore.unreadCount - 1);
    }
  }

  /**
   * Handle notification deletion
   */
  private handleNotificationDeleted(notificationId: string): void {
    const notificationsStore = useNotificationsStore();
    const index = notificationsStore.notifications.findIndex((n: any) => n.id === notificationId);

    if (index !== -1) {
      const notification = notificationsStore.notifications[index];
      if (!notification.read) {
        notificationsStore.unreadCount = Math.max(0, notificationsStore.unreadCount - 1);
      }
      notificationsStore.notifications.splice(index, 1);
    }
  }

  /**
   * Handle unread count update
   */
  private handleUnreadCountUpdate(count: number): void {
    const notificationsStore = useNotificationsStore();
    notificationsStore.unreadCount = count;
  }

  /**
   * Handle broadcast notification
   */
  private handleBroadcastNotification(notification: any): void {
    ElNotification({
      title: `📢 ${notification.title}`,
      message: notification.message,
      type: 'info',
      duration: 10000,
    });

    console.log('[WebSocket] Broadcast notification:', notification.title);
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
      ElNotification({
        title: 'Connection Lost',
        message: 'Unable to connect to server. Please refresh the page.',
        type: 'error',
        duration: 0,
      });
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      console.log('[WebSocket] Disconnected');
    }
  }

  /**
   * Join a chat session room
   */
  joinSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join', { sessionId });
    }
  }

  /**
   * Leave a chat session room
   */
  leaveSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave', { sessionId });
    }
  }

  /**
   * Send a message
   */
  sendMessage(data: { sessionId: string; content: string; characterId?: string }): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(sessionId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { sessionId, isTyping });
    }
  }

  /**
   * Get online users count
   */
  getOnlineStatus(): void {
    if (this.socket?.connected) {
      this.socket.emit('online_status');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
