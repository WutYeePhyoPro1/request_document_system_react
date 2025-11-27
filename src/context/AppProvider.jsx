import { Provider as ReduxProvider } from "react-redux";
import { MantineProvider } from "@mantine/core";
import { NotificationProvider } from "./NotificationContext";
import store from "../store/store";

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
