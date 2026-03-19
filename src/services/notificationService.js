import { useState, useCallback, useEffect } from 'react';

// Hook for managing in-app notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('evolve_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
      return [];
    }
  });

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('evolve_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }, [notifications]);

  // Add a new notification
  const addNotification = useCallback(
    (title, message, type = 'system') => {
      const validTypes = ['match', 'trade', 'price_alert', 'message', 'system'];
      if (!validTypes.includes(type)) {
        console.warn(`Invalid notification type: ${type}. Using 'system' instead.`);
        type = 'system';
      }

      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev]);
      return notification;
    },
    []
  );

  // Mark a notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Compute unread count
  const unreadCount = notifications.filter((notif) => !notif.read).length;

  // Monitor for price alerts (price change > 3%)
  const addPriceAlert = useCallback(
    (profileName, oldPrice, newPrice) => {
      const priceChange = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
      if (priceChange > 3) {
        const direction = newPrice > oldPrice ? 'up' : 'down';
        addNotification(
          'Price Alert',
          `${profileName} price moved ${direction} by ${priceChange.toFixed(2)}%`,
          'price_alert'
        );
      }
    },
    [addNotification]
  );

  // Monitor for trade alerts (position P&L crosses +10%)
  const addTradeAlert = useCallback(
    (positionName, currentPnL) => {
      if (currentPnL >= 10) {
        addNotification(
          'Trade Alert',
          `${positionName} position P&L reached +${currentPnL.toFixed(2)}%`,
          'trade'
        );
      }
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    markAsRead,
    clearAll,
    unreadCount,
    addPriceAlert,
    addTradeAlert,
  };
};

// Request browser notification permission
export const requestBrowserNotifications = async () => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support the Notification API');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  return Notification.permission;
};

// Send a browser notification
export const sendBrowserNotification = (title, body = '', options = {}) => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support the Notification API');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    new Notification(title, {
      body,
      icon: '/logo.png', // Update path as needed
      badge: '/badge.png', // Update path as needed
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Failed to send browser notification:', error);
    return false;
  }
};
