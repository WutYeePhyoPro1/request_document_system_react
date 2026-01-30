import React, { createContext, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { badgeNoti } from "../api/badgeNoti";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = useSelector((state) => state.auth.token);

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await badgeNoti(token);
      // console.log('hii error');
      setNotifications(response?.data || response);
    } catch (e) {
      console.error("Error fetching notifications:", e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);


  useEffect(() => {
    const handleNotificationsUpdated = (event) => {
      console.log('Notifications updated event received, refreshing notifications...');
      refreshNotifications();
    };

    // Add event listener for notificationsUpdated event
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{ notifications, refreshNotifications, loading }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
