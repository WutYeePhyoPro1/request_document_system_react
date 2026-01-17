import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { MantineProvider } from "@mantine/core";
import { NotificationProvider } from "./NotificationContext";
import { AuthProvider } from "./AuthContext";
import store from "../store/store";
// import { AuthProvider } from "./AuthContext";

export default function AppProvider({ children }) {
  return (
    
    <ReduxProvider store={store}>
      <MantineProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
      </MantineProvider>
    </ReduxProvider>
  );
}
