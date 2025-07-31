import React from "react";
import ReactDOM from "react-dom/client";
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext'; // ✅ import

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <NotificationProvider>
                <RouterProvider router={router} />
            </NotificationProvider>
        </AuthProvider>
    </React.StrictMode>
);
