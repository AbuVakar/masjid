import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useNotify } from '../context/NotificationContext';
import soundAlerts from '../utils/soundAlerts';
import apiService from '../services/api';

/**
 * Hook for handling real-time admin notifications
 * Only works for admin users
 */
export const useAdminNotifications = () => {
  const { user, isAdmin } = useUser();
  const { notify } = useNotify();

  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [connectionStats, setConnectionStats] = useState({
    activeSubscribers: 0,
    queueLength: 0,
    isProcessing: false,
    totalNotifications: 0,
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async () => {
    if (!isAdmin || !user) {
      console.log('Admin notifications: User is not admin or not logged in');
      return;
    }

    try {
      // Get JWT token from localStorage
      let token = localStorage.getItem('token');
      if (!token) {
        console.error('Admin notifications: No JWT token found');
        return;
      }

      // Try to refresh token if it might be expired
      try {
        const refreshedToken = await apiService.refreshToken();
        if (refreshedToken) {
          token = refreshedToken;
          console.log('Admin notifications: Token refreshed successfully');
        } else {
          console.log('Admin notifications: No token refresh needed');
        }
      } catch (refreshError) {
        console.error(
          'Admin notifications: Token refresh failed, trying with current token',
          refreshError,
        );
        // If refresh fails, check if we still have a token
        token = localStorage.getItem('token');
        if (!token) {
          console.error(
            'Admin notifications: No token available after refresh failure',
          );
          return;
        }
      }

      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host =
        process.env.REACT_APP_API_URL?.replace(/^https?:\/\//, '') ||
        'localhost:5000';
      const wsUrl = `${protocol}//${host}/ws/admin-notifications?token=${token}`;

      console.log('Admin notifications: Connecting to', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Admin notifications: WebSocket connected');
        setIsConnected(true);

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'PING' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Admin notifications: Error parsing message', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(
          'Admin notifications: WebSocket disconnected',
          event.code,
          event.reason,
        );
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          console.log('Admin notifications: Attempting to reconnect...');
          reconnectTimeoutRef.current = setTimeout(async () => {
            try {
              await connect();
            } catch (error) {
              console.error('Reconnection failed:', error);
            }
          }, 5000); // Reconnect after 5 seconds
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Admin notifications: WebSocket error', error);
        setIsConnected(false);
        // Safely play error sound
        try {
          soundAlerts.playErrorSound();
        } catch (soundError) {
          console.error('Admin notifications: Error playing sound', soundError);
        }
      };
    } catch (error) {
      console.error('Admin notifications: Connection error', error);
      setIsConnected(false);
    }
  }, [isAdmin, user]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleWebSocketMessage = useCallback(
    (data) => {
      switch (data.type) {
        case 'CONNECTION_ESTABLISHED':
          console.log('Admin notifications: Connection established', data.data);
          // Don't show notification on initial connection to avoid duplicates
          // Only play connection sound
          try {
            soundAlerts.playConnectionSound().catch((soundError) => {
              console.error(
                'Admin notifications: Error playing connection sound',
                soundError,
              );
            });
          } catch (soundError) {
            console.error(
              'Admin notifications: Error playing connection sound',
              soundError,
            );
          }
          break;

        case 'ADMIN_NOTIFICATION':
          handleAdminNotification(data.data);
          break;

        case 'PONG':
          // Connection is alive, no action needed
          break;

        case 'STATS':
          setConnectionStats(data.data);
          break;

        case 'NOTIFICATIONS_CLEARED':
          setNotifications([]);
          notify('Notifications cleared', { type: 'info' });
          break;

        default:
          console.log('Admin notifications: Unknown message type', data.type);
      }
    },
    [notify],
  );

  /**
   * Handle admin notification
   */
  const handleAdminNotification = useCallback(
    (notification) => {
      console.log('Admin notifications: Received notification', notification);

      // Add to notifications list
      setNotifications((prev) => {
        const newNotifications = [notification, ...prev];
        // Keep only last 50 notifications
        return newNotifications.slice(0, 50);
      });

      // Show in-app notification based on priority
      const notificationType = getNotificationType(
        notification.priority,
        notification.level,
      );

      notify(notification.message, {
        type: notificationType,
        duration: getNotificationDuration(notification.priority),
        priority: notification.priority,
      });

      // Play sound based on priority
      try {
        soundAlerts.playSound(notification.priority);
      } catch (soundError) {
        console.error(
          'Admin notifications: Error playing notification sound',
          soundError,
        );
      }

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Admin Alert', {
          body: notification.message,
          icon: '/logo192.png',
          tag: notification.id,
          requireInteraction: notification.priority === 'CRITICAL',
        });
      }
    },
    [notify],
  );

  /**
   * Get notification type based on priority
   */
  const getNotificationType = (priority, level) => {
    if (priority === 'CRITICAL' || level === 'CRITICAL') {
      return 'error';
    }
    if (priority === 'IMPORTANT' || level === 'HIGH') {
      return 'warning';
    }
    return 'info';
  };

  /**
   * Get notification duration based on priority
   */
  const getNotificationDuration = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 10000; // 10 seconds
      case 'IMPORTANT':
        return 7000; // 7 seconds
      default:
        return 5000; // 5 seconds
    }
  };

  /**
   * Request connection statistics
   */
  const getStats = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'GET_STATS' }));
    }
  }, []);

  /**
   * Clear notifications
   */
  const clearNotifications = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CLEAR_NOTIFICATIONS' }));
    }
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect when component mounts and user is admin
  useEffect(() => {
    if (isAdmin && user) {
      connect().catch((error) => {
        console.error('Failed to connect to admin notifications:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAdmin, user, connect, disconnect]);

  // Disconnect when user is no longer admin
  useEffect(() => {
    if (!isAdmin && isConnected) {
      disconnect();
    }
  }, [isAdmin, isConnected, disconnect]);

  return {
    isConnected,
    notifications,
    connectionStats,
    getStats,
    clearNotifications,
    disconnect,
    connect,
  };
};
