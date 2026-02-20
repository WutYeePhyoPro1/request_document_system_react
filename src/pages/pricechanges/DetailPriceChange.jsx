import React, { useEffect, useState,useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate,useParams,Link } from "react-router-dom";
import NavPath from "../../components/NavPath";
import ProductTable from "../../components/ProductTable"
import { FaFileImport,FaSpinner,FaInfoCircle } from "react-icons/fa";
import { BsCartCheck } from "react-icons/bs";
import { FiCopy } from 'react-icons/fi';

// import $ from "jquery";
import Select from 'react-select'
import axios from "axios";
import Swal from "sweetalert2";

import {validateForm} from "../../components/Validator.jsx";
import {showValidationErrors,validateArrayField} from "../../components/Validator.jsx";
import {formatDate,formatStrDateTime,formatTo2Decimals} from "../../components/Fomatter.jsx";
import ServerTime from "../../components/ServerTime";
import FullPageLoader from "../../components/FullPageLoader";
import * as XLSX from "xlsx";
import { m } from "framer-motion";

import StatusBadge from '../../components/ui/StatusBadge';


export default function () {
    const productslimit = 50;
    // const token = localStorage.getItem('token');
    const { user, token } = useSelector((state) => state.auth);

    const navigate = useNavigate();
    const { id } = useParams();
    

    const today = () => new Date().toISOString().split("T")[0];
    const minDate = today();
    const maxDate = new Date();
    // maxDate.setFullYear(today.getFullYear() + 5);
    maxDate.setMonth(new Date().getMonth() + 1);

    const [branches, setBranches] = useState([]);
    const [branchCount, setBranchCount] = useState(0);
    const branchCountRef = useRef(0);
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
    const [transfering,setTransfering] = useState(false);

    const [originator,setOriginator] = useState(null);
    const [getApprover,setGetApprover] = useState(null);
    const [getSupervisor,setGetSupervisor] = useState(null);
    const [formRejected,setFormRejected] = useState(null);

    const [generalFormFiles,setGeneralFormFiles] = useState([]);

    const [showModal, setShowModal] = useState(false);

    const [approver,setApprover] = useState(null);
    const [supervisor,setSupervisor] = useState(null);

    // const allBranchUpdated = formState?.price_change_branches.every(
    //     branch => branch.status === "Updated"
    // );
    const allBranchUpdated = formState?.price_change_branches?.every(
    branch => branch.status === "Updated"
    );
    // const allBranchUpdated = true;
    const  forwardable = (formState.status == 'Default' && originator.id == user.id)
    const  changable = ((supervisor || approver) && formState?.status != 'Partial') || forwardable;
    const runable = ((formState.status == "Approved" || formState.status == "Partial") && getApprover?.approval_users?.id == user.id);
    const onlineActionable = ((formState.status == "Completed") && getApprover?.approval_users?.id == user.id) 
                                && allBranchUpdated 
                                && generalFormFiles.filter(gf=>gf.name.includes("Update Online Price")).length <= 0;
    const trackable = getApprover?.approval_users?.id == user.id;
    const transferable = (formState.status == "Completed") && generalFormFiles.filter(gf=>gf.name.includes("Update Online Price")).length > 0

    // (supervisor || approver) && formState?.status != 'Partial';
    const [copied, setCopied] = useState(false);
    const updateDoc = useRef(false);
 
    const changeHandler = (e,actionMeta) => {
        if(!changable) return;

        updateDoc.current = true;

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
        console.log(formState);

    };
    const [pricesErrors,setPricesErrors] = useState({});
    const pricesHandler = (e, product_code) => {
        if(!changable) return;

        updateDoc.current = true;
        
        const { name, value } = e.target;

        setProducts(prev =>
            prev.map(item => {
                if (item.product_code !== product_code) return item;

                let updatedItem = {
                    ...item,
                    [name]: value,
                };

                if (name === "new_cost_price") {
                    const price1 = Number(item.price1);
                    const newCost = Number(value);

                    const profit = calculateProfit(newCost,price1);

                    updatedItem.profit = profit;

                    const productMessages = {
                        new_cost_price: {
                            required: "New Cost Price is required.",
                            numeric: "New Cost Price must be numeric value."
                        }
                    }
                    const pricesAlerts = validateArrayField([updatedItem], {'new_cost_price': {required:true,numeric: true, min: 1}}, 'Product',productMessages);
                    setPricesErrors(prev => ({
                        ...prev,
                        ...pricesAlerts
                    }));
                    console.log(pricesAlerts);
                }

                if (name === "price1") {
                    const price1 = Number(value);
                    const newCost = Number(item.new_cost_price) || 0;

                    const profit = calculateProfit(newCost,price1);

                    updatedItem.profit = profit;

                    // Show/Hide Red Box
                    const productMessages = {
                        price1: {
                            required: "Price 1 is required.",
                            numeric: "Price 1 must be numeric value."
                        },
                    }
                    const pricesAlerts = validateArrayField(
                        [updatedItem]
                        ,{
                            'price1': {required:true,numeric: true, min: 1},
                            'price2': {required:true,numeric: true, min: 1, max:"price1"}
                        }
                        , 'Product'
                        ,productMessages
                    );

                    setPricesErrors(prev => ({
                        ...prev,
                        ...pricesAlerts
                    }));
                    console.log(pricesAlerts);
                }

                if(name === "price2"){

                    // Show/Hide Red Box
                    const productMessages = {
                        price2: {
                            required: "Price 2 is required.",
                            numeric: "Price 2 must be numeric value."
                        },
                    }


                    const pricesAlerts = validateArrayField([updatedItem], {'price2': {required:true,numeric: true, min: 1, max:"price1"}}, 'Product',productMessages);
                    setPricesErrors(prev => ({
                        ...prev,
                        ...pricesAlerts
                    }));
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
            if(!changable) return;

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

            const new_cost_price = apiProduct.new_cost_price || row["New Cost Price"] || '';
            const price1 = apiProduct.price1 || row["Price 1"] || '';
            const result = {
                ...apiProduct,
                product_code: apiProduct.barcode,
                price1: apiProduct.price1 || row["Price 1"] || formatTo2Decimals(apiProduct.price) || '',
                price2: apiProduct.price2 || row["Price 2"] || formatTo2Decimals(apiProduct.price) || '',
                new_cost_price: apiProduct.new_cost_price || row["New Cost Price"] || '',
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
        if(!changable) return;

        e.preventDefault();
        // console.log(product_code);

        setProducts((prev)=>
            prev.filter(item =>item.product_code != product_code)
        )
    }

    const submitHandler = async (e,btntype)=>{
        // e.preventDefault();
        if(!changable) return;
    
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
        if (showValidationErrors(errors)) return false;



        // Start Validate Prices
        const productSchema = {
            price1: { required: true, numeric: true, min: 1},
            price2: { required: true, numeric: true, min: 1, max:"price1"},
            new_cost_price: { required: true, numeric: true, min: 1},
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
                return false;
            }

            // await Swal.fire({
            //     icon: "success",
            //     title: "Form submitted successfully!",
            //     text: data.message,
            // });
            console.log("Form submitted successfully!")
            fetchPriceChange(); 
            return true;
            // navigate(0);
            // navigate("/price_changes");

        }catch(err){
            console.log('There is an error in saving price change document:',err);
            // setLoader(false);

            Swal.fire({
                icon: "error",
                title: "Form Submit Error!!",
                text: "Something went wrong while submitting the form.",
            });

            return false;
        }finally{
            setForceLoading(false);
            setIsSubmitting(false);
        }
    }
    const excelImportHandler = async (e) => {
        if(!changable) return;
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
                'New Cost Price': {required:true,numeric: true, min: 1},
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
    const excludeBranchIds = [1,18,19,21,22,15];
    const fetchBranches = useCallback(async () => {
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
            console.log(list.length);
            
            setBranchCount(list.length);
            branchCountRef.current = list.length; 
        } catch (error) {
            console.error('Fetch branches error:', error);
            setBranches([]);
        }
    },[])
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
                branches:  price_change_branches.sort((a,b)=>a.branch.branch_code > b.branch.branch_code ? 1 : -1).map(brch=>brch.branch_id),
                urgent_price_change: general_form.asset_type == 'on',
                category_id: general_form.to_department,
                comment: general_form.remark,
                branch_price: general_form.to_branch,
                all_branches: price_change_branches.length == branchCountRef.current,

                form_id: 21,
                layout_id: 19,
                route: "price_changes",

                price_change_branches: price_change_branches.sort((a,b)=>a.branch.branch_code > b.branch.branch_code ? 1 : -1)
            }
            // console.log(price_change_branches.length, branchCountRef.current);

            setFormState(normalizedForm);
            
            setOriginator(data.stakeholders.originator);
            setGetSupervisor(data.stakeholders.getSupervisor);
            setGetApprover(data.stakeholders.getApprover);
            setFormRejected(data.stakeholders.form_rejected);

            setGeneralFormFiles(data.general_form_files);

            setSupervisor(data.authorities.supervisor);
            setApprover(data.authorities.approver);

            return normalizedForm;
        } catch(error){
            console.error('Fetch branches error:', error);
        }

    }


    const productsExceedLimit = (limit)=>{
        return products.length >= limit
    }


    
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

    let approvingRef = useRef(false);
    let confirmApprovedRef = useRef(false);
    const approveHandler = async (e)=>{
        
        if (approvingRef.current) return;


        var btnStatus = e.target.value;
        var btnText = e.target.textContent;

        Swal.fire({
            icon: "question",
            text:  `Are you sure you want to ${btnText}?`,
            showCancelButton: true,
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
        }).then(async (result) => {
            if (result.isConfirmed && !confirmApprovedRef.current) {
                confirmApprovedRef.current = true;
                approvingRef.current = true;


                // Start Update & Approve
                // console.log(updateDoc.current);
                if(updateDoc.current){
                    const submitSuccess = await submitHandler();
                    if (!submitSuccess) {
                        console.log("Submit failed");
                        return;
                    }
                    console.log('Success Submit.')
                }
                // End Update & Approve


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

                    if(btnStatus == 'Approved'){
                        console.log(`Form ${btnText} successfully!`);
                    }else{
                        Swal.fire({
                            icon: "success",
                            title: `Form ${btnText} successfully!`,
                            text: data.message,
                            // text: "hay"
                        });
                    }

                    const updatedForm = await fetchPriceChange();
                    // navigate(0);
                    // navigate("/price_changes");

                    if(btnStatus == 'Approved'){
                        runHandler(false,updatedForm);
                    }

                }catch(err){
                    console.log('There is an error in approving price change document:',err);
                    // setLoader(false);

                    Swal.fire({
                        icon: "error",
                        title: "Form Approve Error!!",
                        text: "Something went wrong while submitting the form.",
                    });
                }finally{
                    setForceLoading(false);
                    setIsSubmitting(false);

                    confirmApprovedRef.current = false;
                    approvingRef.current = false;
                }
            }
        });
    };

    const updateBranchStatus = (branchId, status, message = null) => {
        setFormState(prev => ({
            ...prev,
            price_change_branches: prev.price_change_branches.map(branch =>
                branch.branch_id === branchId
                    ? { ...branch, status, message }
                    : branch
            )
        }));
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    let runningRef = useRef(false);
    let confirmRunRef = useRef(false);
    const runHandler = async (retry = false, latestForm = null) => {
        const data = latestForm || formState;

        if(retry){
            if (runningRef.current) return;
            const result = await Swal.fire({
                icon: "question",
                text: "Are you sure you want to run the latest updated prices on POS & ERP servers?",
                showCancelButton: true,
                confirmButtonText: "OK",
                cancelButtonText: "Cancel",
            });

            if (!result.isConfirmed) return;

            if (result.isConfirmed && !confirmRunRef.current) {
                confirmRunRef.current = true;
                runningRef.current = true;

            }
        }
        // console.log("Run Success");
        // return;

        setForceLoading(true);
        setIsSubmitting(true);
        setShowModal(true);
        try {
            
            // console.log(formState.price_change_branches);
            const runBranches = data.price_change_branches.filter(pcbranch=>pcbranch.status != 'Updated').sort((a,b)=>a.branch.branch_code > b.branch.branch_code ? 1 : -1).map(brch=>brch.branch_id)
            // console.log(runBranches);
            const updateRequests = runBranches.map(branchId => {

                updateBranchStatus(branchId, "Updating");

                return axios
                    .get(`/api/price_changes/${id}/${branchId}/update_price`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    .then(async (res) => {
                        if (res.data?.success === false) {
                            // updateBranchStatus(branchId, "failed", res.data.message);
                            // throw new Error(`Branch ${branchId} failed`);
                            throw new Error(res?.data?.message);
                        }

                        await sleep(2000);
                        updateBranchStatus(branchId, res.data.status ,res.data.message);
                        return res;
                    })
                    .catch(err => {
                        updateBranchStatus(
                            branchId,
                            "Failed",
                            err.response?.data?.message || err.message
                        );
                        throw err;
                    });
                });

            const results = await Promise.all(updateRequests);



            Swal.fire({
                icon: "success",
                title: "POS and ERP Prices Updated",
                text: "All branches are now live with the updated pricing.",
            });

            // fetchPriceChange();
            // navigate("/price_changes");

        } catch (err) {
            console.error(err,err.message);

            // Swal.fire({
            //     icon: "error",
            //     title: "Prices Run Error",
            //     text: err.message || "Some branches failed to update.",
            // });
        } finally {
            setForceLoading(false);
            setIsSubmitting(false);
            // setShowModal(false);

            fetchPriceChange();

            confirmRunRef.current = false;
            runningRef.current = false;
        }
    };

    let updatingRef = useRef(false);
    let confirmUpdateRef = useRef(false);
    const onlineHandler = async (e)=>{
        if (updatingRef.current) return;


        var btnText = e.target.textContent;

            Swal.fire({
                icon: "question",
                text:  `Are you sure you want to ${btnText}?`,
                showCancelButton: true,
                confirmButtonText: "OK",
                cancelButtonText: "Cancel",
            }).then(async (result) => {

                if (result.isConfirmed && !confirmUpdateRef.current) {
                    confirmUpdateRef.current = true;
                    updatingRef.current = true;

                    // console.log("Online:");

                    setForceLoading(true);
                    setIsSubmitting(true);

                    const branchCodeList = formState.price_change_branches.sort((a,b)=>a.branch.branch_code > b.branch.branch_code ? 1 : -1).map(brch=>brch.branch.branch_code);
                    const productList = products.map(product => ({
                        productCode: product.product_code,
                        itemCode: product.product_code,
                        normalPrice: parseFloat(product.price1),
                        memberPrice: parseFloat(product.price2),
                        effectiveDate: formState.effective_date
                    }));
                    const timestamp = Date.now().toString();
                    // const timestamp = (Date.now() + 2 * 60 * 1000).toString();
                    console.log(timestamp);

                    const formData = {
                        data:{
                            branchCodeList,
                            productList,
                            timestamp
                        }
                    }
                    console.log(formData);
                    try{
                        const res = await axios.post(`/api/price_changes/${id}/update_online`,formData,{
                            headers: {
                            Authorization: `Bearer ${token}`,
                            },
                        });

                        console.log(res);

                        const data = res.data;

                        if(data.success == false){
                            return;
                        }

                        // const updatedForm = await fetchPriceChange();
                        // Swal.fire({
                        //     icon: "success",
                        //     title: `Update online successfully!`,
                        //     text: data.message,
                        // });

                        transferGCPHandler();

                    }catch(err){
                        console.log('There is an error in updating onlilne:',err);

                        Swal.fire({
                            icon: "error",
                            title: "Update Online Error",
                            text: "Something went wrong while updating online.",
                        });

                    }finally{
                        setForceLoading(false);
                        setIsSubmitting(false);

                        fetchPriceChange();

                        confirmUpdateRef.current = false;
                        updatingRef.current = false;
                    }
                }
            });
    }

    const transferGCPHandler = async ()=>{
        setTransfering(true);
        try{
            // //  =Update Online File & Timestamp
            // //  Start GCP Document API
            const gcpRes = await axios.get(
                `/api/price_changes/${id}/gcp_document`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (gcpRes.data?.success === false) {
                throw new Error("GCP document creation failed");
            }


            Swal.fire({
                icon: "success",
                title: "Price Change Form Process Finished Successfully!",
                text: "Online Update and GCP document created successfully.",
            });
            // // End GCP Document API
        }catch(err){
            Swal.fire({
                icon: "error",
                title: "GCP Document Error!!",
                text: "Something went wrong while creating GCP Document.",
            });
        }finally {
            setTransfering(false);

            fetchPriceChange();
        }
    }

    const sendToSupervisorClick = async (e)=>{
        e.preventDefault();

         Swal.fire({
            icon: "question",
            text:  `Are you sure you want to send to your supervisor?`,
            showCancelButton: true,
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
        }).then(async (result) => {
            if (result.isConfirmed) {
                setForceLoading(true);
                setIsSubmitting(true);

                try{
                    const res = await axios.get(`/api/price_changes/${id}/send_to_supervisor`,{
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
                        title: "Form was sent to supervisor successfully!",
                        text: data.message,
                    });

                    navigate("/price_changes");

                }catch(err){
                    console.log('There is an error in sending price change document to supervisor:',err);
                    // setLoader(false);

                    Swal.fire({
                        icon: "error",
                        title: "Form Send Error!!",
                        text: "Something went wrong while sending the form.",
                    });
                }finally{
                    setForceLoading(false);
                    setIsSubmitting(false);
                }

            }
        });
    }


    useEffect(() => {
        const init = async () => {
            await fetchBranches();
            await fetchProductCategories();
            await fetchPriceChange();
        };

        init();
    }, []);

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
                                changable && forwardable &&
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition shadow-sm"
                                    onClick={(e) => sendToSupervisorClick(e)}
                                >
                                    Send To Supervisor
                                </button>

                            }
        
                            {/* {
                                changable ?
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                                    onClick={(e) => submitHandler(e) }
                                >
                                    Update
                                </button> : ''
                            } */}


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
                                (trackable) &&
                                <button
                                    className="px-4 py-2 text-sm rounded-lg
                                        bg-green-600 text-white
                                        hover:bg-green-700 transition"
                                    value="Approved"
                                    onClick={() => setShowModal(true)}
                                    >
                                    Apply Branch
                                </button>

                            }

                            {
                                (supervisor || approver) ?
                                <button
                                    className="px-4 py-2 text-sm rounded-lg
                                        bg-red-600 text-white
                                        hover:bg-red-700 transition"
                                    value="Cancel"
                                    onClick={approveHandler}
                                    >
                                    Cancel
                                </button> : ''
                            }

                            <Link
                                to="/price_changes"
                                className="inline-flex px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 items-center text-sm sm:text-base"
                            >
                                <span className="mr-1 sm:mr-2">←</span> Back
                            </Link>
                            
                        </div>
                    </div>
                </header>

                {/* Card Body Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    
                    {/* Branch Sidebar (Left Column) */}
                    <aside className="lg:col-span-2 border-r border-gray-100 flex flex-col bg-slate-50/50">
                        <div className="flex justify-between items-start p-5 border-b border-gray-100 bg-white/50 ">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 m-0" onClick={() => setShowModal(true)}>Branches</h2>
                            <span
                                onClick={() => setShowModal(true)}
                                className="cursor-pointer text-sky-500 text-lg hover:text-sky-600 flex"
                                role="button"
                                aria-label="Remove product"
                            ><FaInfoCircle className="text-sky-500" /></span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="all_branches" 
                                    name="all_branches" 
                                    className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" 
                                    onChange={(e) => changable && changeHandler(e)} 
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
                                            onChange={(e) => changable && changeHandler(e)} 
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
                            <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-2">
                                <h2 className="text-md font-semibold text-slate-800 uppercase">Document Information</h2>
                                {/* <ServerTime /> */}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-2">
                                <div className="col-span-1 md:col-span-2 xl:col-span-3">
                                    <div className="flex flex-col md:flex-row gap-4 mb-2">
                                        {generalFormFiles.filter(gf=>gf.name.includes("CP")).length > 0 &&
                                            <label className="text-base font-bold text-[#007bff] uppercases">GCP Document No:</label>
                                        }
                                        <div>
                                        {
                                            generalFormFiles.filter(gf=>gf.name.includes("CP")).map((generalFormFile,idx)=>(
                                                <label key={idx} className="text-base font-bold text-[#007bff] uppercase">{generalFormFile.name}</label>
                                            ))
                                        }
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Change Price Date</label>
                                    <input type="date" id="change_price_date" name="change_price_date" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-gray-50" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.change_price_date} readOnly />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Effective Date</label>
                                    <input type="date" id="effective_date" name="effective_date" className="mt-1 border focus:ring-2 focus:ring-blue-400 focus:outline-none p-2 w-full rounded-md bg-white" style={{ borderColor: '#2ea2d1' }} onChange={changeHandler} value={formState.effective_date} min={today()} readOnly={!changable}/>
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
                                            placeholder="Sele"
                                            isSearchable={changable}ct Category
                                            menuIsOpen={!changable ? false : undefined}
                                            isClearable={changable}
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
                                        readOnly={!changable}
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
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-slate-800">Product Prices</h2>
                            </div>
                            {/* <div className="overflow-auto max-h-[500px]"> */}
                                <ProductTable data={products} pricesHandler={pricesHandler} removeHandler={removeHandler} pricesErrors={pricesErrors} authorizedEdit={changable}/>
                            {/* </div> */}
                        </div>
                    </main>
                </div>

 


                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm p-5 bg-neutral-50s border-t border-gray-50 leading-8">

                    {/* Alert Box */}
                    {formRejected &&
                    <div className="flex items-cneter col-span-2 md:col-span-3">
                        <div className="relative w-full rounded-lg bg-red-100 border border-red-300 px-4 py-3 text-red-800">
                            <p>
                                This form was canceled by<span className="font-bold"> {formRejected?.approval_users?.title} {formRejected?.approval_users?.name}</span>
                            </p>

                            {/* Close button */}
                            <button
                                onClick={''}
                                className="absolute top-2 right-2 text-red-700 hover:text-red-900"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    }

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
                    <div className={`${!getSupervisor?.[0] ? 'opacity-25' : ''}`}>
                        <div className="text-gray-600">
                        Checked By Category Supervisor
                        </div>
                        {
                            getSupervisor?.length > 0 &&
                                getSupervisor.map((supervisor,idx)=>(
                                    <div key={idx}>
                                    <div className="font-semibold text-blue-900">
                                    {supervisor.approval_users?.title}{supervisor.approval_users?.name}
                                    </div>

                                    <div className="font-semibold text-blue-900">
                                    ({supervisor.approval_users?.department?.name})
                                    </div>

                                    <div className="font-semibold text-blue-900">
                                    {formatStrDateTime(supervisor?.created_at)}
                                    </div>
                                    </div>
                                ))
                        }
                    </div>

                    {/* Approved By */}
                    <div className={`${!getApprover?.approval_users || (Array.isArray(getApprover?.approval_users) && !getApprover?.approval_users?.[0]) ? 'opacity-25' : ''}`}>
                        <div className="text-gray-600">
                        Approved By Merchandising Manager
                        </div>
                        {
                            getApprover !== null && getApprover.approval_users && !(Array.isArray(getApprover?.approval_users) && getApprover.approval_users.length === 0) &&
                            <>
                            <div className="font-semibold text-blue-900">
                            {getApprover?.approval_users?.title}{getApprover?.approval_users?.name}
                            </div>

                            <div className="font-semibold text-blue-900">
                            ({getApprover?.approval_users?.department?.name})
                            </div>

                            <div className="font-semibold text-blue-900">
                            {formatStrDateTime(getApprover?.created_at)}
                            </div>
                            </>
                        }
                    </div>


                   
                </div>
            </div>

    
        </div>
        {showModal && formState.price_change_branches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            
            <div className="bg-white rounded-xl shadow-xl w-full lg:max-w-1/2 mx-4 overflow-hidden">

            {/* Header */}
            <div className="border-b bg-slate-50 border-gray-200">
                <div className="flex items-center justify-between px-6 py-4 ">
                    <h2 className="text-lg font-semibold">
                    Branch Price Update Status
                    </h2>
                    <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    >
                    ✕
                    </button>
                </div>
                <ul className="p-0.5">
                    {
                        (runable || onlineActionable || transferable) &&
                        <li  className="flex items-center justify-start p-2 rounded-lg bg-white border border-gray-200 gap-2">
                            {
                                runable &&
                                <button
                                    className="px-4 py-2 text-sm rounded-lg
                                        bg-sky-600 text-white
                                        hover:bg-sky-700 active:bg-sky-800
                                        transition shadow-sm"
                                    onClick={()=>runHandler(true)}
                                >
                                    Run
                                </button>
                            }


                            {
                                onlineActionable &&
                                <button
                                    className="px-4 py-2 text-sm font-medium rounded-lg
                                        bg-blue-600 text-white 
                                        hover:bg-blue-700 transition shadow-sm"
                                    onClick={onlineHandler}
                                >
                                    Update Price Online
                                </button>
                            }

                            {
                                // transferGCPHandler
                                transferable &&
                                <button
                                    className="px-4 py-2 text-sm font-medium rounded-lg
                                        bg-blue-600 text-white 
                                        hover:bg-blue-700 transition shadow-sm"
                                    onClick={transferGCPHandler}
                                    disabled={transfering}
                                >
                                    {transfering ? 'Loading...' : 'Transfer To GCP'}
                                </button>
                            }
                        </li>
                    }


                </ul>
            </div>

            {/* Body */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                <ul className="space-y-3">
                    {/* {
                        formState.price_change_branches?.map((branch) => console.log(formState.price_change_branches) )
                    } */}
                    {
                    generalFormFiles.filter(gf=>gf.name.includes("Update Online Price")).map((online,idx)=>(
                        <li
                            className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-gray-200 font-semibold text-blue-900"
                            key={idx}
                            >
                            <div className="font-mediums flex flex-col">
                            {online.name}: {formatStrDateTime(online?.created_at)}
                            </div>
                            <span className="text-sm text-green-600s flex items-center">
                                <span className="text-2xl me-2"><BsCartCheck/></span> <span>Online</span>
                            </span>
                        </li>
                    ))}


                {formState.price_change_branches?.map((pcbranch) => (
                    <li
                    key={pcbranch}
                    className="flex items-center justify-between p-1 rounded-lg borders"
                    >
                    <span className="font-medium">
                        {pcbranch.branch?.branch_name}: {pcbranch.message} 
                        {/* {pcbranch.status}  */}
                    </span>


                    {/* Status */}
                    <div>
                    {(pcbranch.status.toLowerCase()  == "default" || pcbranch.status.toLowerCase() === "pending" ) && (
                        <span className="text-sm text-yellow-600">
                        ⏳ Pending
                        </span>
                    )}

                    {pcbranch.status.toLowerCase() === "updating" && (
                        <span className="text-sm text-blue-600">
                        🔄 Updating...
                        </span>
                    )}

                    {pcbranch.status.toLowerCase() === "updated" && (
                        <span className="text-sm text-green-600">
                        ✔ Updated
                        </span>
                    )}

                    {pcbranch.status.toLowerCase() === "failed" && (
                        <span className="text-sm text-red-600">
                        ❌ Failed
                        </span>
                    )}
                    </div>

                    </li>
                ))}
                </ul>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
                <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
                >
                Close
                </button>
            </div>

            </div>
        </div>
        )}

        </>
    );

}


// =>If POS Databases Are Separate Servers (Very Common)
// Recommended Flow
// HQ API
//    ↓
// Branch POS API (per branch)
//    ↓
// Branch responds (success / fail)
//    ↓
// HQ updates branch status

// Branch POS endpoint
// POST /branch-api/update-prices


// Response:

// {
//   "status": "success",
//   "updated_products": 125
// }

// =>UI Suggestion (Very Important)

// Show progress dashboard after approval:

// Price Change Document #PC-2025-001

// ✔ Yangon        Updated
// ⏳ Mandalay     Updating...
// ❌ Naypyidaw    Failed (Retry)


// Add:

// 🔁 Retry failed branch

// 👁 View error log

// 📊 Progress bar