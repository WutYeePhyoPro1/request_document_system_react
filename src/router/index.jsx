// src/routes/router.jsx
import {
    createBrowserRouter,
    Navigate,
    useParams
} from "react-router-dom";

import Home from '../pages/Home.jsx'
import Layout from "../pages/layouts/Layout.jsx";
import Search from "../pages/Search.jsx";
import CctvRecord from "../pages/cctv/CctvRecord.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import FilterCard from "../pages/BigDamageIssue/FilterCard.jsx";
import CctvForm from "../pages/cctv/CctvForm.jsx";
import Login from "../pages/auth/Login.jsx";
import CctvIndex from "../pages/cctv/CctvIndex.jsx";
import BigDamageIssue from "../pages/BigDamageIssue/Dashboard.jsx";
import CctvDetails from "../pages/cctv/CctvDetails.jsx";
import CctvEdit from "../pages/cctv/CctvEdit.jsx";
import AutoLogin from "../context/AutoLogin.jsx";
import Demo from "../pages/requestDiscount/index.tsx";
import Create from "../pages/requestDiscount/create.tsx"
import DamageAdd from "../pages/BigDamageIssue/DamageAdd.jsx";
import DamageDetail from "../pages/BigDamageIssue/DamageDetail.jsx";
import DamageView from "../pages/BigDamageIssue/DamageView.jsx";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import DamageIssueList from "../pages/BigDamageIssue/DamageIssueList.jsx";
import Detail from "../pages/requestDiscount/detail.js";
import MAndE from "../pages/MAndE/MAndE.jsx";
import Index from "../pages/MAndE/Generator/index.js";
import GeneratorCreate from "../pages/MAndE/Generator/generatorCreate.js";
import GeneratorDetail from "../pages/MAndE/Generator/GeneratorDetail.js";
import GeneratorEdit from "../pages/MAndE/Generator/generatorEdit.js";
import IndexPriceChange from "../pages/pricechanges/IndexPriceChange.jsx";
import CreatePriceChange from "../pages/pricechanges/CreatePriceChange.jsx";
import DetailPriceChange from "../pages/pricechanges/DetailPriceChange.jsx";

const LoginRoute = () => {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/dashboard" /> : <Login />;
};

const BigDamageRedirect = () => {
    const { id } = useParams();
    return <Navigate to={`/big-damage-issue-add/${id}`} replace />;
};
const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginRoute />,
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
                element: <Navigate to="/dashboard" replace />
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
                path: "big_damage_issue",
                element: <BigDamageIssue />
            },
            {
                path: "big-damage-issue-add",
                element: <DamageAdd />
            },
            {
                path: "big-damage-issue-add/:id",
                element: <DamageView />
            },
            {
                path: "big-damage-issue-detail/:id",
                element: <DamageDetail />
            },
            {
                // Redirect notifications from underscore style to the correct URL format
                path: "big_damage_issue_detail/:id",
                element: <BigDamageRedirect />
            },
            {
                path: "big-damage-issue-filter",
                element: <FilterCard />
            },
            {
                path: "big-damage-issue-datalist",
                element: <DamageIssueList />
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
            },
            {
                path:"m_and_e" ,
                element: <MAndE/>
            } ,
            {
                path:"generator/:id" ,
                element: <Index/>
            },
            {
                path: "generator_create" ,
                element: <GeneratorCreate/>
            } ,
            {
                path: "generator_detail/:id" ,
                element:<GeneratorDetail/>
            },
            {
                path: "generator_edit/:id" ,
                element:<GeneratorEdit/>
            },
            {
                path: "price_changes" ,
                element: <IndexPriceChange/>
            },
            {
                path: "price_changes/create",
                element: <CreatePriceChange />
            },
            {
                path: "price_changes_detail/:id",
                element: <DetailPriceChange />
            },
        ]
    }
]);

export default router;
