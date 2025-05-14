import {
    createBrowserRouter,
    Navigate
} from "react-router-dom";

import Home from '../pages/Home.jsx'
import Layout from "../pages/layouts/Layout.jsx";
import Create from "../pages/Create.jsx";
import Search from "../pages/Search.jsx";
import CctvRecord from "../pages/cctv/CctvRecord.jsx";
import Dashboard from "../pages/dashboard.jsx";
import CctvForm from "../pages/cctv/CctvForm.jsx";
import Login from "../pages/auth/Login.jsx";
import CctvIndex from "../pages/cctv/CctvIndex.jsx";
import CctvDetails from "../pages/cctv/CctvDetails.jsx";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                index: true,
                element: <Navigate to="/login" replace />
            },
            {
                path: "dashboard",
                element: <Dashboard />
            },
            {
                path: "home",
                element: <Home />
            },
            {
                path: "create",
                element: <Create />
            },
            {
                path: "search",
                element: <Search />
            },
            {
                path: "cctv-request",
                element: <CctvRecord />
            },
            {
                path: "cctv-form",
                element: <CctvForm />
            },
            {
                path: "cctv-index",
                element: <CctvIndex />
            },
            {
                path: "cctv-details/:id",
                element: <CctvDetails />
            }
        ]
    }
]);

export default router;

