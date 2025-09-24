import React, { useEffect, useState } from 'react'
import NavPath from '../../components/NavPath'
import { Link } from 'react-router-dom'
import OfficeUseStatusSelect from './inputs/OfficeUseStatusSelect'
import { useAuth } from '../../context/AuthContext';
import Select from 'react-select/base';

export default function OfficeUseIndex() {

    const [branches, setBranches] = useState([]);
    const { user } = useAuth();
    const userId = user?.id ?? '';
    const token = localStorage.getItem('token');

    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branches', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setBranches(data);
        } catch (error) {
            console.error('Fetch branches error:', error);
        }

    };

    useEffect(() => {
        fetchBranches();

    }, [userId]);



    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                    { path: "/office-use", label: "Office Use" }
                ]}
            />
            
            <div className="flex justify-between mr-4">
                <h2 className="text-xl font-semibold ">Office Use Form</h2>
                <Link to="/office-use-create" className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm"
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
                        Product Name or Code
                    </label>
                    <input

                        id="form_doc_no"
                        type="text"
                        placeholder="Search by product name or code"
                        className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                        onFocus={(e) => e.target.style.borderColor = '#6fc3df'}
                        onBlur={(e) => e.target.style.borderColor = '#2ea2d1'}
                        style={{ borderColor: '#2ea2d1' }}
                        // value={ }
                        onChange={() => { }}
                    />
                </div>

                <div className="flex flex-col">
                    <label
                        htmlFor="form_doc_no"
                        className="mb-1 font-medium text-gray-700"
                    >
                        Form Doc No
                    </label>
                    <input
                        id="form_doc_no"
                        type="text"
                        placeholder="Enter form doc number"
                        className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                        onFocus={(e) => (e.target.style.borderColor = "#6fc3df")}
                        onBlur={(e) => (e.target.style.borderColor = "#2ea2d1")}
                        style={{ borderColor: "#2ea2d1" }}
                        // value={ }
                        onChange={() => { }}
                    />
                </div>

                <div className="flex flex-col">
                    <label
                        htmlFor="start_date"
                        className="mb-1 font-medium text-gray-700"
                    >
                        From Date
                    </label>
                    <input
                        id="start_date"
                        type="date"
                        className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                        onFocus={(e) => (e.target.style.borderColor = "#6fc3df")}
                        onBlur={(e) => (e.target.style.borderColor = "#2ea2d1")}
                        style={{ borderColor: "#2ea2d1" }}
                        // value={ }
                        onChange={() => { }}
                    />
                </div>

                <div className="flex flex-col">
                    <label
                        htmlFor="end_date"
                        className="mb-1 font-medium text-gray-700"
                    >
                        To Date
                    </label>
                    <input
                        id="end_date"
                        type="date"
                        className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                        onFocus={(e) => (e.target.style.borderColor = "#6fc3df")}
                        onBlur={(e) => (e.target.style.borderColor = "#2ea2d1")}
                        style={{ borderColor: "#2ea2d1" }}
                        // value={ }
                        onChange={() => { }}
                    />
                </div>

                <OfficeUseStatusSelect
                    availableStatuses={[
                        "All",
                        "Default",
                        "Ongoing",
                        "Checked",
                        "MerMgr Approved",
                        "Mgr Approved",
                        "BM Approved",
                        "Acknowledged",
                        "Approved",
                        "OpApproved",
                        "Recommend",
                        "Issued",
                        "Received",
                        "Completed",
                        "Cancel"
                    ]}
                    defaultSelected={["Ongoing", "Approved"]}
                />

                <div className="flex flex-col">
                    <label htmlFor="branch" className="mb-1 font-medium text-gray-700">
                        Branch
                    </label>
                    <select
                        id="branch"
                        name="branch"
                        className="border focus:outline-none p-2 w-full rounded-md"
                        // value={formData.branch}
                        // onChange={handleChange}
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
                        // onClick={handleSearch} 
                        style={{
                            backgroundColor: '#2ea2d1',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}>
                        Search
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="hidden xl:table min-w-full bg-white border border-gray-200 text-sm">
                    <thead>
                        <tr className="w-full bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
                            <th className="py-3 px-6 text-left border-b border-gray-200">Form Doc No</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Request By</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Branch</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Product Code</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Product Name</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Quantity</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Status</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Date</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600">
                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">OUF12345</td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">John Doe</td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">Main Branch</td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">P001</td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">Product A</td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">10</td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">
                                <span className="bg-yellow-200
                                    text-yellow-800 py-1 px-3 rounded-full text-xs">Ongoing</span>
                            </td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">10</td>
                            <td className="py-3 px-6 text-left whitespace-nowrap border-b border-gray-200">10</td>
                        </tr>
                    </tbody>
                </table>
            </div>


        </div >
    )
}
