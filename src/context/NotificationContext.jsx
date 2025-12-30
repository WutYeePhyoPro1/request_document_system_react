import React, { createContext, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { badgeNoti } from "../api/badgeNoti";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get token from Redux
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
      setNotifications(response?.data || response);
    } catch (e) {
      console.error("Error fetching notifications:", e);
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
