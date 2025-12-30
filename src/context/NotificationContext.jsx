// context/NotificationContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import { badgeNoti } from "../api/badgeNoti";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    
   const refreshNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await badgeNoti(token);
      setNotifications(response);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, []);
    return (
        <NotificationContext.Provider value={{ notifications, refreshNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
