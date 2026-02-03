import React,{ useEffect, useState }  from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { logout as logoutThunk } from '../store/authSlice'; 
import { useDispatch, useSelector } from "react-redux";
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate("/login", { replace: true });
  };
  // * authSlice's user can get current user info
  // * mostly same as refreshUserIfNeeded function, to check authorize user
  useEffect(() => {
  const fetchMe = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        // Token invalid or throttled
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!data?.user) {
        handleLogout();
        return;
      }

    } catch (error) {
      console.error(error);
      handleLogout();
    }
  };

  fetchMe();
}, [token]);


  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
