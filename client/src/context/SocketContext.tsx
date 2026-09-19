import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ActivityLog, NotificationItem } from '../types';
import { activityService } from '../services/activityService';
import { notificationService } from '../services/notificationService';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  onlineUserIds: string[];
  activities: ActivityLog[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  toastMessage: string | null;
  clearToast: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Load initial missed/recent 20 activities from database (never cache)
  const loadRecentActivities = async () => {
    try {
      const recent = await activityService.getRecentMissed();
      setActivities(recent);
    } catch (err) {
      console.error('Failed to load recent activities from database:', err);
    }
  };

  // Load initial notifications
  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadNotificationCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (!accessToken || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      setActivities([]);
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }

    // Load initial 20 activities and notifications from PostgreSQL
    loadRecentActivities();
    loadNotifications();

    // Initialize Socket.IO connection
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl, {
      auth: { token: accessToken },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Upon reconnecting, automatically sync latest 20 database events
      loadRecentActivities();
      loadNotifications();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Presence updates
    newSocket.on('presence:count', (data: { onlineCount: number; userIds: string[] }) => {
      setOnlineCount(data.onlineCount);
      setOnlineUserIds(data.userIds || []);
    });

    // Real-time activity events
    newSocket.on('activity:new', (newActivity: ActivityLog) => {
      setActivities((prev) => {
        // Prevent duplicates
        if (prev.some((a) => a.id === newActivity.id)) return prev;
        return [newActivity, ...prev].slice(0, 50);
      });

      // Show temporary toast notification
      setToastMessage(newActivity.message);
    });

    // Real-time notifications
    newSocket.on('notification:new', (newNotification: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
      });
      setUnreadNotificationCount((prev) => prev + 1);
      setToastMessage(`🔔 ${newNotification.title}: ${newNotification.message}`);
    });

    // Real-time notification count update
    newSocket.on('notification:count', (data: { unreadCount: number }) => {
      setUnreadNotificationCount(data.unreadCount);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user?.id]);

  const markNotificationRead = async (id: string) => {
    try {
      const result = await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationCount(result.unreadCount);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const clearToast = () => setToastMessage(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        onlineUserIds,
        activities,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        refreshActivities: loadRecentActivities,
        toastMessage,
        clearToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
