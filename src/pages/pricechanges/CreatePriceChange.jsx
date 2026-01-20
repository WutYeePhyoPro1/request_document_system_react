import React, { useEffect, useState } from "react";
import cctvPhoto from "../../assets/images/ban1.png";
import CctvInput from "./inputs/CctvInput";
import CctvSelect from "./inputs/CctvSelect";
import CctvTextarea from "./inputs/CctvTextarea";
import CctvCheckbox from "./inputs/CctvCheckbox";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import NavPath from "../../components/NavPath";
import ProductTable from "../../components/ProductTable"
import { FaFileImport } from "react-icons/fa";

import $ from "jquery";
import Select from 'react-select'

export default function () {


    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        start_time: "",
        place: "",
        end_time: "",
        case_type: "",
        record_type: "",
        issue_date: "",
        description: "",
        cctv_record: false,
        form_id: 15,
        layout_id: 14,
        route: "price_changes"
    });
    const token = localStorage.getItem('token');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch("/api/cctv-records", {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    let errorMessages = "";
                    Object.values(data.errors).forEach(errorArray => {
                        errorArray.forEach(error => {
                            errorMessages += `• ${error}\n`;
                        });
                    });
                    confirmAlert({
                        title: "Oops! Please fix these errors",
                        message: errorMessages,
                        buttons: [
                            {
                                label: "OK",
                                onClick: () => { },
                            },
                        ],
                    });
                } else {
                    throw new Error(data.message || "Something went wrong");
                }
            } else {
                confirmAlert({
                    title: "Success",
                    message: "Form submitted successfully!",
                    buttons: [
                        {
                            label: "OK",
                            onClick: () => {
                                navigate("/cctv_record");
                            },
                        },
                    ],
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            confirmAlert({
                title: "Error",
                message: "Something went wrong while submitting the form.",
                buttons: [
                    {
                        label: "OK",
                        onClick: () => { },
                    },
                ],
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branches', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });
 
            // if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            console.log(data);
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.data?.data)
                        ? data.data.data
                        : [];
            setBranches(list);
        } catch (error) {
            console.error('Fetch branches error:', error);
            setBranches([]);
        }
    }
    const [selectedBranch, setSelectedBranch] = useState(null);
    const options = branches.map(branch => ({
        value: branch.id,      
        label: branch.branch_name
    }));


      useEffect(() => {
          fetchBranches();
      }, []);

    return (
        <div className="p-4 md:p-6 lg:p-8">

            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                    { path: "/price_changes", label: "Price Changes" },
                    { path: "/price_changes/create", label: "Price Change Form" },
                ]}
            />

        <div class="stickys top-6 z-30">
            <div
                class="bg-white border border-gray-200 rounded-xl
                    px-4 sm:px-6 py-4
                    shadow-sm"
            >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <h3 class="text-xl font-semibold text-blue-900 flex flex-wrap items-center gap-2">
                        Price Change Form
                        {/* <span
                            class="text-xl font-bold 
                                whitespace-nowrap select-all"
                        >
                            (PCSPT120260114-0012)
                        </span> */}
                    </h3>

                    <div class="flex flex-wrap gap-2 sm:justify-end">
                        <button
                            class="px-4 py-2 text-sm rounded-lg
                                border border-gray-300 text-gray-700
                                hover:bg-gray-100 transition">
                            Save as Draft
                        </button>

                        <button
                            class="px-4 py-2 text-sm rounded-lg
                                bg-blue-600 text-white
                                hover:bg-blue-700 transition">
                            Save
                        </button>

                        {/* <button
                            class="px-4 py-2 text-sm rounded-lg
                                bg-amber-500 text-white
                                hover:bg-amber-600 transition">
                            Audit
                        </button>

                        <button
                            class="px-4 py-2 text-sm rounded-lg
                                bg-green-600 text-white
                                hover:bg-green-700 transition">
                            Approve
                        </button>

                        <button
                            class="px-4 py-2 text-sm rounded-lg
                                bg-red-600 text-white
                                hover:bg-red-700 transition">
                            Reject
                        </button> */}
                    </div>

                </div>
            </div>
        </div>


           
            <div className="h-auto md:h-[calc(100vh-14rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 p-0">

                <aside className="lg:col-span-2 h-full">
                    <div className="h-full bg-white rounded-2xl shadow flex flex-col">

                    <div className="p-5 border-b">
                        <h2 className="text-base font-semibold text-slate-800">Branches</h2>
                        {/* <input
                        className="mt-3 w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search branch..."
                        /> */}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        <label className="flex items-center gap-3 text-sm font-medium">
                        <input type="checkbox" className="rounded text-indigo-600" />
                        All Branches
                        </label>

                        {/* <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> Lanthit Road</label>
                        <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> Hle Pan</label>
                        <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> Satsan</label>
                        <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> East Dagon</label>
                        <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> Mawlamyine</label>
                        <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> Hlaing Tharyar</label>
                        <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> Bago</label> */}

                        {
                            branches.map((branch,idx)=>(
                                <label className="flex items-center gap-3 text-sm"><input type="checkbox" /> {branch.branch_name}</label>
                            ))
                        }
                    </div>

                    </div>
                </aside>

                <main className="lg:col-span-10 h-full flex flex-col gap-4 overflow-hidden h-full" >
                    <section className="rounded-2xl shadow overflow-hidden h-full">
                        <header className="bg-gray-50 p-6 border-b border-indigo-100">
                            <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-2">
                                <h2 className="text-base font-semibold text-slate-800">Document Information</h2>

                                <div className="text-sm text-right">
                                <p className="text-slate-500">Server Time</p>
                                <p className="font-semibold text-slate-800">11:07:44</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4">
                                {/* <div>
                                <label className="text-xs font-medium text-slate-600">Change Price No</label>
                                <input className="mt-1 w-full px-3 py-2 border rounded-lg bg-slate-50" value="CPMM107-260119-002"/>
                                </div> */}

                                <div>
                                <label className="text-xs font-medium text-slate-600">Change Price Date</label>
                                <input type="date" className="border focus:outline-none  p-2 w-full rounded-md" style={{ borderColor: '#2ea2d1' }}/>
                                </div>

                                <div>
                                <label className="text-xs font-medium text-slate-600">Effective Date</label>
                                <input type="date" className="border focus:outline-none  p-2 w-full rounded-md" style={{ borderColor: '#2ea2d1' }}/>
                                </div>


                                <div className="flex items-center gap-2 mt-6">
                                    <input type="checkbox" className="rounded text-red-600"/>
                                    <span className="text-sm font-medium text-red-600">Urgent Price Change</span>
                                </div>

                             
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Department</label>
                                    <select className="border focus:outline-none p-2 w-full rounded-md" style={{ borderColor: '#2ea2d1' }}>
                                        <option>Cement & Block</option>
                                    </select>
                                </div>

                         

                                {/* <div>
                                <label className="text-xs font-medium text-slate-600">Competitor</label>
                                <input className="mt-1 w-full px-3 py-2 border rounded-lg bg-slate-50" value="No Competitor"/>
                                </div> */}

                                <div className="lg:col-span-2">
                                    <label className="text-xs font-medium text-slate-600">Remark</label>
                                    <textarea
                                        className="border focus:outline-none p-2 w-full rounded-md"
                                        rows="1"
                                        style={{ borderColor: '#2ea2d1' }}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-600">Branch Price</label>
                                     <Select
                                        id="branch_id"
                                        name="branch_id"
                                        options={options}
                                        placeholder="Select Status"
                                        isSearchable={true}  // allows typing to filter options
                                        styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            minHeight: "3rem",          
                                            borderColor: "#2ea2d1",
                                            borderRadius: "0.5rem",
                                        }),
                                        menu: (provided) => ({
                                            ...provided,
                                            minHeight: "500px",         
                                            maxHeight: "500px",        
                                        }),
                                        menuList: (provided) => ({
                                            ...provided,
                                            minHeight: "500px",         
                                            maxHeight: "600px",         // taller menu
                                        }),
                                        option: (provided, state) => ({
                                            ...provided,
                                            padding: "12px 16px",      
                                        }),
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-600">Product Code</label>
                                    <input type="text" className="border focus:outline-none  p-2 w-full rounded-md" style={{ borderColor: '#2ea2d1' }}/>
                                </div>
                                {/* <div className="flex items-end">
                                    <button class="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 active:bg-cyan-800 transition duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-300">
                                    Search
                                    </button>

                                </div> */}
                                <div className="flex flex-wrap gap-2 items-end">

                                    <button
                                        className="inline-flex items-center justify-center
                                                px-4 py-2
                                                text-sm font-medium
                                                bg-cyan-600 text-white rounded-lg
                                                hover:bg-cyan-700 active:bg-cyan-800
                                                transition
                                                focus:outline-none focus:ring-4 focus:ring-cyan-300"
                                    >
                                        Search
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => document.getElementById("excel_import").click()}
                                        title="Excel Import"
                                        className="inline-flex items-center justify-center
                                                min-h-[38px] px-4 py-2 text-sm font-medium
                                                bg-blue-600 text-white rounded-lg
                                                hover:bg-blue-700 active:bg-blue-800
                                                shadow-md
                                                transition
                                                focus:outline-none focus:ring-4 focus:ring-blue-300"
                                    >
                                        <FaFileImport className="text-base" />
                                        {/* <span className="ml-1 hidden sm:inline">Import</span> */}
                                    </button>

                                    <a
                                        href="/assets/documents/tp_products_sample_excel.xlsx"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Excel Sample"
                                        className="inline-flex items-center justify-center
                                                min-h-[38px] px-4 py-2 text-sm font-medium
                                                bg-sky-600 text-white rounded-lg
                                                hover:bg-sky-700 active:bg-sky-800
                                                transition
                                                focus:outline-none focus:ring-4 focus:ring-sky-300"
                                    >
                                        Sample
                                    </a>

                                    <input
                                        type="file"
                                        id="excel_import"
                                        accept=".xlsx,.xls,.ods"
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </header>
                        
                        <div className="p-2">
                            {/* <div class="px-6 py-4 border-b"> */}
                                <h2 class="text-base font-semibold text-slate-800">Product Prices</h2>
                            {/* </div> */}


                            <ProductTable/>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
