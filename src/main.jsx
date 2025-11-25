import React from "react";
import ReactDOM from "react-dom/client";
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { MantineProvider } from "@mantine/core";

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext'; 
import store from "./store/store"
import { Provider } from "react-redux";

// Initialize i18n
import './i18n/config';

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
       
            <Provider store={store}>
            <MantineProvider >
            
            <NotificationProvider>
                <RouterProvider router={router} />
            </NotificationProvider>
        </MantineProvider>
         </Provider>
       
    </React.StrictMode>
);
