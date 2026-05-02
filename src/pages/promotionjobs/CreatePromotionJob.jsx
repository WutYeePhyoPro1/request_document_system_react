import React, { useEffect, useState, useRef } from "react";
import {useDispatch,useSelector} from "react-redux"
import { confirmAlert } from "react-confirm-alert";
import { useNavigate,Link } from "react-router-dom";
import NavPath from "../../components/NavPath";
import { FaFileImport,FaSpinner,FaLock, FaPen, FaEye } from "react-icons/fa";

import Select from 'react-select'
import axios from "axios";
import Swal from "sweetalert2";

import ServerTime,{fetchServerTime as SvrTime}  from "../../components/ServerTime";


export default function () {
    const { user, token } = useSelector((state) => state.auth);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [branches, setBranches] = useState([]);
    const [forceLoading, setForceLoading] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState([]);


    const [running,setRunning] = useState(false);
    const [form,setForm] = useState({});
    let id = null;


    const toggleBranch = (id) => {
        setSelectedBranches((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const excludeBranchIds = [] || [1,16,18,19,20,21,22,14,15];
    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branchesall', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });
 
            // if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            console.log(data);
            let list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.data?.data)
                        ? data.data.data
                        : [];
            list = [...list]
                            .filter((br)=>!excludeBranchIds.includes(br.id)).sort((a,b)=>a.branch_code > b.branch_code ? 1 : -1);

            setBranches(list);
        } catch (error) {
            console.error('Fetch branches error:', error);
            setBranches([]);
        }
    }

    const applyHandler = async ()=>{
        
        const formData = {
            branches: selectedBranches
        };
        console.log(formData);
        if(selectedBranches.length == 0){
            Swal.fire({
                icon: "warning",
                title: "Please select the branches first.",
                // text: data.message,
            });
            return ;
        }

        setRunning(true);
            try{
                const res = await axios.post(`/api/promotion_jobs`,formData,{
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log(res.data);

                const data = res.data.data;

                if(data.success == false){
                    if(data.errors){
                        let errorMessages = "";
                        Object.values(data.errors).forEach(errorArray => {
                            errorArray.forEach(error => {
                                errorMessages += `• ${error} \n`;
                            });
                        });

                        Swal.fire({
                            icon: "error",
                            title: " Invalid Form!!",
                            // text: "Some fields contain errors. Please review the form and try again.",
                            text: errorMessages,
                        });
                    }else{
                        throw new Error("Promotion job failed!");
                    }
                }

                console.log("Promotion Job Started");
                // Swal.fire({
                //     icon: "success",
                //     title: "Promotion Job Runner started running successfully!",
                //     text: data.message,
                // });
                // navigate("/promotion_jobs");


                const general_form = data.general_form;
                const promotion_jobs = data.promotion_jobs;
                console.log(general_form,promotion_jobs);
                // const general_form_files = data.general_form_files;
                const normalizedForm = {
                    ...general_form,
                    // effective_date: general_form.date_formatted ? formatLaravelStyleDate(general_form.date_formatted): '',
      
                    promotion_jobs: promotion_jobs.sort((a,b)=>a.branch.branch_code > b.branch.branch_code ? 1 : -1),
                    // general_form_files
                }
                // console.log(price_change_branches.length, branchCountRef.current);
                console.log(normalizedForm);
                setForm(normalizedForm);

                id = general_form.id;
                runPromotion(normalizedForm);

            }catch(err){
                console.log(err);
                Swal.fire({
                    icon: "error",
                    title: "Form Submit Error!!",
                    text: "Something went wrong while while starting promotionjob.",
                });
                setRunning(false);
            }finally{
                // setRunning(false);
            }
    };

    const updateBranchStatus = (branchId, status, message = null) => {
        setForm(prev => ({
            ...prev,
            promotion_jobs: prev.promotion_jobs.map(branch =>
                branch.branch_id === branchId
                    ? { ...branch, status, message }
                    : branch
            )
        }));
    };
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const runPromotion = async (latestForm = null) => {
        const data = latestForm || form;

        setRunning(true);

        const promotion_jobs = data.promotion_jobs;
        if (promotion_jobs.length === 0) return;

        // run all in parallel
        const promises = promotion_jobs.map(async (promotion_job) => {

            let branchId = promotion_job.branch_id;
            updateBranchStatus(branchId, "Running");

            try {
                const res = await axios.post(
                    `/api/promotion_jobs/${id}/${branchId}/run_promotion`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data?.success === false) {
                    throw new Error(res?.data?.message);
                }

                await sleep(4000);
                updateBranchStatus(branchId, res.data.status ,res.data.message);
                return res;


            } catch (err) {
                console.log('There is an error in running branch promotion job:',err);
                updateBranchStatus(
                    branchId,
                    "Failed",
                    err.response?.data?.message || err.message
                );
                throw err;
            }
        });

        // wait all finish
        await Promise.all(promises);
        // setRunning(false);

        await Swal.fire({
            icon: "success",
            title: "All Branches Updated!",
            text: "The latest promotions are now live across all locations.",
            confirmButtonText: "Great!"
        });
        navigate('/promotion_jobs');
    };


    useEffect(()=>{
        fetchBranches();
    },[]);

    return (
        <>
            {forceLoading && <FullPageLoader />}
            <div className="p-4 md:p-6 lg:p-8 bg-[rgb(246,249,255)] min-h-screen -m-3">
                <NavPath
                    segments={[
                        { path: "/dashboard", label: "Home" },
                        { path: "/dashboard", label: "Dashboard" },
                        { path: "/promotion_jobs", label: "Promotion Jobs" },
                        { path: "/promotion_jobs/create", label: "Promotion Job Form" },
                    ]}
                />

                {/* HEADER */}
                <div className="flex justify-between items-center mb-1 -mt-4">
                    <h1 className="text-xl font-bold tracking-wide">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="inline me-2 lucide lucide-radio text-blue-600"
                        >
                            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                            <circle cx="12" cy="12" r="2" />
                            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
                        </svg> 
                        Promotion Job Runner
                    </h1>
    
                    <Link
                        to="/promotion_jobs"
                        className="inline-flex px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 items-center text-sm sm:text-base"
                    >
                        <span className="mr-1 sm:mr-2">←</span> Back
                    </Link>
                </div>

                <div className="grid grid-cols-12 gap-4 min-h-[80vh]">
                    <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">

                        {/* HEADER */}
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                Branches
                            </h2>

                            <button
                                onClick={() =>
                                    selectedBranches.length === branches.length
                                        ? setSelectedBranches([])
                                        : setSelectedBranches(branches.map((b) => b.id))
                                }
                                className="text-xs text-blue-600 hover:underline"
                            >
                                {selectedBranches.length === branches.length ? "Unselect All" : "Select All"}
                            </button>
                        </div>

                        {/* SEARCH */}
                        <div className="p-3 border-bs bg-white">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search branches..."
                                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    onChange={(e) => {
                                        const value = e.target.value.toLowerCase();
                                        setFilteredBranches(
                                            branches.filter((b) =>
                                                b.branch_name.toLowerCase().includes(value)
                                            )
                                        );
                                    }}
                                />
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[600px]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(branches).map((b) => {
                                    const isSelected = selectedBranches.includes(b.id);

                                    return (
                                        <div
                                            key={b.id}
                                            onClick={() => toggleBranch(b.id)}
                                            className={`break-inside-avoid mb-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition
                                                ${
                                                    isSelected
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                                                }`}
                                        >
                                            {b.branch_name}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
							<div className="p-4 border-b bg-gray-50 flex justify-between items-center">
								<h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
									Job Progress
								</h2>
							</div>
								
							<div className="my-2 p-2 text-end">
                                {
                                    <button
                                            type="button"
                                            className="w-auto px-4 py-2 text-sm rounded-lg
                                                bg-blue-600 text-white
                                                hover:bg-blue-700 transition"
                                            value="Approved"
                                            onClick={applyHandler}
                                            disabled={running}
                                            >
                                            {running ? 'Running...' : 'Apply Branch'}
                                    </button>
                                }
							</div>


							{/* EMPTY STATE */}
							{!running && !form?.promotion_jobs && (
								<div className="flex flex-col items-center justify-center h-full text-center">

									{/* Icon */}
									<div className="relative mb-6">
										<div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-5xl">
										🚀
										</div>
										<div className="absolute inset-0 rounded-full border-2 border-blue-100 animate-ping"></div>
									</div>

									{/* Text */}
									<h2 className="text-2xl font-bold text-gray-900 mb-2">
										Ready to Run Promotion
									</h2>

									<p className="text-sm text-gray-400 mt-2 max-w-sm mb-2">
										Select branches from the left panel and start promotion.
										Progress will appear here in real-time.
									</p>
									<div className="space-y-3 text-left bg-blue-50 rounded-xl p-6 border border-blue-100">
										<div className="flex items-start gap-3">
											<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
											1
											</div>
											<div>
											<div className="font-medium text-gray-900">
											Select Branches
											</div>
											<div className="text-sm text-gray-600">
											Choose one or more branches to apply the promotion
											</div>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
											2
											</div>
											<div>
											<div className="font-medium text-gray-900">
											Click 'Apply Branch' Promotion
											</div>
											<div className="text-sm text-gray-600">
											Watch real-time deployment status for each branch
											</div>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
											3
											</div>
											<div>
											<div className="font-medium text-gray-900">
											Monitor Progress
											</div>
											<div className="text-sm text-gray-600">
											Track status updates and completion across all locations
											</div>
											</div>
										</div>
									</div>
								</div>
							)} 

                            {form?.promotion_jobs?.length > 0  && (
                            <ul className="space-y-3 overflow-y-auto max-h-[600px] p-2">
                                {form?.promotion_jobs?.map((pjbranch) => (
                                    <li
                                    key={pjbranch}
                                    className="flex items-center justify-between p-1 rounded-lg borders"
                                    >
                                    <span className="font-medium">
                                        {pjbranch.branch?.branch_name}: {pjbranch.message} 
                                        {/* {pjbranch.status}  */}
                                    </span>
                
                
                                    {/* Status */}
                                    <div>
                                    {(pjbranch.status.toLowerCase()  == "default" || pjbranch.status.toLowerCase() === "pending" ) && (
                                        <span className="text-sm text-yellow-600">
                                        ⏳ Pending
                                        </span>
                                    )}
                
                                    {pjbranch.status.toLowerCase() === "running" && (
                                        <span className="text-sm text-blue-600">
                                        <span className="text-xl animate-spin mr-1">🔄</span> Running...
                                        </span>
                                    )}
                
                                    {pjbranch.status.toLowerCase() === "success" && (
                                        <span className="text-sm text-green-600">
                                        ✔ Success
                                        </span>
                                    )}
                
                                    {pjbranch.status.toLowerCase() === "failed" && (
                                        <span className="text-sm text-red-600">
                                        ❌ Failed
                                        </span>
                                    )}
                                    </div>
                
                                    </li>
                                ))}
                            </ul>
                            )} 


                    </div>
                </div>
                
            </div>
        </>
    );

}



// npm install react-flatpickr flatpickr

