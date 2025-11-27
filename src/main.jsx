import React from "react";
import ReactDOM from "react-dom/client";
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';


// Initialize i18n
// import './i18n/config';
import AppProvider from "./context/AppProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
    // <React.StrictMode>
       
            <AppProvider>
    <RouterProvider router={router} />
  </AppProvider>
    // </React.StrictMode>
);
