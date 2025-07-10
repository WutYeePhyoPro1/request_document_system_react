import 'react-confirm-alert/src/react-confirm-alert.css';
import React from "react";
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';

import { BrowserRouter, RouterProvider } from 'react-router-dom';
import router from './router';

import { AuthProvider } from './context/AuthContext'; // ✅ Import AuthProvider
import App from './App';

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Save the event for later use
    deferredPrompt = e;

    // Show a custom install button
    const installButton = document.createElement('button');
    installButton.textContent = 'Install App';
    installButton.style.position = 'fixed';
    installButton.style.bottom = '10px';
    installButton.style.right = '10px';
    installButton.style.padding = '10px 20px';
    installButton.style.backgroundColor = '#007bff';
    installButton.style.color = '#fff';
    installButton.style.border = 'none';
    installButton.style.borderRadius = '5px';
    installButton.style.cursor = 'pointer';
    document.body.appendChild(installButton);

    installButton.addEventListener('click', () => {
        installButton.style.display = 'none'; // Hide the button
        deferredPrompt.prompt(); // Show the install prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    });
});

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
);
