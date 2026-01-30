import React, { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate,useParams } from "react-router-dom";
import NavPath from "../../components/NavPath";
import ProductTable from "../../components/ProductTable"
import { FaFileImport,FaSpinner } from "react-icons/fa";
import { FiCopy } from 'react-icons/fi';

import $ from "jquery";
import Select from 'react-select'
import axios from "axios";
import Swal from "sweetalert2";

import {validateForm} from "../../components/Validator.jsx";
import {showValidationErrors,validateArrayField} from "../../components/Validator.jsx";
import {formatDate,formatStrDateTime} from "../../components/Fomatter.jsx";
import ServerTime from "../../components/ServerTime";
import FullPageLoader from "../../components/FullPageLoader";
import * as XLSX from "xlsx";
import { m } from "framer-motion";

import StatusBadge from '../../components/ui/StatusBadge';


export default function () {
    const productslimit = 50;
    const token = localStorage.getItem('token');

    const navigate = useNavigate();
    const { id } = useParams();
    

    const today = () => new Date().toISOString().split("T")[0];
    const minDate = today();
    const maxDate = new Date();
    // maxDate.setFullYear(today.getFullYear() + 5);
    maxDate.setMonth(new Date().getMonth() + 1);

    const [branches, setBranches] = useState([]);
    let branch_length = 0;
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
    let totalProductCount = products.length;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searching,setSearching] = useState(false);
    const [importing,setImporting] = useState(false);
    const [forceLoading, setForceLoading] = useState(false);

    const [originator,setOriginator] = useState(null);
    const [getApprover,setGetApprover] = useState(null);
    const [getSupervisor,setGetSupervisor] = useState(null);

    const [approver,setApprover] = useState(null);
    const [supervisor,setSupervisor] = useState(null);

    const [copied, setCopied] = useState(false);
 
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

        if(name == 'urgent_price_change'){
            return
        }

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
    const [pricesErrors,setPricesErrors] = useState({});

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

                // Exceed Product Rows
                if(productsExceedLimit(productslimit)){
                    Swal.fire({
                        icon: 'error',
                        title: 'Product Rows Exceed Limit',
                        text: `User can\'t add products more than  ${productslimit} rows.`,
                    });
                    return;
                }

                await fetchProduct(productCode);


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
    const  fetchProduct = async (code,row={}) => {
        var branch_code = formState.branch_price;

        try {
        // setLoading(true);
        // setError(null);

            const { data } = await axios.get(
            `/api/price_changes/search_product/${code}/${branch_code}`,
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
                price1: apiProduct.price1 || row["Price 1"] || '',
                price2: apiProduct.price2 | row["Price 2"] || '',
                net_cost_price: 0,
                profit: 0,
                remark: 0
            };
            if(!data.error){
                setProductCode("");
                setProducts((prev)=>[...prev,result]); // data: {barcode: '8806084625007', product_name: 'LG Refrigerator GN-Y201CQS(164Ltr,1Door)', unit: 'PC', price: '1279000.0000'}
            }else{
                // Swal.fire({
                //     icon: 'error',
                //     title: 'Error',
                //     text: 'Product Code does not exist!!',
                // });
                throw new Error("Product fetch failed");
            }


        } catch (err) {
            console.error(err);
            // setError("Failed to load product data");
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product Code does not exist!!',
            });
            throw err;
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

    const submitHandler = async (e,btntype)=>{
        e.preventDefault();
    
        const formData = {
            ...formState,
            products,
            btnValue: btntype
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
            price2: { required: true, numeric: true, min: 1, max:"price1"}
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
        setPricesErrors(productErrors);
        const messagesSet = Array.from(new Set(Object.values(productErrors))).map((msg, idx) => [`error_${idx}`, msg]);
        const displayErrors = Object.fromEntries(messagesSet);

        if (showValidationErrors(displayErrors, 'Product Validation Error')) return;
        // End Validate Prices

        setForceLoading(true);
        setIsSubmitting(true);
        try{
            const res = await axios.patch(`/api/price_changes/${id}/update`,formData,{
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });
            console.log(res.data);

            const data = res.data;

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
                }
                return;
            }

            await Swal.fire({
                icon: "success",
                title: "Form submitted successfully!",
                text: data.message,
            });
            // fetchPriceChange(); 
            navigate(0);
            // navigate("/price_changes");

        }catch(err){
            console.log('There is an error in saving price change document:',err);
            // setLoader(false);

            Swal.fire({
                icon: "error",
                title: "Form Submit Error!!",
                text: "Something went wrong while submitting the form.",
            });
        }finally{
            setForceLoading(false);
            setIsSubmitting(false);
        }
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
                'Price 1': {required: "Price 1 is required.", numeric: "Price 1 must be numeric value."},
                'Price 2': {required: "Price 2 is required.", numeric: "Price 2 must be numeric value."},
            }

            const importErrors = validateArrayField(jsonData, importSchema, 'Product',importMessage);
            console.log(importErrors);
            const messagesSet = Array.from(new Set(Object.values(importErrors))).map((msg, idx) => [`error_${idx}`, msg]);
            const displayErrors = Object.fromEntries(messagesSet);

            if (showValidationErrors(displayErrors, 'Excel Validation Error')) return;


            const pricesAlerts = validateArrayField(jsonData, {'Price 2': {required:true,numeric: true, min: 1, max:"Price 1"}}, 'Product',importMessage);
            setPricesErrors(pricesAlerts);
            for (const [index, row] of jsonData.entries()) {
                const code = row['Product Code'];
                console.log("Row", index + 1, row);
                
                // Duplicate Product Code
                const exists = products.some(
                    p => p.product_code == code
                );
                if(exists){
                    // continue next row 
                    continue;
                }

                // Exceed Product Rows
                // console.log(productsExceedLimit(productslimit));
                if (totalProductCount >= productslimit) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Product Rows Exceed Limit',
                        text: `User can\'t add products more than  ${productslimit} rows.`,
                    });
                    break;
                }

                try {
                    await fetchProduct(code,row);
                    totalProductCount++;
                } catch (err) {
                    console.error(err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Import stopped',
                        text: `Import failed at row ${index + 1}`,
                    });
                    break;
                }finally{
                }
        
            }
        }catch(err){
            console.log(err);
        }finally {
            setImporting(false);
            e.target.value = "";
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
            branch_length = list.length;
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

    const fetchPriceChange = async ()=> {
        try{

            const {data} = await axios.get(`/api/price_changes_detail/${id}`, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });
            console.log(data);

            const transformedProducts = data.price_changes.map(item => ({
                ...item,
                price: item.reference_price
            }));
            setProducts(transformedProducts);

            const general_form = data.general_form;
            const price_change_branches = data.price_change_branches;
            const normalizedForm = {
                ...general_form,
                change_price_date: general_form.created_at ? formatDate(new Date(general_form.created_at)): '',
                effective_date: general_form.date_formatted ? formatDate(new Date(general_form.date_formatted)): '',
                branches:  price_change_branches.map(brch=>brch.branch_id),
                urgent_price_change: general_form.asset_type == 'on',
                category_id: general_form.to_department,
                comment: general_form.remark,
                branch_price: general_form.to_branch,
                all_branches: price_change_branches.length == branch_length,

                form_id: 21,
                layout_id: 19,
                route: "price_changes"
            }
            console.log(price_change_branches.length, branch_length);

            setFormState(normalizedForm);
            
            setOriginator(data.stakeholders.originator);
            setGetSupervisor(data.stakeholders.getApprover);
            setGetApprover(data.stakeholders.getApprover);

            setSupervisor(data.authorities.supervisor);
            setApprover(data.authorities.approver);
        } catch(error){
            console.error('Fetch branches error:', error);
        }

    }


    const productsExceedLimit = (limit)=>{
        return products.length >= limit
    }


    useEffect(() => {
        fetchBranches();
        fetchProductCategories();
        fetchPriceChange();
    }, []);

    const handleCopy = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(formState.form_doc_no)
                .then(() => {
                    setCopied(true);
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


    const approveHandler = async (e)=>{
        var btnStatus = e.target.value;
        var btnText = e.target.textContent;



        Swal.fire({
            icon: "question",
            text:  `Are you sure you want to ${btnText}?`,
            showCancelButton: true,
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
        }).then(async (result) => {
            if (result.isConfirmed) {
                setForceLoading(true);
                setIsSubmitting(true);

                const formData = {
                    status: btnStatus
                }
                try{
                    const res = await axios.post(`/api/price_changes/${id}/approve`,formData,{
                        headers: {
                        Authorization: `Bearer ${token}`,
                        },
                    });
                    console.log(res.data);

                    const data = res.data;

                    if(data.success == false){
                      return;
                    }

                    Swal.fire({
                        icon: "success",
                        title: "Form submitted successfully!",
                        text: data.message,
                    });
                    // fetchPriceChange(); 
                    navigate(0);
                    // navigate("/price_changes");

                }catch(err){
                    console.log('There is an error in saving price change document:',err);
                    // setLoader(false);

                    Swal.fire({
                        icon: "error",
                        title: "Form Submit Error!!",
                        text: "Something went wrong while submitting the form.",
                    });
                }finally{
                    setForceLoading(false);
                    setIsSubmitting(false);
                }
            }
        });
    };

    return (
        <>
        {forceLoading && <FullPageLoader />}
        <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                    { path: "/price_changes", label: "Price Changes" },
                    { path: "/price_changes/create", label: "Price Change Form" },
                ]}
            />

            {/* Main Unitary Card */}
            <div className="mt-4 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                
                {/* Action Bar as Card Header */}
                <header className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-xl font-bold text-blue-900 flex flex-wrap items-center gap-2">
                            Price Change Form <span className="text-lg">({formState.form_doc_no})</span>
                            <button
                                onClick={handleCopy}
                                className={`ml-2 px-2 py-1 text-xs rounded transition-all ${copied
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                                    }`}
                                title={copied ? "Copied!" : "Copy ID"}
                                disabled={copied}
                            >
                                {copied ? 'Copied!' : <FiCopy className="w-4 h-4" />}
                            </button>
                            <StatusBadge status={formState?.status ? formState?.status : ''} />
                        </h3>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                       
                            {

                                ((supervisor || approver) && formState.status != 'Partial') ?
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                                    onClick={(e) => submitHandler(e) }
                                >
                                    Update
                                </button> : ''
                            }


                            {
                                supervisor &&        
                                <button
                                    className="px-4 py-2 text-sm rounded-lg
                                        bg-amber-500 text-white
                                        hover:bg-amber-600 transition"
                                    value="Checked"
                                    onClick={approveHandler}
                                        >
                                    Check
                                </button>
                            }
                     
                            {
                                approver &&
                                <button
                                    className="px-4 py-2 text-sm rounded-lg
                                        bg-green-600 text-white
                                        hover:bg-green-700 transition"
                                    value="Approved"
                                    onClick={approveHandler}
                                    >
                                    Approve
                                </button>

                            }
                          
                            {
                                (supervisor || approver) ?
                                <button
                                    className="px-4 py-2 text-sm rounded-lg
                                        bg-red-600 text-white
                                        hover:bg-red-700 transition"
                                    value="Rejected"
                                    onClick={approveHandler}
                                    >
                                    Reject
                                </button> : ''
                            }

                        </div>
                    </div>
                </header>

                {/* Card Body Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    
                    {/* Branch Sidebar (Left Column) */}
                    <aside className="lg:col-span-2 border-r border-gray-100 flex flex-col bg-slate-50/50">
                        <div className="p-5 border-b border-gray-100 bg-white/50">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">Branches</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="all_branches" 
                                    name="all_branches" 
                                    className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" 
                                    onChange={changeHandler} 
                                    checked={formState.all_branches} 
                                />
                                All Branches
                            </label>
                            <div className="space-y-2 pt-1">
                                {branches.map((branch, idx) => (
                                    <label key={idx} className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-700 cursor-pointer transition ml-1">
                                        <input 
                                            id="branches" 
                                            name="branches" 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-blue-500 border-gray-300 focus:ring-blue-500"
                                            value={branch.id} 
                                            onChange={changeHandler} 
                                            checked={formState.branches.includes(branch.id)} 
                                        /> 
                                        {branch.branch_name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area (Right Column) */}
                    <main className="lg:col-span-10 flex flex-col h-full overflow-hidden">
                        
                        {/* Document Information Stacked on top */}
                        <section className="p-6 border-b border-gray-100 bg-white">
                            <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
                                <h2 className="text-base font-semibold text-slate-800">Document Information</h2>
                                {/* <ServerTime /> */}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Change Price Date</label>
                                    <input type="date" id="change_price_date" name="change_price_date" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-gray-50" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.change_price_date} readOnly />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Effective Date</label>
                                    <input type="date" id="effective_date" name="effective_date" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.effective_date} min={today()} />
                                </div>

                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" id="urgent_price_change" name="urgent_price_change" className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500" onChange={changeHandler} value={formState.urgent_price_change} checked={formState.urgent_price_change} />
                                    <span className="text-sm font-bold text-red-600">Urgent Price Change</span>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                                    <div className="mt-1">
                                        <Select
                                            id="category_id"
                                            name="category_id"
                                            options={catOptions}
                                            placeholder="Select Category"
                                            isSearchable={true}
                                            isClearable
                                            onChange={changeHandler}
                                            value={catOptions.find(opt => opt.value === formState.category_id) || null}
                                            styles={{
                                                control: (provided) => ({
                                                    ...provided,
                                                    minHeight: "2.5rem",
                                                    borderColor: "#2ea2d1",
                                                    borderRadius: "0.5rem",
                                                    zIndex: 5,
                                                }),
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                menu: (provided) => ({
                                                    ...provided,
                                                    zIndex: 9999,
                                                }),
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="xl:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Remark</label>
                                    <textarea
                                        id="comment"
                                        name="comment"
                                        className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white"
                                        rows="1"
                                        style={{ borderColor: '#2ea2d1' }}
                                        onChange={changeHandler}
                                        value={formState.comment}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Branch Price</label>
                                    <div className="mt-1">
                                        <Select
                                            id="branch_price"
                                            name="branch_price"
                                            options={options}
                                            placeholder="Select Status"
                                            isSearchable={!formState.branch_price}
                                            menuIsOpen={formState.branch_price ? false : undefined}
                                            isClearable={!formState.branch_price}
                                            onChange={changeHandler}
                                            value={options.find(opt => opt.value === formState.branch_price) || null}
                                            styles={{
                                                control: (provided) => ({
                                                    ...provided,
                                                    minHeight: "2.5rem",
                                                    borderColor: "#2ea2d1",
                                                    borderRadius: "0.5rem",
                                                    zIndex: 5,
                                                }),
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                menu: (provided) => ({
                                                    ...provided,
                                                    zIndex: 9999,
                                                }),
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end gap-3 md:col-span-2">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Product Code</label>
                                        <input type="text" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={(e) => setProductCode(e.target.value)} value={productCode} />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition focus:ring-4 focus:ring-cyan-300 shadow-sm"
                                            onClick={searchHandler}
                                            disabled={searching}
                                        >
                                            {searching ? 'Loading...' : 'Search'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => document.getElementById("excel_import").click()}
                                            title="Excel Import"
                                            className="inline-flex items-center justify-center h-10 w-10 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                                            disabled={importing}
                                        >
                                            {importing ? <FaSpinner className="animate-spin" /> : <FaFileImport />}
                                        </button>

                                        <a
                                            href="/assets/documents/tp_products_sample_excel.xlsx"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-sky-100 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-200 transition"
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
                            </div>
                        </section>
                        
                        {/* Product Prices Stacked on Bottom */}
                        <div className="p-6 bg-white overflow-hidden flex flex-col flex-1">
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-slate-800">Product Prices</h2>
                            </div>
                            {/* <div className="overflow-auto max-h-[500px]"> */}
                                <ProductTable data={products} pricesHandler={pricesHandler} removeHandler={removeHandler} pricesErrors={pricesErrors} />
                            {/* </div> */}
                        </div>
                    </main>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm p-5 bg-neutral-50s border-t border-gray-50 leading-8">

                    {/* Prepared By */}
                    <div className="">
                        <div className="text-gray-600">
                        Prepared By
                        </div>

                        <div className="font-semibold text-blue-900">
                        {originator?.title}{originator?.name}
                        </div>

                        <div className="font-semibold text-blue-900">
                        ({originator?.departments?.name})
                        </div>

                        <div className="font-semibold text-blue-900">
                        {formatStrDateTime(formState?.created_at)}
                        </div>
                    </div>


                    {/* Audit By */}
                    <div className="">
                        <div className="text-gray-600">
                        Checked By
                        </div>

                        <div className="font-semibold text-blue-900">
                        {originator?.title}{originator?.name}
                        </div>

                        <div className="font-semibold text-blue-900">
                        ({originator?.departments?.name})
                        </div>

                        <div className="font-semibold text-blue-900">
                        {formatStrDateTime(formState?.created_at)}
                        </div>
                    </div>

                    {/* Approved By */}
                    <div className="">
                        <div className="text-gray-600">
                        Approved By
                        </div>

                        <div className="font-semibold text-blue-900">
                        {getApprover?.approval_users?.title}{getApprover?.approval_users?.name}
                        </div>

                        <div className="font-semibold text-blue-900">
                        ({getApprover?.approval_users?.department?.name})
                        </div>

                        <div className="font-semibold text-blue-900">
                        {formatStrDateTime(getApprover?.created_at)}
                        </div>
                    </div>
                </div>
            </div>

    
        </div>
        </>
    );

}
