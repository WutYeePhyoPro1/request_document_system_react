import 'react-confirm-alert/src/react-confirm-alert.css';
import React from "react";
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';

import { BrowserRouter, RouterProvider } from 'react-router-dom';
import router from './router';

import { AuthProvider } from './context/AuthContext'; // ✅ Import AuthProvider
import App from './App';


ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
);

// import React from "react";
// import ReactDOM from "react-dom/client";
// import './App.css';
// import 'react-confirm-alert/src/react-confirm-alert.css';
// import { StrictMode } from 'react';

// import { RouterProvider } from 'react-router-dom';
// import router from './router';
// import { AuthProvider } from './context/AuthContext';

// ReactDOM.createRoot(document.getElementById("root")).render(
//     <StrictMode>
//         <RouterProvider
//             router={{
//                 ...router,
//                 render: (children) => <AuthProvider>{children}</AuthProvider>
//             }}
//         />
//     </StrictMode>
// );

