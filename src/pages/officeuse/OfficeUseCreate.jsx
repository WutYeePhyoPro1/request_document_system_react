import React, { useContext, useEffect, useRef, useState } from 'react'
import cctvPhoto from "../../assets/images/ban1.png";
import NavPath from '../../components/NavPath';
import { FileUp, Loader2, Search } from "lucide-react";
import OfficeUseStatusSelect from './inputs/OfficeUseStatusSelect';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { AiFillZhihuCircle } from 'react-icons/ai';
import { ESModulesEvaluator } from 'vite/module-runner';

export default function OfficeUseCreate() {

    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [assetType, setAssetType] = useState("off");
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [products, setProducts] = useState([]);
    const [actualQtys, setActualQtys] = useState({});
    const [isLoading, setIsLoading] = useState({ saveBtn: false, saveBtn1: false });
    const [productCode, setProductCode] = useState("");
    const { user } = useAuth();
    const [total, setTotal] = useState(0);

    const form_id = 5;
    const layout_id = 3;

    const [formData, setFormData] = useState({
        branch_code: "",
        product_code: [],
        asset_type: "off",
        system_qty: [],
        actual_qty: [actualQtys],
        remark: [],
        product_name: "",
        unit: [],
        product_type: "",
        price: [],
        product_category_id: [],
        total: [],
        form_id: "5",
        layout_id: "3",
        user_id: user?.id || "",
        total_amount: "0",
        requester_name: "0",
        g_remark: "office_use",
        btnValue: "1",
        route: "office_use"
    });



    const numberWithCommas = (x) => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const adminBranchIds = [1, 18, 19, 20, 21, 22];
    const token = localStorage.getItem('token');


    const handleBranchChange = async (e) => {
        const branchValue = e.target.value;
        setSelectedBranch(branchValue);
        setFormData((prev) => ({
            ...prev,
            branch_code: branchValue,
        }));
    }

    const handleSearch = async () => {
        if (!productCode) {
            Swal.fire({
                icon: "info",
                title: "Warning",
                text: "Please Add Product Code before Search",
            });
            return;
        }

        try {
            // const url = `/api/users/${productCode}/${user.from_branch_id}/search_product_office`;
            const url = `/api/users/${productCode}/2/search_product_office`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const result = await response.json();
            const product = result[0];
            const qty = parseFloat(result[1]);
            console.log(qty);
            if (products.some((p) => p.product_code === product.product_code)) {
                Swal.fire({
                    icon: "error",
                    title: "Warning",
                    text: "Product code duplicate!",
                });
                return;
            }

            setProducts([...products, { ...product, qty }]);
            setProductCode("");
            setFormData((prev) => ({
                ...prev,
                product_code: [...prev.product_code, product.product_code],
                // system_qty: [...prev.system_qty, 5000],
                system_qty: [qty],
                actual_qty: [...prev.actual_qty, 5000],
                // remark: [...prev.remark, ""],
                product_name: product.product_name,
                unit: [product.unit],
                product_type: product.producttype,
                price: [prev.price, product.price],
                product_category_id: [product.maincatid],
                total: [...prev.total, product.price],
            }));
            Swal.fire({
                icon: "success",
                title: "Found",
                text: `Product: ${result[0]?.product_name ?? "Unknown"}`,
            });

        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Product Code does not exist!!",
            });
        }
    };

    const handleSave = () => {
        const total = 10;
        const formattedTotal = numberWithCommas(total);

        Swal.fire({
            icon: "question",
            text: `Total amount သည် ${formattedTotal} ဖြစ်ပါသည်။`,
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axios.post(`api/office_use/${form_id}/${layout_id}/store-form`, formData, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        }
                    });

                    if (response.data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: `Form has been Save successfully!`,
                        }).then(() => {
                            // Optional: Redirect or perform other actions on success
                            // window.location.href = '/some-success-page';
                        });
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error) {
                    console.error('API Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.response?.data?.message || error.message || 'An error occurred while submitting the form',
                    });
                } finally {
                    setIsLoading({ saveBtn: false, saveBtn1: false });
                }

            }
        });

    }

    const handleSendToManager = () => {
        const total = 10;
        Swal.fire({
            icon: "question",
            text: `Total amount သည် ${numberWithCommas(total)} ဖြစ်ပါသည်။`,
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                setFormData((prev) => ({
                    ...prev,
                    btnValue: "2"
                }));

                try {
                    const response = await axios.post(`api/office_use/${form_id}/${layout_id}/store-form`, formData, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        }
                    });
                    if (response.data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: `Form has been Save successfully!`,
                        }).then(() => {

                        });
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error) {
                    console.error('API Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.response?.data?.message || error.message || 'An error occurred while submitting the form',
                    });
                } finally {
                    setIsLoading({ saveBtn: false, saveBtn1: false });
                }
            }
        })
    }




    // Example branches list
    const toBranches = [
        { id: 2, branch_name: "Mandalay Branch" },
        { id: 3, branch_name: "Naypyitaw Branch" },
        { id: 4, branch_name: "Sagaing Branch" },
    ];

    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branches', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setBranches(data);
        }
        catch (error) {
            console.error("Error fetching branches:", error);
        }
    }

    const handleFileClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {

            setLoading(true);
            setTimeout(() => setLoading(false), 2000); // fake loading
        }
    };

    useEffect(() => {
        if (adminBranchIds.includes(user.from_branch_id)) {
            // Admin-like user → show all toBranches
            setBranches(toBranches);
            fetchBranches();
            // setSelectedBranch("");
        } else {
            // Other user → only user's branch
            setBranches([{ id: user.from_branch_id, branch_name: user.from_branches.branch_name }]);
            // setSelectedBranch(user.from_branch_id);
        }
    }, []);

    // Handle window resize for responsiveness
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getStatusClass = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };


    const handleQtyChange = (id, value) => {
        const product = products.find(p => p.id === id);
        const qtyValue = parseFloat(value) || 0;
        if (qtyValue > product.qty) {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: "Actual qty cannot exceed system qty",
            });
            return;
        }

        setActualQtys({
            ...actualQtys,
            [id]: qtyValue
        });
    };


    return (
        <div className="p-4 bg-white shadow-md rounded-lg">
            <div className="mb-4">
                <img
                    src={cctvPhoto}
                    className="w-full h-auto object-contain rounded-lg shadow-md"
                    alt="Office use banner"
                />
            </div>

            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                    { path: "/office-use", label: "Office Use" },
                    { path: "/office-use-create", label: "Create" }
                ]}
            />

            <div className="flex justify-between items-center mt-4 mb-4">
                <h2 className="text-xl font-semibold">Office Use Form</h2>
            </div>

            {/* design input box get */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 text-sm">

                <div className="flex flex-col  md:col-span-2 xl:col-span-1">
                    <label htmlFor="branch_code" className="block mb-1 font-medium text-gray-700">
                        Branch
                    </label>
                    <select
                        id="branch_code"
                        name="branch_code"
                        className="w-full border border-blue-500 focus:outline-none p-2 rounded-md"
                        value={selectedBranch}
                        // onChange={(e) => setSelectedBranch(e.target.value)}
                        onChange={handleBranchChange}
                    >
                        {adminBranchIds.includes(user.from_branch_id) ? (
                            <>
                                <option value="">Select Branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </>
                        ) : (
                            <option value={user.from_branch_id}>
                                {user.from_branches?.branch_name ?? "My Branch"}
                            </option>
                        )}
                    </select>
                </div>

                <div className="flex flex-col  md:col-span-2 xl:col-span-1">
                    <label htmlFor="product_code" className="block mb-1 font-medium text-gray-700">
                        Product Code
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="search"
                            id="product_code"
                            placeholder="Enter product code"
                            className="flex-1 border border-blue-500 focus:outline-none p-2 rounded-md font-bold"
                            value={productCode}
                            onChange={(e) => setProductCode(e.target.value)}
                            onFocus={() => setProductCode("")}
                        />

                    </div>
                </div>

                <div className="flex flex-col justify-end">
                    <button
                        type="button"
                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 flex items-center justify-center h-[42px] mt-auto"
                        onClick={handleSearch}
                        aria-label="Search product"
                    >
                        {isMobile ? <Search size={18} /> : "Search"}
                    </button>
                </div>

                <div className="flex flex-col">
                    <label htmlFor="asset_type" className="block mb-1 font-medium text-gray-700">
                        Case
                    </label>
                    <select
                        id="asset_type"
                        className="w-full border border-blue-500 focus:outline-none p-2 rounded-md"
                        value={formData.asset_type} // ✅ controlled by state
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                asset_type: e.target.value, // ✅ update asset_type in state
                            }))
                        }
                    >
                        <option value="off">Normal</option>
                        <option value="on">Special</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <input
                        type="file"
                        id="excel_import"
                        accept=".xlsx,.xls,.ods"
                        className="hidden"
                    />
                    <button
                        type="button"
                        title="Excel Import"
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition w-full h-[42px] mt-auto"
                    >
                        {!loading ? <FileUp size={18} /> : <Loader2 className="animate-spin" size={18} />}
                        Import
                    </button>
                </div>

                <div className="flex flex-col">
                    {/* <a
                        href="#"
                        title="Excel Sample"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full"
                    > */}
                    <button
                        type="button"
                        // className="bg-teal-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-teal-600 transition w-full h-[42px]"
                        className="flex items-center justify-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition w-full h-[42px] mt-auto"
                    >
                        <span className="hidden md:inline">Sample</span>
                        <i className="fas fa-file-excel md:hidden"></i>
                    </button>
                    {/* </a> */}
                </div>
            </div>
            {/* end of design input box get */}

            <div className="overflow-x-auto col-span-6 mt-4">
                {/* <div className="block xl:hidden bg-gray-100 p-2 rounded-md mb-2 text-center">
                    <p className="text-xs text-gray-600">Swipe horizontally to view full table</p>
                </div> */}

                {/* table and tbody */}
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
                            <th className="py-3 px-3 text-left border-b border-gray-200">Actions</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200">Product Code</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200">Product Name</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200 hidden sm:table-cell">Unit</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200">System Qty</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200 hidden md:table-cell">Qty</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200">Price</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200">Total</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200 hidden lg:table-cell">Remark</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200">Image</th>
                            <th className="py-3 px-3 text-left border-b border-gray-200"></th>
                            <th className="py-3 px-3 text-left border-b border-gray-200"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => {
                            const actualQty = actualQtys[p.id] || 0;
                            const price = parseInt(p.price ?? 0);
                            const total = actualQty * price;

                            return (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-3">
                                        <button
                                            type="button"
                                            title="Remove Asset"
                                            onClick={() => console.log("Remove Asset clicked")}
                                            className="bg-red-600 text-white px-3 py-2 rounded-lg shadow hover:bg-red-700 flex items-center gap-2"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                    <td className="py-3 px-3">{p.product_code}</td>
                                    <td className="py-3 px-3">{p.product_name} {p.unit}</td>
                                    <td className="py-3 px-3">{p.qty}</td>
                                    <td className="py-3 px-3">{p.request_by}</td>
                                    <td className="py-3 px-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max={p.qty}
                                            className="border p-1 rounded w-16 text-center"
                                            value={actualQty}
                                            onChange={(e) => handleQtyChange(p.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="py-3 px-3 hidden sm:table-cell">{p.price}</td>
                                    <td className="py-3 px-3">
                                    </td>
                                    {/* <td className="py-3 px-3 text-right">{numberWithCommas(price)}</td> */}
                                    <td className="py-3 px-3 hidden lg:table-cell">
                                        <textarea
                                            className="w-full border rounded p-2"
                                            placeholder="remark"
                                            value={formData.remark || ""}
                                            onChange={(e) => {
                                                const newRemark = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    remark: newRemark,
                                                }));
                                            }}
                                        />
                                    </td>

                                    <td className="py-3 px-3 text-right font-medium">{numberWithCommas(total)}</td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 hidden lg:table-cell">{p.date}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {/* table and tbody */}

                {/* Mobile card view as alternative to table */}
                {/* <div className="xl:hidden mt-4 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">OUF12345</p>
                                <p className="text-sm text-gray-600">John Doe</p>
                            </div>
                            <span className="bg-yellow-200 text-yellow-800 py-1 px-2 rounded-full text-xs">Ongoing</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-gray-500">Product</p>
                                <p>P001 (Product A)</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Qty</p>
                                <p>10</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Branch</p>
                                <p>Main Branch</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date</p>
                                <p>2023-10-15</p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                        </div>
                    </div>
                </div> */}

                <div className="mt-2">
                    <button
                        className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                        id="saveBtn"
                        onClick={handleSave}
                    >
                        Save as Draf
                    </button>


                    <button
                        className="bg-blue-400 hover:bg-blue-500 ml-4 text-white font-bold py-2 px-4 rounded cursor-pointer"
                        // id="sendToManager"
                        id="saveBtn1"
                        onClick={handleSendToManager}
                    >
                        Send to Manager
                    </button>

                    <button
                        className="bg-yellow-400 hover:bg-yellow-500 ml-4 text-white font-bold py-2 px-4 rounded cursor-pointer"
                    >
                        Cancel
                    </button>


                </div>

            </div>
        </div>
    )
}