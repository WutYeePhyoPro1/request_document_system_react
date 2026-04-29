import React, { useEffect, useState, useRef } from "react";
import {useDispatch,useSelector} from "react-redux"
import { confirmAlert } from "react-confirm-alert";
import { useNavigate,Link } from "react-router-dom";
import NavPath from "../../components/NavPath";
import ProductTable from "../../components/ProductTable"
import { FaFileImport,FaSpinner,FaLock, FaPen, FaEye } from "react-icons/fa";

// import $ from "jquery";
import Select from 'react-select'
import axios from "axios";
import Swal from "sweetalert2";

export default function () {
    const { user, token } = useSelector((state) => state.auth);
    // console.log(user.categories);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [forceLoading, setForceLoading] = useState(false);

    return (
        <>
            {forceLoading && <FullPageLoader />}
            <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
                <NavPath
                    segments={[
                        { path: "/dashboard", label: "Home" },
                        { path: "/dashboard", label: "Dashboard" },
                        { path: "/promotion_jobs", label: "Promotion Jobs" },
                        { path: "/promotion_jobs/create", label: "Promotion Job Form" },
                    ]}
                />

     
            </div>
        </>
    );

}



// npm install react-flatpickr flatpickr