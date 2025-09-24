import React, { useEffect, useState } from 'react'
import NavPath from '../../../components/NavPath'
import { Link } from 'react-router-dom'
import FormInput from '../../../components/form/FormInput'
import FormSelect from '../../../components/form/FormSelect'
import { useAuth } from '../../../context/AuthContext'

export default function PurchaseRequest() {

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
                    { path: "/purchase-request", label: "Purchase Request" }
                ]}
            />

            <div className="flex justify-between mr-4">
                <h2 className="text-xl font-semibold ">Purchase Request Form</h2>
                <Link to="#" className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm"
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
                <FormInput
                    id="product_search"
                    label="Product Name or Code"
                    placeholder="Search by product name or code"
                    onChange={() => { }}
                />

                <FormInput
                    id="form_doc_no"
                    label="Form Doc No"
                    placeholder="Enter form doc number"
                    onChange={() => { }}
                />

                <FormInput
                    id="start_date"
                    label="From Date"
                    type="date"
                    onChange={() => { }}
                />

                <FormInput
                    id="end_date"
                    label="To Date"
                    type="date"
                    onChange={() => { }}
                />

                <FormSelect
                    id="branch"
                    label="Branch"
                    options={[
                        { value: "", label: "All Branch" },
                        ...branches.map((b) => ({ value: b.id, label: b.branch_name })),
                    ]}
                />

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


        </div>
    )
}
