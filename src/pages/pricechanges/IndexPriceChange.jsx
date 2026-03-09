import React, { useEffect, useState } from 'react';
import {useDispatch,useSelector} from "react-redux"
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Pusher from 'pusher-js';
import NavPath from '../../components/NavPath';
import StatusBadge from '../../components/ui/StatusBadge';
import { fetchData } from '../../api/FetchApi';
import { useNavigate } from "react-router-dom";
import Select from 'react-select'
import { FiCopy,FiExternalLink } from 'react-icons/fi';
import { FaSpinner,FaEye } from "react-icons/fa";
import {fetchPriceChanges,setFilter,clearFilters,isFiltersEmpty} from "./../../store/pricechangeSlice";


export default function IndexPriceChange() {
    // const token = localStorage.getItem('token');
    const { user, token } = useSelector((state) => state.auth);
    console.log(user);

    const statusOptions = [
        { value: "Default", label: "Default" },
        { value: "Ongoing", label: "Ongoing" },
        { value: "Checked", label: "Checked" },
        // { value: "Approved", label: "Approved" },
        { value: "Partial", label: "Partial" },
        { value: "Pass approval", label: "Pass approval" },
        { value: "Already changed", label: "Already changed" },
        { value: "Cancel", label: "Cancel" },
    ];
    const [branches, setBranches] = useState([]);

    const {loading,error,datas,filters,isSearchMode,paginationInfo} = useSelector((state)=>state.pricechanges)

    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    useEffect(()=>{
        console.log("Filter Empty:",isFiltersEmpty);
        dispatch(fetchPriceChanges({filters}));
    },[dispatch]);


    useEffect(() => {
        fetchBranches();
    }, []);
    
    const onChangeHandler = (e)=>{
        console.log(e);
        dispatch(setFilter({
            [e.target.name]: e.target.value
        }))

        // setFormState(prev=>{
        //     return {...prev,tags:[...prev.tags,tagname]}
        // });
    }

    const handleSelectChange = (name) => (value) => {
        dispatch(setFilter({
            [name]: Array.isArray(value)
                    ? (value ? value.map(v => v.value) : []) 
                    : value ? value.value : ""        
        }));
    };

    const handlePageClick = (page) => {
        if (page >= 1 && page <= paginationInfo.last_page) {
            dispatch(fetchPriceChanges({filters,page}));
        }
    };

    const [copied, setCopied] = useState(false);
    const handleCopy = (e,id) => {
        const data = datas.find(data=>data.id == id);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(data.form_doc_no)
                .then(() => {
                    setCopied(data.id);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch((err) => {
                    console.error("Clipboard copy failed:", err);
                    fallbackCopy(formState.form_doc_no);
                });
        } else {
            fallbackCopy(formState.form_doc_no);
        }
    };

    const excludeBranchIds = [1,18,19,21,22,15];
    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branchesall', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            let list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.data?.data)
                        ? data.data.data
                        : [];
            list = [...list]
                    .filter((br)=> br.id == 1).sort((a,b)=>a.branch_code > b.branch_code ? 1 : -1);

            setBranches(list);
        } catch (error) {
            console.error('Fetch branches error:', error);
            setBranches([]);
        }
    }

    const searchHandler = (e)=>{
        e.preventDefault();
        dispatch(fetchPriceChanges({filters}));
    }

    const clearHandler = (e)=>{
        dispatch(clearFilters())
        dispatch(fetchPriceChanges());
    }

    return (
        <>
            < div className="p-6 bg-white shadow-md rounded-lg" >
                    <NavPath
                        segments={[
                            { path: "/dashboard", label: "Home" },
                            { path: "/dashboard", label: "Dashboard" },
                            { path: "/price_changes", label: "Price Changes" }
                        ]}
                    />

                    <div className="flex justify-between mr-4">
                        <h2 className="text-xl font-semibold ">Price Change Form</h2>

                        { user.from_branch_id == 1 && user.department_id == 6 &&
                        <Link to="/price_changes/create" className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm"
                            style={{
                                backgroundColor: '#2ea2d1',
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
                        >
                            Add
                        </Link>
                        }
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 text-sm mt-4">
                        <div className="flex flex-col">
                            <label htmlFor="form_doc_no" className="mb-1 font-medium text-gray-700">
                                Form Doc No
                            </label>
                            <input
                                id="form_doc_no"
                                name="form_doc_no"
                                type="text"
                                placeholder="Enter Form Doc No"
                                className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                                onFocus={(e) => e.target.style.borderColor = '#6fc3df'}
                                onBlur={(e) => e.target.style.borderColor = '#2ea2d1'}
                                style={{ borderColor: '#2ea2d1' }}
                                value={filters.form_doc_no}
                                onChange={onChangeHandler}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="start_date" className="mb-1 font-medium text-gray-700">
                                From Date
                            </label>
                            <input
                                id="start_date"
                                name="start_date"
                                type="date"
                                className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                                style={{ borderColor: '#2ea2d1' }}
                                value={filters.start_date}
                                onChange={onChangeHandler}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="end_date" className="mb-1 font-medium text-gray-700">
                                End Date
                            </label>
                            <input
                                id="end_date"
                                name="end_date"
                                type="date"
                                className="border  focus:outline-none p-2 w-full rounded-md"
                                value={filters.end_date}
                                onChange={onChangeHandler}
                                style={{ borderColor: '#2ea2d1' }}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="status" className="mb-1 font-medium text-gray-700">
                                Status
                            </label>
                            <Select
                                id="status"
                                isMulti
                                name="search_status"
                                options={statusOptions}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                value={statusOptions.filter(option => filters.search_status.includes(option.value))}
                                onChange={handleSelectChange('search_status')}
                                placeholder="Select Status"
                            />
                        </div>

                        {/* <div className="flex flex-col">
                            <label htmlFor="branch" className="mb-1 font-medium text-gray-700">
                                Branch
                            </label>
                            <select
                                id="branch_id"
                                name="branch_id"
                                className="border focus:outline-none p-2 w-full rounded-md"
                                value={filters.branch}
                                onChange={onChangeHandler}
                                style={{ borderColor: '#2ea2d1' }}
                            >
                                <option value="">All Branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div> */}


                        <div className="flex items-end">
                            <button className="text-white px-4 py-2 rounded w-full cursor-pointer" 
                                onClick={(e)=>searchHandler(e)} 
                                style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}>
                                Search
                            </button>
                        </div>

                        <div className="flex items-end">
                            <button
                                className="text-white px-4 py-2 rounded w-full cursor-pointer"
                                style={{ backgroundColor: '#4b5563' }}
                                onMouseEnter={(e) => (e.target.style.backgroundColor = '#6b7280')}
                                onMouseLeave={(e) => (e.target.style.backgroundColor = '#4b5563')}
                                onClick={()=>clearHandler()}
                            >
                            Reset Filters
                            </button>
                        </div>


                    </div>

                    {

                        loading && (
                            <div className="flex justify-center items-center text-center py-5">
                                <FaSpinner className="text-blue-600 text-5xl animate-spin" />
                            </div>
                        )
                    }

                    {
                        !loading && !error && (
                            <div className="overflow-x-auto">
                                <table className="xl:table min-w-full bg-white border border-gray-200 text-sm">
                                    <thead className="bg-gray-100 text-left">
                                        <tr>
                                            {/* <th className="py-2 px-4 border-b">Action</th> */}
                                            <th className="py-2 px-4 border-b">No</th>
                                            <th className="py-2 px-4 border-b">Status</th>
                                            <th className="py-2 px-4 border-b">Document No</th>
                                            <th className="py-2 px-4 border-b"><span className='text-red-600'>Effective Date</span></th>
                                            <th className="py-2 px-4 border-b"><span className='text-red-600'>Urgent</span></th>
                                            <th className="py-2 px-4 border-b">Department</th>
                                            <th className="py-2 px-4 border-b">Requested By</th>
                                            <th className="py-2 px-4 border-b">Created Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                            {
                                                datas.map((data,idx)=>(
                                                    <tr key={idx}
                                                    onClick={() =>navigate(`/price_changes_detail/${data.id}`)}
                                                    // onClick={() => window.open(`/price_changes_detail/${data.id}`, "_blank")}
                                                    className="cursor-pointer hover:bg-[#efefef] transition"
                                                    >
                                                        {/* <td className="py-2 px-4 border-b">
                                                            <button className={`ml-2 px-2 py-1 text-xs rounded transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer`}>
                                                                <FaEye className="w-4 h-4" />
                                                            </button>
                                                        </td> */}
                                                        <td className="py-2 px-4 border-b">{paginationInfo.from + idx}</td>
                                                        <td className="py-2 px-4 border-b">
                                                            <StatusBadge status={data.status} />
                                                        </td>
                                                        <td className="py-2 px-4 border-b group">
                                                            {data.form_doc_no}
                                                            <button
                                                                onClick={(e)=>{
                                                                    e.stopPropagation(); 
                                                                    handleCopy(e,data.id)
                                                                }}
                                                                className={`ml-2 px-2 py-1 text-xs rounded transition-all ${copied == data.id
                                                                    ? 'text-green-600 bg-green-50'
                                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                                                                    }`}
                                                                title={copied == data.id ? "Copied!" : "Copy ID"}
                                                                disabled={copied == data.id}
                                                            >
                                                                {copied == data.id ? 'Copied!' : <FiCopy className="w-4 h-4" />}
                                                            </button>

                                                            <button
                                                                onClick={(e)=>{
                                                                    e.stopPropagation();
                                                                    window.open(`/price_changes_detail/${data.id}`, "_blank");
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 transition text-green-600 hover:text-green-700"
                                                                title="Open in new tab"
                                                            >
                                                                <FiExternalLink className="w-4 h-4"/>
                                                            </button>
                                                        </td>
                                                        <td className="py-2 px-4 border-b">{data.date}</td>
                                                        <td className="py-2 px-4 border-b">
                                                            <input type="checkbox" id="urgent_price_change" name="urgent_price_change" className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500"  value={data.asset_type == 'on'} checked={data.asset_type == 'on'} />
                                                        </td>
                                                        <td className="py-2 px-4 border-b">{data.to_category.name}</td>
                                                        <td className="py-2 px-4 border-b">{data.originators.name}</td>
                                                        <td className="py-2 px-4 border-b">{data.created_at}</td>
                                                    </tr>
                                                ))
                                            }
                                    </tbody>
                                </table>

                                <div className="navigation w-full overflow-x-auto">
                                        <ul className="inline-flex whitespace-nowrap min-w-max -space-x-px text-sm">
                                            {paginationInfo?.links?.map((link, index) => (
                                                <li key={index}>
                                                    <button
                                                        onClick={() => {
                                                            if (link.url) {
                                                                const url = new URL(link.url);
                                                                const page = url.searchParams.get('page');
                                                                handlePageClick(Number(page));
                                                            }
                                                        }}
                                                        disabled={!link.url}
                                                        className={`flex items-center justify-center px-3 min-w-[40px] h-8 leading-tight cursor-pointer
                                                            ${link.active ? 'text-gray-600 border border-[#2ea2d1] bg-[#2ea2d1]' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'}
                                                            ${index === 0 ? 'rounded-s-lg' : ''}
                                                            ${index === paginationInfo.links.length - 1 ? 'rounded-e-lg' : ''}
                                                        `}
                                                        >
                                                        {link.label === '&laquo; Previous' ? 'Previous' :
                                                            link.label === 'Next &raquo;' ? 'Next' : link.label}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                </div>

                                {paginationInfo && (
                                    <div className="text-center text-sm text-gray-600 mt-4">
                                        Total {paginationInfo.total} Rows
                                    </div>
                                )}
                            </div>
                        )
                    }
            </div>
        </>
    )
}