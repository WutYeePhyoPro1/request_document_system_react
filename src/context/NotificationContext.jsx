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
<<<<<<< HEAD
      // console.log('hii error');
      setNotifications(response?.data || response);
=======
      console.log('hii error');
      let notificationsData = response?.data || response;
      if (notificationsData && typeof notificationsData === 'object' && !Array.isArray(notificationsData)) {
        notificationsData = notificationsData.data || notificationsData.notifications || [];
      }
      // Ensure it's an array
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
>>>>>>> f029fc2 (to pull update)
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

  return (
    <NotificationContext.Provider
      value={{ notifications, refreshNotifications, loading }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
