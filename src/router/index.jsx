// src/routes/router.jsx
import {
    createBrowserRouter,
    Navigate
} from "react-router-dom";

import Home from '../pages/Home.jsx'
import Layout from "../pages/layouts/Layout.jsx";
import Search from "../pages/Search.jsx";
import CctvRecord from "../pages/cctv/CctvRecord.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import CctvForm from "../pages/cctv/CctvForm.jsx";
import Login from "../pages/auth/Login.jsx";
import CctvIndex from "../pages/cctv/CctvIndex.jsx";
import CctvDetails from "../pages/cctv/CctvDetails.jsx";
import CctvEdit from "../pages/cctv/CctvEdit.jsx";
import AutoLogin from "../context/AutoLogin.jsx";
import Demo from "../pages/requestDiscount/index.tsx";
import Create from "../pages/requestDiscount/create.tsx"
import Detail from "../pages/requestDiscount/detail.js";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";

const user = JSON.parse(localStorage.getItem('user')); 
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
        element:( <ProtectedRoute>
        <Layout />
      </ProtectedRoute>),
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
                path: "cctv_record",
                element: <CctvIndex />
            },
            {
                path: "cctv-details/:id",
                element: <CctvDetails />
            },
            {
                path: "cctv-edit/:id",
                element: <CctvEdit />
            } ,
            {
                path: "request_discount" ,
                element: <Demo/>
            },
            {
                path: "request-discount-create" ,
                element: <Create/>
            },
            {
                path: "request_discount_detail/:id" ,
                element: <Detail/>
            }
        ]
    }
]);

export default router;
