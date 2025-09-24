// src/routes/router.jsx
import {
    createBrowserRouter,
    Navigate
} from "react-router-dom";

import Home from '../pages/Home.jsx'
import Layout from "../pages/layouts/Layout.jsx";
import Create from "../pages/Create.jsx";
import Search from "../pages/Search.jsx";
import CctvRecord from "../pages/cctv/CctvRecord.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import CctvForm from "../pages/cctv/CctvForm.jsx";
import Login from "../pages/auth/Login.jsx";
import CctvIndex from "../pages/cctv/CctvIndex.jsx";
import CctvDetails from "../pages/cctv/CctvDetails.jsx";
import CctvEdit from "../pages/cctv/CctvEdit.jsx";
import AutoLogin from "../context/AutoLogin.jsx";
import OfficeUseIndex from "../pages/officeuse/OfficeUseIndex.jsx";
import OfficeUseCreate from "../pages/officeuse/OfficeUseCreate.jsx";
import PurchaseRequest from "../pages/officeuse/purchase_request/PurchaseRequest.jsx";

const user = JSON.parse(localStorage.getItem('user')); // basic fallback

const router = createBrowserRouter([
    {
        path: "/login",
        element: user ? <Navigate to="/cctv-index" /> : <Login />,
    },
    {
        path: "/auto-login",
        element: <AutoLogin />,
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
            },
            {
                path: "cctv-edit/:id",
                element: <CctvEdit />
            },
            {
                path: "office-use",
                element: <OfficeUseIndex />
            },
            {
                path: "office-use-create",
                element: <OfficeUseCreate />
            },
            {
                path: "purchase-request",
                element: <PurchaseRequest />
            }
        ]
    }
]);

export default router;
