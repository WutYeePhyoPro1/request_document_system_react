import React, { useEffect, useState } from "react";
import cctvPhoto from "../../assets/images/ban1.png";
import NavPath from "../../components/NavPath";
import { useForm } from "@mantine/form";
import { Button, Group, TextInput, NumberInput, MultiSelect, Select, FileInput, Textarea, type TableData, Table, Loader
} from
"@mantine/core";
import "@mantine/core/styles.css";
import { IconFile, IconX } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import { getCreateData, getStoreData, searchInvoiceData } from "../../api/requestDiscount/requestDiscountData";
import type { requestDiscountCreateResponse, searchInvoiceNumber , FormValues, InvoiceFile } from
"../../utils/requestDiscountUtil/create";
import { useNavigate } from "react-router-dom";
const Create: React.FC = () => {
const [invoiceFile , setInvoiceFile] = useState<InvoiceFile>([{ id: uuidv4() , file:null}]);
    const [createData , setCreateData] = useState<requestDiscountCreateResponse[]> ([]);
        const [detailInvoice , setDetailInvoice] = useState<searchInvoiceNumber[]>([]);
            const [isLoading , setIsLoading ] = useState<boolean>(false);
                const navigate = useNavigate();

                const form = useForm<FormValues>({
                    mode: "uncontrolled",
                    initialValues: {
                    sale_staff: "",
                    customer_name: "",
                    customer_code: "",
                    sale_invoice: "",
                    remark: "" ,
                    discount_type: [],
                    file: [],
                    product_category: [] ,
                    product_code: [] ,
                    product_name: [],
                    selprice: [],
                    saleqty: [] ,
                    discountamnt: [] ,
                    netamount: [],
                    request_discount: [] ,
                    },
                    });
                    const onFinish = async (values: FormValues) => {
                    try {
                    const token = localStorage.getItem("token");
                    if (!token) return;

                    const formData = new FormData();
                    formData.append("sale_staff", values.sale_staff);
                    formData.append("customer_name", detailInvoice[0].custname);
                    formData.append("customer_code", detailInvoice[0].custcode);
                    formData.append("sale_invoice", values.sale_invoice);
                    formData.append("remark", values.remark ?? "");


                    if (detailInvoice.length > 0) {
                    detailInvoice.forEach((item, i) => {
                    formData.append(`product_category[${i}]`, item.main_category ?? "");
                    formData.append(`product_code[${i}]`, item.barcode ?? "");
                    formData.append(`product_name[${i}]`, item.barcode_name ?? "");
                    formData.append(`selprice[${i}]`, item.selling_price ?? "");
                    formData.append(`saleqty[${i}]`, item.saleqty ?? "");
                    formData.append(`discountamnt[${i}]`, item.discountamnt ?? "");
                    formData.append(`netamount[${i}]`, item.netamount ?? "");
                    formData.append(`request_discount[${i}]`, item.discountpercentage ?? "");
                    formData.append(`bm_discount[${i}]`, "");
                    formData.append(`category_discount[${i}]`, "");
                    formData.append(`mer_discount[${i}]`, "");
                    });
                    } else {
                    // send one empty item to keep backend arrays consistent
                    formData.append("product_category[]", "");
                    formData.append("product_code[]", "");
                    formData.append("product_name[]", "");
                    formData.append("selprice[]", "");
                    formData.append("saleqty[]", "");
                    formData.append("discountamnt[]", "");
                    formData.append("netamount[]", "");
                    formData.append("request_discount[]", "");
                    }
                    if (values.discount_type && values.discount_type.length > 0) {
                    values.discount_type.forEach((type, i) =>
                    formData.append(`discount_type[${i}]`, type)
                    );
                    } else {
                    formData.append("discount_type[]", ""); // send empty array key
                    }


                    // --- Files ---
                    invoiceFile.forEach((f, i) => {
                    if (f.file) {
                    formData.append(`file[${i}]`, f.file);
                    }
                    });

                    const response = await getStoreData(token, formData);
                    console.log("Store Response >>>", response);
                    navigate('/request-discount')

                    } catch (error) {
                    console.error("Error saving discount request:", error);
                    }
                    };

                    const fileIcon =
                    <IconFile size={18} stroke={1.5} />
                    const invoiceData: TableData = {
                    head: [
                    "No",
                    "Category",
                    "Product Code",
                    "Product Name",
                    "Selling Price",
                    "Qty",
                    "Disc",
                    "NetAmount",
                    ],
                    body: isLoading
                    ? [
                    [
                    <td colSpan={8} key="loader" className="text-center py-6">
                        <Loader />
                    </td>,
                    ],
                    ]
                    : detailInvoice.map((item, index) => [
                    String(index + 1),
                    item.main_category,
                    item.barcode,
                    item.barcode_name,
                    item.selling_price,
                    item.saleqty,
                    item.discountamnt,
                    item.netamount,
                    ]),
                    };
                    const addInvoiceFile = () => {
                    console.log("Add File");
                    setInvoiceFile([...invoiceFile , {id:uuidv4() , file:null}]);
                    }
                    const removeInvoiceFile = (id:string) => {
                    if(invoiceFile.length > 1) {
                    setInvoiceFile(invoiceFile.filter((f) => f.id !== id))
                    }
                    }
                    const updateFile = (id: string, file: File | null) => {
                    setInvoiceFile((prev) =>
                    prev.map((f) => (f.id === id ? { ...f, file } : f))
                    );
                    };
                    const fetchData = async() : Promise<void> => {
                        const token = localStorage.getItem("token");
                        if(!token) return ;
                        try{
                        const data = await getCreateData(token);
                        setCreateData(data);
                        }catch (error) {
                        console.error("Error fetching discount data at create:", error);
                        }
                        }
                        useEffect(()=> {
                        fetchData();
                        } , []);
                        const saleStaffData =
                        createData?.sale_staffs?.map((staff) => ({
                        value: `${staff.employeename}(${staff.employeecode})` ,
                        label: staff.employeename.trim(),
                        })) ?? [];

                        const handleInvoiceNo = async(invoice_number:string) => {
                        const token = localStorage.getItem("token") ;
                        if(!token) return ;
                        try {
                        setIsLoading(true);
                        const response = await searchInvoiceData(token , invoice_number);
                        if(response && response.length > 0){
                        console.log("Response>>" , response)
                        form.setFieldValue("customer_name", response[0].custname);
                        form.setFieldValue("customer_code", response[0].custcode);
                        setDetailInvoice(response);
                        }else{
                        form.setFieldValue("customer_name", "");
                        form.setFieldValue("customer_code", "");
                        setDetailInvoice([]);
                        }
                        } catch (error) {
                        console.error("Error fetching invoice data:", error);
                        form.setFieldValue("customer_name", "");
                        form.setFieldValue("customer_code", "");
                        setDetailInvoice([]);
                        }finally{
                        setIsLoading(false);
                        }
                        }
                        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.currentTarget.value ;
                            form.setFieldValue("customer_name", "");
                            form.setFieldValue("customer_code", "");
                            setDetailInvoice([]);
                            form.setFieldValue("sale_invoice", value);
                            }
                            return (
                            <div className="p-6">
                                <img src={cctvPhoto}
                                    className="w-full h-auto object-contain rounded-lg shadow-md mb-6" />
                                <NavPath segments={[ { path: "/dashboard" , label: "Home" }, { path: "/dashboard" ,
                                    label: "Dashboard" }, { path: "/request-discount" , label: "Request Discount" },
                                    ]} />
                                <form onSubmit={form.onSubmit(onFinish)}>
                                    <div className="flex flex-row gap-6">
                                        <div
                                            className="basis-1/3 border border-slate-400 rounded p-4 flex flex-col gap-6">
                                            <TextInput placeholder="Enter branch name" withAsterisk readOnly
                                                key={form.key("branch_name")} {...form.getInputProps("branch_name")} />

                                            <Select label="Request Sale Staff" placeholder="Choose your sale staff"
                                                data={saleStaffData} withAsterisk key={form.key("sale_staff")}
                                                {...form.getInputProps("sale_staff")} searchable />
                                            <TextInput label="Sale Invoice No" placeholder="Enter sale invoice number"
                                                withAsterisk key={form.key("sale_invoice")}
                                                {...form.getInputProps("sale_invoice")} onChange={handleChange}
                                                onBlur={(e)=>
                                                handleInvoiceNo(e.currentTarget.value)} />


                                                <TextInput label="Customer Name" placeholder="Enter customer name"
                                                    withAsterisk key={form.key("customer_name")}
                                                    {...form.getInputProps("customer_name")} readOnly />
                                                <TextInput label="Customer Code" placeholder="Enter customer code"
                                                    withAsterisk key={form.key("customer_code")}
                                                    {...form.getInputProps("customer_code")} readOnly />

                                                <MultiSelect label="Discount Type" placeholder="Choose Discount Type"
                                                    data={["VolumeDiscount", "Damage Discunt" , "Project Discount"
                                                    , "Supplier Direct/Warehouse Discount" , "Shwe Zin Htet Discount"
                                                    , "Price Change Discount" , "BM Request , Merchandise App Discount"
                                                    , "Nearly expire items Discount" , "Installation free Discount"
                                                    , "Goledn Minute Discount" ]}
                                                    {...form.getInputProps("discount_type")} searchable />
                                                {/* Dynamic File Inputs in flex-row */}
                                                <div className="flex flex-col items-end gap-3">
                                                    {invoiceFile.map((fileField, index) => (
                                                    <div key={fileField.id}
                                                        className="flex flex-row items-end gap-2 w-full">
                                                        <FileInput leftSection={fileIcon} label={index===0
                                                            ? "Upload Invoice or Slip" : undefined}
                                                            placeholder="Upload file" leftSectionPointerEvents="none"
                                                            className="w-3/4" value={fileField.name} onChange={(file)=>
                                                            updateFile(fileField.id, file)}
                                                            />
                                                            {index === 0 ? (
                                                            // First row → Add button
                                                            <Button onClick={addInvoiceFile}>
                                                                Add
                                                            </Button>
                                                            ) : (
                                                            // Other rows → Remove button
                                                            <Button color="red" onClick={()=>
                                                                removeInvoiceFile(fileField.id)}
                                                                >
                                                                <IconX size={16} />
                                                            </Button>
                                                            )}
                                                    </div>
                                                    ))}
                                                </div>


                                                <Textarea label="Remark" placeholder="Enter your remark" />
                                        </div>
                                        <div className="w-full overflow-x-auto p-4 flex flex-col gap-6">
                                            <Table data={invoiceData} />
                                            <div className="flex flex-justify gap-6">
                                                <Button type="submit">Save</Button>
                                                <Button>Cancel</Button>
                                            </div>
                                        </div>
                                    </div>

                                </form>
                            </div>
                            );
                            };

                            export default Create;
