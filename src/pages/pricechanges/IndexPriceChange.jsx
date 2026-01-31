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

import {fetchPriceChanges,setFilter,clearFilters,isFiltersEmpty} from "./../../store/pricechangeSlice";


export default function IndexPriceChange() {
    const token = localStorage.getItem('token');
    
    const statusOptions = [
        { value: "Ongoing", label: "Ongoing" },
        { value: "BM Approved", label: "BM Approved" },
        { value: "Approved", label: "Approved" },
        { value: "Completed", label: "Completed" },
        { value: "Cancel", label: "Cancel" },
    ];
    const [branches, setBranches] = useState([]);

    const {loading,error,datas,filters} = useSelector((state)=>state.pricechanges)

    const dispatch = useDispatch();
    const navigate = useNavigate();
    

    useEffect(()=>{
        dispatch(fetchPriceChanges({filters,searchQuery: !isFiltersEmpty ? 'all' : ''}));
    },[dispatch]);


    useEffect(() => {
        fetchBranches();
    }, []);
    
    const onChangeHandler = (e)=>{
        dispatch(setFilter({
            [e.target.name]: e.target.value
        }))
    }


    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branches', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
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

    const searchHandler = (e)=>{
        e.preventDefault();
        dispatch(fetchPriceChanges({filters,searchQuery:"all"}));
    }

    const clearHandler = (e)=>{
        dispatch(clearFilters())
        dispatch(fetchPriceChanges());
    }

    return (
        <>
        {
            !loading && !error && (
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
                                <Link to="/price_changes/create" className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm"
                                    style={{
                                        backgroundColor: '#2ea2d1',
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
                                >
                                    Add
                                </Link>
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
                                        id="name"
                                        isMulti
                                        name="search_status"
                                        options={statusOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        value={statusOptions.filter(option => filters.search_status.includes(option.value))}
                                        // onChange={(selected) => {
                                        //     const selectedValues = selected.map((opt) => opt.value);
                                        //     setFormData((prev) => ({
                                        //         ...prev,
                                        //         status: selectedValues,
                                        //     }));
                                        // }}
                                        placeholder="Select Status"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="branch" className="mb-1 font-medium text-gray-700">
                                        Branch
                                    </label>
                                    <select
                                        id="branch"
                                        name="branch"
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
                                </div>


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

                            <div className="overflow-x-auto">
                                <table className="xl:table min-w-full bg-white border border-gray-200 text-sm">
                                    <thead className="bg-gray-100 text-left">
                                        <tr>
                                            <th className="py-2 px-4 border-b">No</th>
                                            <th className="py-2 px-4 border-b">Status</th>
                                            <th className="py-2 px-4 border-b">Document No</th>
                                            <th className="py-2 px-4 border-b">Effective Date</th>
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
                                                    className="cursor-pointer hover:bg-[#efefef] transition"
                                                    >
                                                        <td className="py-2 px-4 border-b">{++idx}</td>
                                                        <td className="py-2 px-4 border-b">
                                                            <StatusBadge status={data.status} />
                                                        </td>
                                                        <td className="py-2 px-4 border-b">{data.form_doc_no}</td>
                                                        <td className="py-2 px-4 border-b">{data.date}</td>
                                                        <td className="py-2 px-4 border-b">{data.to_category.name}</td>
                                                        <td className="py-2 px-4 border-b">{data.originators.name}</td>
                                                        <td className="py-2 px-4 border-b">{data.created_at}</td>
                                                    </tr>
                                                ))
                                            }
                                    </tbody>
                                </table>


                            </div>

                    </div >
                </>
            )
        }
        </>
    )

}