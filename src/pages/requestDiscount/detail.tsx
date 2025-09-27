import React, { useEffect, useState } from "react";
import dashboardPhoto from "../../assets/images/reqBa.png";
import NavPath from "../../components/NavPath";
// import { deleteFile, getDetailData } from "../../api/requestDiscount/requestDiscountData";
import { useParams } from "react-router-dom";
import { FiCopy } from "react-icons/fi";
import StatusBadge from "../../components/ui/StatusBadge";
import { dateFormat, handleCopy } from "../../utils/requestDiscountUtil/helper";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button } from "@mantine/core";
import AddAttachFile from "./addAttachFile";
import Swal from "sweetalert2";
import RequestDiscountDataDetailTable from "./requestDiscountDataDetailTable";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { deleteDiscountFile, fetchDetailData } from "../../store/discountSlice";
import ApproveForm from "./approveForm";

const Detail: React.FC = () => {
  const {id} = useParams<{id:string}>() ;
  const dispatch = useDispatch<AppDispatch>();
  const {detailData , loading } = useSelector((state:RootState)=> state.discount) ;
  const [copied, setCopied] = useState<boolean>(false);
  const [fileOpened, { open: openFileModal, close: closeFileModal }] = useDisclosure(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && id) {
      dispatch(fetchDetailData({ token, id }));
    }
  }, [dispatch, id]);
    
  console.log("Detail>>", detailData);
  const formDocNo = detailData?.form?.form_doc_no || "";


  const onCopyClick = () => {
    handleCopy(
      formDocNo,
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.log("Copy Failed:", err);
      }
    );
  };
  const element = detailData?.data?.map((item) => ({
    requestSaleStaff: item.sale_staff,
    saleInvoiceNo: item.sale_invoice,
    customerName: item.customer_name,
    customerCode: item.customer_code,
    remark: item.remark,
    discountType: item.discount_type?.map((dt) => dt.discount_type) || [],
    requestDiscountImge:
      item.attach_product?.map((rdImage) => rdImage.file) || [],
  }));
 const handleDete = async(fileID:number) => {
const token: string = localStorage.getItem("token") || "";
 Swal.fire({
  title: "Are you sure?",
  text: "This file will be permanently deleted!" ,
  icon: "warning" ,
  showCancelButton: true ,
  confirmButtonColor: "#d33" ,
  cancelButtonColor: "#3085d6",
  confirmButtonText: "Yes , delete it !" ,
  cancelButtonText: "Cancel",
 }).then(async(result) => {
  if(result.isConfirmed){
    try {
       await dispatch(deleteDiscountFile({token , id:fileID}));

        Swal.fire("Deleted!", "The file has been removed.", "success");
      } catch (error: any) {
        console.error("Error deleting file:", error);
        Swal.fire("Error!", "Something went wrong. Try again.", "error");
      }
  }
 })
 }
   
  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl font-bold text-black">
            Loading
            <span className="animate-pulse">.</span>
            <span className="animate-pulse delay-200">.</span>
            <span className="animate-pulse delay-400">.</span>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <div
            className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
            style={{ backgroundImage: `url(${dashboardPhoto})` }}
          ></div>
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6">
            <NavPath
              segments={[
                { path: "/dashboard", label: "Dashboard" },
                { path: "/request-discount", label: "Request Discount" },
                {
                  path: `/request-discount-detail/${id}`,
                  label: "Request Discount Detail",
                },
              ]}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <h2 className="text-base sm:text-lg font-semibold">
                Request Discount Form(
                {detailData?.form?.form_doc_no
                  ? detailData?.form?.form_doc_no
                  : ""}
                )
                <button
                  onClick={onCopyClick}
                  className={`ml-2 px-2 py-1 text-xs rounded transition-all ${
                    copied
                      ? "text-green-600 bg-green-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                  }`}
                  title={copied ? "Copied!" : "Copy ID"}
                  disabled={copied}
                >
                  {copied ? "Copied!" : <FiCopy className="w-4 h-4" />}
                </button>
                <StatusBadge
                  status={
                    detailData?.form?.status ? detailData?.form?.status : ""
                  }
                />
              </h2>
              <div className="text-gray-600 text-sm sm:text-base">
                {detailData?.form?.created_at
                  ? dateFormat(detailData?.form?.created_at)
                  : ""}
              </div>
            </div>
            <div className="mb-6">
              <div className="font-medium mb-2">
                Request Manual Discount Detail
              </div>
              <div className="bodyData">
                <div className="staffData  ">
                  <div className="flex flex-justify items-center gap-8 w-full flex-wrap">
                    {detailData?.data?.map((item) => (
                      <div className="space-y-4 border rounded-lg p-6 shadoe-sm lg:w-3/5 md:w-3/5">
                        <div className="flex flex-col sm:flex-row sm:items-center border-b pb-2">
                          <div className="w-48 font-semibold text-gray-700">
                            Request Sale Staff
                          </div>
                          <div className="flex-1">{item.sale_staff}</div>
                        </div>
                        <div className="flex border-b pb-2 ">
                          <div className="w-48 font-semibold text-gray-700">
                            Sale Invoice No
                          </div>
                          <div className="flex-1">{item.sale_invoice}</div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center border-b pb-2">
                          <div className="w-48 font-semibold text-gray-700">
                            Customer Name
                          </div>
                          <div className="flex-1">{item.customer_name}</div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center border-b pb-2">
                          <div className="w-48 font-semibold text-gray-700">
                            Customer Code
                          </div>
                          <div className="flex-1">{item.customer_code}</div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center border-b pb-2">
                          <div className="w-48 font-semibold text-gray-700">
                            Discount Type
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {item.discount_type?.map((dt, i) => (
                              <span
                                key={i}
                                className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full"
                              >
                                {dt.discount_type}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center border-b pb-2">
                          <div className="w-48 font-semibold text-gray-700">
                            Remark
                          </div>
                          <div className="flex-1">{item.remark}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col items-center space-y-3">
                     
                      <Modal size="45rem"  opened={fileOpened} onClose={closeFileModal} title="Attach Photo" centered >
                       <div className="flex flex-wrap gap-4 items-center justify-center">
                        {detailData?.files?.map((img, i) => (
                        <div className="flex flex-col ">
                        <img
                            key={i}
                            src={img.file_url}
                            alt="Discount Attachment"
                            className="w-20  h-20 object-cover rounded border"
                          />
                       
                           <a
                            href={img.file_url}
                            className="text-blue-600 underline"
                          >
                            {img.name}
                          </a>
                          <Button   onClick={() => handleDete(img.id)} color="red" variant="filled" size="xs" >Delete</Button>
                          
                          
                        </div>
                      ))}
                       </div>
                      </Modal>
                     
                  { detailData?.files?.[0] && (
                    <>
                    <a href={detailData.files[0].file_url} className="text-blue-600 underline" target="_blank"> Operation Attach File</a>
                    <img src={detailData.files[0].file_url} alt={detailData.files[0].name || "Discount Attachment"} className="w-40 h-40 object-cover rounded border" onClick={openFileModal} />
                    
                    </>
                    
                  ) }

                      <AddAttachFile generalFormId={id} />
                    </div>
                  </div>
                </div>
                <div className="tableData">
                  <RequestDiscountDataDetailTable  />
                </div>
                <hr className="mt-8 mb-6"/>
                <div className="approve">
                  <ApproveForm/>
                </div>
                <div className="userData">
                  <div className="">
                    <h1>Prepared By</h1>
                    <h1>Miss.{detailData?.form?.originators?.name}</h1>
                    <h1>({detailData?.form?.originators?.departments?.name})</h1>
                    <h1>{dateFormat(detailData?.form?.created_at)}</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
