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

import {validateForm} from "../../components/Validator.jsx";
import {showValidationErrors,validateArrayField} from "../../components/Validator.jsx";
import {formatDate,formatLaravelStyleDate,formatTo2Decimals} from "../../components/Fomatter.jsx";
import ServerTime,{fetchServerTime as SvrTime}  from "../../components/ServerTime";
import FullPageLoader from "../../components/FullPageLoader";
import * as XLSX from "xlsx";

import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";

import {fetchServerTime} from "./../../store/servertimeSlice";
import ColumnToggleDropdown from "../../components/ColumnToggleDropdown.jsx";


export default function () {
    const { user, token } = useSelector((state) => state.auth);
    // console.log(user.categories);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {loading,error, datas: serverTimeData} = useSelector((state)=>state.servertime)

    const productslimit = 50;
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
        category_id: user.categories?.[0]?.id,
        comment: "",
        branch_price: "",
        all_branches: false,
        branches: [],

        form_id: 21,
        layout_id: 19,
        route: "price_changes"
    });
    const [products,setProducts] = useState([]);
    const [productsLock, setProductsLock] = useState(false);

    // const token = localStorage.getItem('token');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searching,setSearching] = useState(false);
    const [importing,setImporting] = useState(false);
    const [forceLoading, setForceLoading] = useState(false);
    
 
    const changeHandler = (e,actionMeta) => {
         // react-select
        // console.log(e,action);
        if (!e?.target) {
            const name = actionMeta?.name;
            setFormState(prev => ({
            ...prev,
            [name]: e ? e.value : null,
            }));

            if(name == 'branch_price'){
                setProducts([]);
            }

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
                updated.urgent_price_change = (updated.change_price_date == updated.effective_date);
            }
            return updated;
        });
        console.log(formState)
    };
    const [pricesErrors,setPricesErrors] = useState({});
    const pricesHandler = (e, product_code) => {
        const { name, value } = e.target;

        setProducts(prev =>
            prev.map(item => {
                if (item.product_code !== product_code) return item;

                let updatedItem = {
                    ...item,
                    [name]: value,
                };

                if (name === "new_cost_price") {
                    // Start Prevent User Typing Error
                    const code = updatedItem.product_code;
                    const pricesAlerts = validateArrayField([updatedItem], {'new_cost_price': {min: 0,max: "price1"}}, 'Product',{});
                    // console.log(pricesAlerts,pricesAlerts?.[code]?.['new_cost_price']);

                    if(pricesAlerts?.[code]?.['new_cost_price']){
                        // updatedItem.new_cost_price = '';
                        updatedItem.new_cost_price = item.new_cost_price;
                        return updatedItem;
                    }
                    // End Prevent User Typing Error

                    const price1 = Number(item.price1);
                    const newCost = Number(value);

                    const profit = calculateProfit(newCost,price1);

                    updatedItem.profit = profit;

                    // const productMessages = {
                    //     new_cost_price: {
                    //         required: "New Cost Price is required.",
                    //         numeric: "New Cost Price must be numeric value."
                    //     }
                    // }
                    // const pricesAlerts = validateArrayField([updatedItem], {'new_cost_price': {required:true,numeric: true, min: 1}}, 'Product',productMessages);
                    // setPricesErrors(prev => {
                    //     const code = updatedItem.product_code;
                    //     const newFields = pricesAlerts[code] || {};

                    //     const merged = {
                    //         ...prev[code],
                    //         ...newFields
                    //     };

                    //     if (!newFields[name]) {
                    //         delete merged[name];
                    //     }

                    //     return {
                    //         ...prev,
                    //         [code]: merged
                    //     };
                    // });
                    // console.log(pricesAlerts);

                 
                }

                if (name === "price1") {
                    // Start Prevent User Typing Error
                    const code = updatedItem.product_code;
                    const price1Alerts = validateArrayField([updatedItem], {'price1': {max: 99999999}}, 'Product',{});
                    // console.log(pricesAlerts,pricesAlerts?.[code]?.['new_cost_price']);

                    if(price1Alerts?.[code]?.['price1']){
                        updatedItem.price1 = item.price1;
                        return updatedItem;
                    }
                    // End Prevent User Typing Error

                    const price1 = Number(value);
                    const newCost = Number(item.new_cost_price) || 0;

                    const profit = calculateProfit(newCost,price1);

                    updatedItem.profit = profit;

                    // Show/Hide Red Box
                    const productMessages = {
                        price1: {
                            required: "Price 1 is required.",
                            numeric: "Price 1 must be numeric value.",
                        },
                    }
                    const pricesAlerts = validateArrayField(
                        [updatedItem]
                        ,{
                            'price1': {required:true,numeric: true, min: 1},
                            'price2': {required:true,numeric: true, min: 1, max:"price1"},
                            'new_cost_price': {min: 0,max: "price1"}
                        }
                        , 'Product'
                        ,productMessages
                    );

                    setPricesErrors(prev => {
                        const code = updatedItem.product_code;
                        const newFields = pricesAlerts[code] || {};

                        const merged = {
                            ...prev[code],
                            ...newFields
                        };

                        if (!newFields[name]) {
                            delete merged[name];

                            if(!pricesAlerts[code]?.price2){
                                delete merged['price2'];
                                delete merged['new_cost_price'];
                            }
                        }
                        // if (!newFields['price2']) {
                        //     delete merged['price2'];
                        // }

                        return {
                            ...prev,
                            [code]: merged
                        };
                    });
                    console.log(pricesAlerts);


                }

                if(name === "price2"){
                    // Start Prevent User Typing Error
                    const code = updatedItem.product_code;
                    const price2Alerts = validateArrayField([updatedItem], {'price2': {max: 99999999}}, 'Product',{});
                    // console.log(pricesAlerts,pricesAlerts?.[code]?.['new_cost_price']);

                    if(price2Alerts?.[code]?.['price2']){
                        updatedItem.price2 = item.price2;
                        return updatedItem;
                    }
                    // End Prevent User Typing Error

                    // Show/Hide Red Box
                    const productMessages = {
                        price2: {
                            required: "Price 2 is required.",
                            numeric: "Price 2 must be numeric value."
                        },
                    }


                    const pricesAlerts = validateArrayField([updatedItem], {'price2': {required:true,numeric: true, min: 1, max:"price1"}}, 'Product',productMessages);
                    setPricesErrors(prev => {
                        const code = updatedItem.product_code;
                        const newFields = pricesAlerts[code] || {};

                        const merged = {
                            ...prev[code],
                            ...newFields
                        };

                        if (!newFields[name]) {
                            delete merged[name];
                        }

                        return {
                            ...prev,
                            [code]: merged
                        };
                    });
                    console.log(pricesAlerts);
                }


                return updatedItem;
            })
        );
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
            const apiProduct = data.data;
            // console.log(row["New Cost Price"] || formatTo2Decimals(apiProduct.new_cost_price)  || 0);

            const new_cost_price = row["New Cost Price"] || apiProduct.new_cost_price || '';
            const price1 = apiProduct.price1 || row["Price 1"] || formatTo2Decimals(apiProduct.price) || '';
            const result = {
                ...apiProduct,
                product_code: apiProduct.barcode,
                price1: apiProduct.price1 || row["Price 1"] || formatTo2Decimals(apiProduct.price) || '',
                price2: row["Price 2"] || formatTo2Decimals(apiProduct.price2) || formatTo2Decimals(apiProduct.price) || '',
                new_cost_price: row["New Cost Price"] || formatTo2Decimals(apiProduct.new_cost_price || 0)  || '',
                profit: calculateProfit(new_cost_price,price1),
                remark: 0,
                id: apiProduct.barcode,
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

    const calculateProfit = (new_cost_price = 0, price1 = 0)=>{
        const profit = price1 > 0
                            ? ((price1 - new_cost_price) / price1)
                            : 0;
        return profit;
    }

    const removeHandler = (e,product_code)=>{
        e.preventDefault();
        // console.log(product_code);

        setProducts((prev)=>
            prev.filter(item =>item.product_code != product_code)
        )
    }

    let submitingRef = useRef(false);
    let confirmSubmitedRef = useRef(false);
    const submitHandler = async (e,btntype)=>{
        if (submitingRef.current) return;

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
            price2: { required: true, numeric: true, min: 1, max:"price1"},
            new_cost_price: {min: 0, max: "price1"}, // { required: true, numeric: true, min: 1},
            profit: { required: true, numeric: true},
        };
        const productMessages = {
            price1: {
                required: "Price 1 is required.",
                numeric: "Price 1 must be numeric value."
            },
            price2: {
                required: "Price 2 is required.",
                numeric: "Price 2 must be numeric value."
            },
            new_cost_price: {
                required: "New Cost Price is required.",
                numeric: "New Cost Price must be numeric value."
            },
            profit: {
                required: "Profit is required.",
            }
        }

        // => Adding Id property
        formData.products.forEach((row, i) => {
            row.id = row['product_code'] || row['Product Code'];
        });

        const productErrors = validateArrayField(formData.products, productSchema, 'Product',productMessages);
        setPricesErrors(productErrors);
        
            // Flatten nested error messages
            const allMessages = Object.values(productErrors)
                .flatMap(fields => Object.values(fields));

            const messagesSet = Array.from(new Set(allMessages))
                .map((msg, idx) => [`error_${idx}`, msg]);

            const displayErrors = Object.fromEntries(messagesSet);
            // console.log(productErrors,allMessages,messagesSet,displayErrors);
            if (showValidationErrors(displayErrors, 'Product Validation Error')) return;
        // End Validate Prices


        Swal.fire({
                icon: "question",
                text:  `Are you sure you want to save Price Change Form?`,
                showCancelButton: true,
                confirmButtonText: "OK",
                cancelButtonText: "Cancel",
        }).then(async (result) => {
                if (result.isConfirmed && !confirmSubmitedRef.current) {
                    confirmSubmitedRef.current = true;
                    submitingRef.current = true;

                    setForceLoading(true);
                    setIsSubmitting(true);
                    try{
                        const res = await axios.post(`/api/price_changes`,formData,{
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
                        }

                        Swal.fire({
                            icon: "success",
                            title: "Form submitted successfully!",
                            text: data.message,
                        });
                        navigate("/price_changes");

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

                        confirmSubmitedRef.current = false;
                        submitingRef.current = false;
                    }
                }
        });
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
                'Price 2': {required:true,numeric: true, min: 1},
                // 'New Cost Price': {required:true,numeric: true, min: 1},
                // 'New Cost Price': {min: 0, max: "Price 1"},
            }
            const importMessage = {
                'Product Code': {required: "Product Code is required."},
                'Price 1': {required: "Price 1 is required.", numeric: "Price 1 must be numeric value."},
                'Price 2': {required: "Price 2 is required.", numeric: "Price 2 must be numeric value."},
                'New Cost Price': {required: "New Cost Price is required.", numeric: "New Cost Price must be numeric value."},
            }

            const importErrors = validateArrayField(jsonData, importSchema, 'Product',importMessage);
            console.log(importErrors);
            
                // Flatten nested error messages
                const allMessages = Object.values(importErrors)
                    .flatMap(fields => Object.values(fields));

                const messagesSet = Array.from(new Set(allMessages))
                    .map((msg, idx) => [`error_${idx}`, msg]);

                const displayErrors = Object.fromEntries(messagesSet);
                // console.log(importErrors,allMessages,messagesSet,displayErrors);
            

                if (showValidationErrors(displayErrors, 'Excel Validation Error')) return;

            // => Adding Id property
            jsonData.forEach((row, i) => {
                row.id = row['product_code'] || row['Product Code'];
            });

            const pricesAlerts = validateArrayField(jsonData, {'Price 2': {required:true,numeric: true, min: 1, max:"Price 1"},'New Cost Price': {min: 0, max: "Price 1"}}, 'Product',importMessage);
            setPricesErrors(pricesAlerts);

            // const existingCodes = new Set(products.map(p => String(p.product_code).trim()));
            setProducts([]);
            let existingCodes = [];
            existingCodes = new Set(existingCodes.map(p => String(p.product_code).trim()));

            for (const [index, row] of jsonData.entries()) {
                const code = String(row['Product Code']).trim();
                console.log("Row", index + 1, row);
                
                // Duplicate Product Code
                if (existingCodes.has(code)) continue;
                // console.log("Added",existingCodes,code);

                // Exceed Product Rows
                // console.log(productsExceedLimit(productslimit));
                if (existingCodes.size >= productslimit) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Product Rows Exceed Limit',
                        text: `User can\'t add products more than  ${productslimit} rows.`,
                    });
                    break;
                }

                existingCodes.add(code);
                try {
                    await fetchProduct(code,row);
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
    const excludeBranchIds = [1,16,18,19,21,22,15];
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


    const downloadHandler = async () => {
        const response = await axios.get(
            '/api/price_changes/sample_download',
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                responseType: 'blob',
            }
        );

        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'price_change_sample.xlsx'; // file name
        a.click();

        window.URL.revokeObjectURL(url);
    };


    useEffect(() => {
        const init = async () => {
            fetchBranches();
            fetchProductCategories();

            let getServerTime= await dispatch(fetchServerTime()).unwrap();
            // console.log(getServerTime);

            setFormState(prev => ({
                ...prev,
                change_price_date: formatLaravelStyleDate(getServerTime.time),
                effective_date: formatLaravelStyleDate(getServerTime.time),
            }));
        };
        init();
    }, []);

    const productsExceedLimit = (limit)=>{
        return products.length >= limit
    }

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
                            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                Price Change Form
                            </h3>

                            <div className="flex flex-wrap gap-2 sm:justify-end">
                                <Link
                                    to="/price_changes"
                                    className="inline-flex px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 items-center text-sm sm:text-base"
                                >
                                    <span className="mr-1 sm:mr-2">←</span> Back
                                </Link>

                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition shadow-sm"
                                    onClick={(e) => submitHandler(e, 1)}
                                >
                                    Save as Draft
                                </button>

                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                                    onClick={(e) => submitHandler(e, 2)}
                                >
                                    Save
                                </button>

                               
                            </div>
                        </div>
                    </header>

                    {/* Card Body Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                        
                        {/* Branch Sidebar (Left Column) */}
                        <aside className="lg:col-span-2 border-r border-gray-100 flex flex-col bg-slate-50/50">
                            <div className="p-5 border-b border-gray-100 bg-white/50">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">Branches <span className="text-red-600 text-md">*</span></h2>
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
                                    <ServerTime />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Change Price Date <span className="text-red-600 text-md">*</span></label>
                                        {/* <input type="date" id="change_price_date" name="change_price_date" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-gray-50" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.change_price_date} readOnly /> */}
                                        <Flatpickr
                                            value={formState.change_price_date}
                                            options={{
                                                dateFormat: "Y-m-d",
                                                minDate:  formatLaravelStyleDate(serverTimeData.time),
                                            }}
                                            onChange={(date, dateStr) => {
                                                changeHandler({
                                                target: {
                                                    name: "change_price_date",
                                                    value: dateStr,
                                                    type: "date"
                                                }
                                                });
                                            }}
                                            className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white"
                                            inputClass="border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white"
                                            style={{ borderColor: '#2ea2d1' }}
                                            disabled={true}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase"><span className="text-red-600">Effective Date</span> <span className="text-red-600 text-md">*</span></label>
                                        {/* <input type="date" id="effective_date" name="effective_date" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.effective_date} min={today()} /> */}
                                        <Flatpickr
                                            value={formState.effective_date}
                                            options={{
                                                dateFormat: "Y-m-d",
                                                minDate:  formatLaravelStyleDate(serverTimeData.time),
                                            }}
                                            onChange={(date, dateStr) => {
                                                changeHandler({
                                                target: {
                                                    name: "effective_date",
                                                    value: dateStr,
                                                    type: "date"
                                                }
                                                });
                                            }}
                                            className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white"
                                            inputClass="border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white"
                                            style={{ borderColor: '#2ea2d1' }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-6">
                                        <input type="checkbox" id="urgent_price_change" name="urgent_price_change" className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500" onChange={changeHandler} value={formState.urgent_price_change} checked={formState.effective_date == today()} />
                                        <span className="text-sm font-bold text-red-600">Urgent Price Change <span className="text-red-600 text-md">*</span></span>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Department <span className="text-red-600 text-md">*</span></label>
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
                                        <label className="text-xs font-bold text-slate-500 uppercase">Branch Price <span className="text-red-600 text-md">*</span></label>
                                        <div className="mt-1">
                                            <Select
                                                id="branch_price"
                                                name="branch_price"
                                                options={options}
                                                placeholder="Select Status"
                                                isSearchable={!formState.branch_price || true}
                                                // menuIsOpen={formState.branch_price ? false : undefined}
                                                isClearable={!formState.branch_price || true}
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

                                    <div className="flex flex-col md:flex-row md:items-end gap-3 md:col-span-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Product Code</label>
                                            <input type="text" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={(e) => setProductCode(e.target.value)} value={productCode} />
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
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
                                                className="inline-flex items-center justify-center h-10 w-full md:w-10 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                                                disabled={importing}
                                            >
                                                {importing ? <FaSpinner className="animate-spin" /> : <FaFileImport />}
                                            </button>


                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-sky-100 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-200 transition"
                                                onClick={downloadHandler}
                                            >
                                                Sample
                                            </button>

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
                                <div className="flex justify-between mb-4">
                                    <h2 className="text-base font-semibold text-slate-800">Product Prices <span className="text-red-600 text-md">*</span> <span className="text-sm">Total <strong className="text-sky-600">{products.length}</strong> product{products.length > 1 && 's'}.</span></h2>
                                    
                                    <div className="flex gap-4">

                                        <button
                                        onClick={() => setProductsLock(!productsLock)}
                                        className={`flex items-center justify-center p-2 rounded-md border transition bg-amber-500 text-white border-yellow-400`}
                                        title={productsLock ? "Edit Mode" : "View Mode"}
                                        >
                                        {productsLock ? <FaPen /> : <FaEye />}
                                        </button>

                                        {/* <ColumnToggleDropdown /> */}

                                    </div>

                                </div>
                                {/* <div className="overflow-auto max-h-[500px]"> */}
                                    <ProductTable data={products} pricesHandler={pricesHandler} removeHandler={removeHandler} pricesErrors={pricesErrors} authorizedEdit={!productsLock}/>
                                {/* </div> */}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );

}



// npm install react-flatpickr flatpickr