import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
      timeout: 20000,
      forceNew: false, // Don't force new connection
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    this.setupEventListeners();
    
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listener helpers
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Communication specific methods
  joinConversation(conversationId: string) {
    this.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.emit('leave_conversation', { conversationId });
  }

  sendMessage(receiverId: string, content: string, type: string = 'text') {
    console.log('SocketManager.sendMessage called:', { receiverId, content, type, connected: this.socket?.connected });
    if (!this.socket?.connected) {
      console.error('Socket not connected, cannot send message');
      return;
    }
    this.emit('send_message', { receiverId, content, type });
  }

  markMessageAsRead(messageId: string) {
    this.emit('mark_read', { messageId });
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    this.emit('typing', { conversationId, isTyping });
  }

  // Listen for communication events
  onNewMessage(callback: (data: { message: any; conversationId: string }) => void) {
    this.on('new_message', callback);
  }

  onMessageRead(callback: (data: { messageId: string; readBy: string; readAt: Date }) => void) {
    this.on('message_read', callback);
  }

  onUserTyping(callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) {
    this.on('user_typing', callback);
  }

  onMessageSent(callback: (data: { messageId: string }) => void) {
    this.on('message_sent', callback);
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager;
