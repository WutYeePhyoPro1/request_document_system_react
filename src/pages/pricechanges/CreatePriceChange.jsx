import React, { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import NavPath from "../../components/NavPath";
import ProductTable from "../../components/ProductTable"
import { FaFileImport,FaSpinner } from "react-icons/fa";

import $ from "jquery";
import Select from 'react-select'
import axios from "axios";
import Swal from "sweetalert2";

import {validateForm} from "../../components/Validator.jsx";
import {showValidationErrors,validateArrayField} from "../../components/Validator.jsx";
import {formatDate} from "../../components/Fomatter.jsx";
import ServerTime from "../../components/ServerTime";
import * as XLSX from "xlsx";

export default function () {


    const navigate = useNavigate();
    const today = () => new Date().toISOString().split("T")[0];
    const minDate = today();
    const maxDate = new Date();
    // maxDate.setFullYear(today.getFullYear() + 5);
    maxDate.setMonth(new Date().getMonth() + 1);

    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formState, setFormState] = useState({
        change_price_date: today(),
        effective_date: today(),
        urgent_price_change: true,
        category_id: "",
        comment: "",
        branch_price: "",
        all_branches: false,
        branches: [],

        form_id: 21,
        layout_id: 19,
        route: "price_changes"
    });
    const [products,setProducts] = useState([]);

    const token = localStorage.getItem('token');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searching,setSearching] = useState(false);
    const [importing,setImporting] = useState(false);
 
    const changeHandler = (e,actionMeta) => {
         // react-select
        // console.log(e,action);
        if (!e?.target) {
            const name = actionMeta?.name;
            setFormState(prev => ({
            ...prev,
            [name]: e ? e.value : null,
            }));
            return;
        }

        const { name, value, type, checked } = e.target;


        // checkbox group: branches[]
        if (name === "branches") {
            setFormState(prev => {
                const updatedBranches = checked
                ? [...prev.branches, Number(value)]
                : prev.branches.filter(id => id !== Number(value));

                const allSelected = updatedBranches.length === branches.length;

                return {
                ...prev,
                branches: updatedBranches,
                all_branches: allSelected,
                };
            });
            return;
        }
        // All branches checkbox
        if (name === "all_branches") {
            setFormState(prev => ({
                ...prev,
                all_branches: checked,
                branches: checked ? branches.map(b => b.id) : [],
            }));
            return;
        }


        // setFormState((prevData) => ({
        //     ...prevData,
        //     [name]: type === "checkbox" ? checked : value,
        // }));
        setFormState(prev => {
            let updated = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };

            if (name === "effective_date") {
                updated.urgent_price_change = value === today();
            }

            return updated;
        });
        console.log(formState)
    };
    const pricesHandler = (e,product_code)=>{
        const { name, value, type, checked } = e.target;
        console.log(products);
        // console.log("Price",products);
        // console.log(name,value);
        setProducts((prev)=> 
            prev.map(item =>
                item.product_code === product_code
                    ? { ...item, [name]: value }
                    : item
            )
        )
    };


    const [productCode,setProductCode] = useState("");
    const searchSchema = {
        product_code: {required: true,minLength: 1},
        branch_price: {required: true}
    }
    const searchMessages = {
        branch_price: {
            required: 'Please select branch price'
        },
        product_code: {
            required: 'Please Add Product Code before Search',
            // required: 'ကုန်ပစ္စည်းကုဒ် ဖြည့်ပါ',
        }
    };
    const searchHandler = async () => {
            setSearching(true);

            try{
                var branch_code = formState.branch_price;
                const datas = {
                    branch_price: String(branch_code),
                    product_code: productCode
                };
                
                const errors = validateForm(datas, searchSchema, searchMessages);

                
                if (showValidationErrors(errors)) return;

                // Duplicate Product Code
                const exists = products.some(
                    p => p.product_code === productCode
                );
                if(exists){
                    Swal.fire({
                        icon: 'error',
                        title: 'Warning',
                        text: 'Please Change product code (product code duplicate)!',
                    });
                    return;
                }

                    try {
                    // setLoading(true);
                    // setError(null);

                        const { data } = await axios.get(
                        `/api/price_changes/search_product/${productCode}/${branch_code}`,
                        {
                            headers: {
                            Authorization: `Bearer ${token}`,
                            },
                        }
                        );
                        console.log(data);
                        const apiProduct = data.data;

                        const result = {
                            ...apiProduct,
                            product_code: apiProduct.barcode,
                            price1: apiProduct.price1 ?? '',
                            price2: apiProduct.price2 ?? ''
                        };
                        if(!data.error){
                            setProductCode("");
                            setProducts((prev)=>[...prev,result]); // data: {barcode: '8806084625007', product_name: 'LG Refrigerator GN-Y201CQS(164Ltr,1Door)', unit: 'PC', price: '1279000.0000'}
                        }else{
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Product Code does not exist!!',
                            });
                        }


                    } catch (err) {
                        console.error(err);
                        // setError("Failed to load product data");
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Product Code does not exist!!',
                        });
                    } finally {
                        // setLoading(false);
                    
                    }
            }catch(err){
                console.error(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Product Code does not exist!!',
                });
            }finally {
                setSearching(false);
            }
            
    };
    const  fetchProduct = async () => {
        try {
        // setLoading(true);
        // setError(null);

            const { data } = await axios.get(
            `/api/price_changes/search_product/${productCode}/${branch_code}`,
            {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            }
            );
            console.log(data);
            const apiProduct = data.data;

            const result = {
                ...apiProduct,
                product_code: apiProduct.barcode,
                price1: apiProduct.price1 ?? '',
                price2: apiProduct.price2 ?? ''
            };
            if(!data.error){
                setProductCode("");
                setProducts((prev)=>[...prev,result]); // data: {barcode: '8806084625007', product_name: 'LG Refrigerator GN-Y201CQS(164Ltr,1Door)', unit: 'PC', price: '1279000.0000'}
            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Product Code does not exist!!',
                });
            }


        } catch (err) {
            console.error(err);
            // setError("Failed to load product data");
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product Code does not exist!!',
            });
        } finally {
            // setLoading(false);
        
        }
    }

    const removeHandler = (e,product_code)=>{
        e.preventDefault();
        // console.log(product_code);

        setProducts((prev)=>
            prev.filter(item =>item.product_code != product_code)
        )
    }

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     setIsSubmitting(true);
    //     try {
    //         const token = localStorage.getItem('token');
    //         const response = await fetch("/api/cctv-records", {
    //             method: "POST",
    //             mode: "cors",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Accept": "application/json",
    //                 "Authorization": `Bearer ${token}`,
    //             },
    //             credentials: "include",
    //             body: JSON.stringify(formData),
    //         });

    //         const data = await response.json();

    //         if (!response.ok) {
    //             if (response.status === 422) {
    //                 let errorMessages = "";
    //                 Object.values(data.errors).forEach(errorArray => {
    //                     errorArray.forEach(error => {
    //                         errorMessages += `• ${error}\n`;
    //                     });
    //                 });
    //                 confirmAlert({
    //                     title: "Oops! Please fix these errors",
    //                     message: errorMessages,
    //                     buttons: [
    //                         {
    //                             label: "OK",
    //                             onClick: () => { },
    //                         },
    //                     ],
    //                 });
    //             } else {
    //                 throw new Error(data.message || "Something went wrong");
    //             }
    //         } else {
    //             confirmAlert({
    //                 title: "Success",
    //                 message: "Form submitted successfully!",
    //                 buttons: [
    //                     {
    //                         label: "OK",
    //                         onClick: () => {
    //                             navigate("/cctv_record");
    //                         },
    //                     },
    //                 ],
    //             });
    //         }
    //     } catch (error) {
    //         console.error("Error submitting form:", error);
    //         confirmAlert({
    //             title: "Error",
    //             message: "Something went wrong while submitting the form.",
    //             buttons: [
    //                 {
    //                     label: "OK",
    //                     onClick: () => { },
    //                 },
    //             ],
    //         });
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // };


    const submitHandler = async (e)=>{
        e.preventDefault();
        setIsSubmitting(true);
            const formData = {
            ...formState,
            products
        };
        console.log(formData);

        const schema = {
            change_price_date: { required: true, type:"date" },
            effective_date: { required: true, type:"date" },
            category_id: {required: true},
            comment: {maxLength: 250},
            branch_price: {required: true},
            branches: {required: true},
            products: {required: true},
        };

        const messages = {
            change_price_date: {
                required: "Change Price Date is required."
            },
            effective_date: {
                required: "Effective Date is required."
            },
            category_id: {
                required: "Please Choose Category."
            },
            comment: {
                maxLength: "Remark must not exceed a maximum of 250 characters."
            },
            branch_price: {
                required: "Branch Price is required."
            },
            branches: {
                required: "Please check the branches."
            },
            products: {
                required: "Please add at least one product code."
            },
        }

        const errors = validateForm(formData, schema, messages);
        if (showValidationErrors(errors)) return;



        // Start Validate Prices
        const productSchema = {
            price1: { required: true, numeric: true, min: 1},
            price2: { required: true, numeric: true, min: 1}
        };
        const productMessages = {
            price1: {
                required: "Price 1 is required.",
                numeric: "Price 1 must be numeric value."
            },
            price2: {
                required: "Price 2 is required.",
                numeric: "Price 2 must be numeric value."
            }
        }

        const productErrors = validateArrayField(formData.products, productSchema, 'Product',productMessages);

        const messagesSet = Array.from(new Set(Object.values(productErrors))).map((msg, idx) => [`error_${idx}`, msg]);
        const displayErrors = Object.fromEntries(messagesSet);

        if (showValidationErrors(displayErrors, 'Product Validation Error')) return;
        // End Validate Prices

        // try{
        //     const {data} = await axios.post("/api/price_changes",{form});
        // }catch(err){

        // }
    }
    const excelImportHandler = async (e) => {
        setImporting(true);

        try{
            const errors = validateForm(formState, {branch_price: {required: true}}, searchMessages);
            if (showValidationErrors(errors)) return;


            const file = e.target.files[0];
            if (!file) return;

            const data = await file.arrayBuffer();

            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            // console.log(jsonData);

            const importSchema = {
                'Product Code': {required:true},
                'Price 1': {required:true,numeric: true, min: 1},
                'Price 2': {required:true,numeric: true, min: 1}
            }
            const importMessage = {
                'Product Code': {required: "Product Code is required."},
                'Price 1': {required: "Product Code is required.", numeric: "Price 1 must be numeric value."},
                'Price 2': {required: "Product Code is required.", numeric: "Price 1 must be numeric value."},
            }

            const importErrors = validateArrayField(jsonData, importSchema, 'Product',importMessage);

            const messagesSet = Array.from(new Set(Object.values(importErrors))).map((msg, idx) => [`error_${idx}`, msg]);
            const displayErrors = Object.fromEntries(messagesSet);

            if (showValidationErrors(displayErrors, 'Excel Validation Error')) return;

            
            for (const [index, row] of jsonData.entries()) {
                console.log("Row", index + 1, row);

                // Duplicate Product Code
                const exists = products.some(
                    p => p.product_code === productCode
                );
                if(exists){
                    // continue next row 
                }

                fetchProduct();
        
            }
        }catch(err){
            console.log(err);
        }finally {
            setImporting(false);
        }
    };
    const excludeBranchIds = [1];
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
            let list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.data?.data)
                        ? data.data.data
                        : [];
            list = [...list]
                            .filter((br)=>!excludeBranchIds.includes(br.id)).sort((a,b)=>a.id > b.id ? 1 : -1);

            setBranches(list);
        } catch (error) {
            console.error('Fetch branches error:', error);
            setBranches([]);
        }
    }
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const options = branches.map(branch => ({
        value: branch.id,      
        label: branch.branch_name
    }));
    // const options = [...branches]
    //                 .sort((a, b) => a.id > b.id ? 1 : -1)
    //                 .map(branch => ({
    //                     value: branch.id,
    //                     label: branch.branch_name
    //                 }));


    const excludeCategoryIds = [14];
    const fetchProductCategories = async () => {
        try {
            const response = await fetch('/api/product-categories', {
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
                    .filter((br)=>!excludeCategoryIds.includes(br.id)).sort((a,b)=>a.id > b.id ? 1 : -1);
            // console.log(list);
            setCategories(list);
        } catch (error) {
            console.error('Fetch branches error:', error);
            setCategories([]);
        }
    }
    const catOptions = categories.map(category => ({
        value: category.id,      
        label: category.name
    }));


    useEffect(() => {
        fetchBranches();
        fetchProductCategories();
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
                            type="button"
                            class="px-4 py-2 text-sm rounded-lg
                                border border-gray-300 text-gray-700
                                hover:bg-gray-100 transition"
                            >
                            Save as Draft
                        </button>

                        <button
                            type="button"
                            class="px-4 py-2 text-sm rounded-lg
                                bg-blue-600 text-white
                                hover:bg-blue-700 transition"
                            onClick={submitHandler}    
                            >
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


           
            <div className="h-auto md:h-[calc(100vh-14rem)] grid grid-cols-1 lg:grid-cols-12 gap-4s p-0">

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
                        <input type="checkbox" id="all_branches" name="all_branches" className="rounded text-indigo-600" onChange={changeHandler}  checked={formState.all_branches} />
                        All Branches
                        </label>
                        {
                            branches.map((branch,idx)=>(
                                <label key={idx} className="flex items-center gap-3 text-sm ms-4"><input id="branches" name="branches" type="checkbox"   value={branch.id} onChange={changeHandler}  checked={formState.branches.includes(branch.id)}/> {branch.branch_name}</label>
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

                                {/* <div className="text-sm text-right">
                                <p className="text-slate-500">Server Time</p>
                                <p className="font-semibold text-slate-800">11:07:44</p>
                                </div> */}
                                <ServerTime/>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4">
                                {/* <div>
                                <label className="text-xs font-medium text-slate-600">Change Price No</label>
                                <input className="mt-1 w-full px-3 py-2 border rounded-lg bg-slate-50" value="CPMM107-260119-002"/>
                                </div> */}

                                <div>
                                <label className="text-xs font-medium text-slate-600">Change Price Date</label>
                                    <input type="date" id="change_price_date" name="change_price_date" className="border focus:outline-none  p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.change_price_date} readOnly/>
                                </div>

                                <div>
                                <label className="text-xs font-medium text-slate-600">Effective Date</label>
                                <input type="date" id="effective_date" name="effective_date" className="border focus:outline-none  p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.effective_date} min={today()} />
                                </div>


                                <div className="flex items-center gap-2 mt-6">
                                    <input type="checkbox" id="urgent_price_change" name="urgent_price_change" className="rounded text-red-600"  onChange={changeHandler} value={formState.urgent_price_change} checked={formState.effective_date == today()} />
                                    <span className="text-sm font-medium text-red-600">Urgent Price Change</span>
                                </div>

                             
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Department</label>
                                    <Select
                                        id="category_id"
                                        name="category_id"
                                        options={catOptions}
                                        placeholder="Select Category"
                                        isSearchable={true}
                                        isClearable
                                        // value={selectedCategory}                
                                        // onChange={(selected) => {
                                        //     setSelectedCategory(selected);
                                        // }}
                                        onChange={changeHandler}  
                                        value={
                                            catOptions.find(opt => opt.value === formState.category_id) || null
                                        }
                                        styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            minHeight: "3rem",          
                                            borderColor: "#2ea2d1",
                                            borderRadius: "0.5rem",
                                        }),
                      
                                        }}
                                    />
                                </div>

                         

                                {/* <div>
                                <label className="text-xs font-medium text-slate-600">Competitor</label>
                                <input className="mt-1 w-full px-3 py-2 border rounded-lg bg-slate-50" value="No Competitor"/>
                                </div> */}

                                <div className="lg:col-span-2">
                                    <label className="text-xs font-medium text-slate-600">Remark</label>
                                    <textarea
                                        id="comment"
                                        name="comment"
                                        className="border focus:outline-none p-2 w-full rounded-md bg-white"
                                        rows="1"
                                        style={{ borderColor: '#2ea2d1' }}
                                        onChange={changeHandler} value={formState.comment}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-600">Branch Price</label>
                                     <Select
                                        id="branch_price"
                                        name="branch_price"
                                        options={options}
                                        placeholder="Select Status"
                                        isSearchable={true}  // allows typing to filter options
                                        isClearable
                                        onChange={changeHandler}
                                        value={
                                            options.find(opt => opt.value === formState.branch_price) || null
                                        }
                                        styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            minHeight: "3rem",          
                                            borderColor: "#2ea2d1",
                                            borderRadius: "0.5rem",
                                        }),
                      
                                        }}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <div className="w-full">
                                    <label className="text-xs font-medium text-slate-600">Product Code</label>
                                    <input type="text" className="border focus:outline-none  p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={(e) => setProductCode(e.target.value)} value={productCode}/>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 items-end">

                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center
                                                px-4 py-2
                                                text-sm font-medium
                                                bg-cyan-600 text-white rounded-lg
                                                hover:bg-cyan-700 active:bg-cyan-800
                                                transition
                                                focus:outline-none focus:ring-4 focus:ring-cyan-300"
                                        onClick={searchHandler}
                                        disabled={searching}
                                    >
                                        {  searching ? 'Loading....' : 'Search'}
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
                                        disabled={importing}
                                    >
                                        {importing ? (
                                            <FaSpinner className="text-base animate-spin" />
                                        ) : (
                                            <FaFileImport className="text-base" />
                                        )}
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
                                        onChange={excelImportHandler}
                                    />
                                </div>
                            </div>
                        </header>
                        
                        <div className="p-2">
                            {/* <div class="px-6 py-4 border-b"> */}
                                <h2 class="text-base font-semibold text-slate-800">Product Prices</h2>
                            {/* </div> */}


                            <ProductTable data={products} pricesHandler={pricesHandler} removeHandler={removeHandler}/>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
