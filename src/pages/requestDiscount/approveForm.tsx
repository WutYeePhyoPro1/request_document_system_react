// ApproveForm.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { Button, FileInput, Modal, Textarea } from "@mantine/core";
import {
  branchUpload,
  deleteAccountFile,
  setComment,
  type uploadData,
} from "../../store/approveSlice";
import {
  discountApproveForm,
  fetchDetailData,
  updateDetailData,
} from "../../store/discountSlice";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { IconFile, IconX } from "@tabler/icons-react";
import type { InvoiceFile } from "../../utils/requestDiscountUtil/create";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";

const ApproveForm: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [fileOpened, { open: openFileModal, close: closeFileModal }] =
    useDisclosure(false);
  const dispatch = useDispatch<AppDispatch>();
  const detailData = useSelector(
    (state: RootState) => state.discount.detailData
  );

  const [accountFile, setAccountFile] = useState<InvoiceFile>(
    detailData?.accountFile || []
  );
  const [invoiceFile, setInvoiceFile] = useState<InvoiceFile>([
    { id: uuidv4(), file: null },
  ]);
  const { formData } = useSelector((state: RootState) => state.approve);
  const { loading } = useSelector((state: RootState) => state.discount);
  useEffect(() => {
    if (detailData?.accountFile) {
      setAccountFile(detailData.accountFile);
    }
  }, [detailData?.accountFile]);
  const formId = detailData?.form?.id;
  console.log("Detail Data>>", detailData , formId);
  const icon = <IconFile size={18} stroke={1.5} />;
  const navigate = useNavigate();
  const handleSubmit = async (statusValue: string) => {
    if (statusValue == "cateCheck") {
      const checkCount =
        formData.check?.filter((v: string | null) => v === "checked").length ||
        0;
      if (checkCount === 0) {
        Swal.fire({
          icon: "warning",
          title: "No Items Selected",
          text: "Please check at least one item before submitting!",
          confirmButtonText: "OK",
        });
        return;
      }
    }
    if (!formId) {
      console.error("Form ID is missing");
      return;
    }
   if (statusValue === "bracc_btp" || statusValue === "cat_btp" || statusValue === "mer_btp") {
  if (!formData.comment || formData.comment.trim() === "") {
    Swal.fire({
      icon: "warning",
      title: "Please fill in a remark",
      text: "You must fill a reason for sending back to the previous step.",
      confirmButtonText: "OK",
    });
    return;
  }
}

    const checkedItems =
      statusValue === "cateCheck"
        ? detailData?.discountProduct
            ?.map((item, index) => {
              const isChecked = formData.check?.[index] === "checked";
              if (!isChecked) return null;

              return {
                product_id: item.product_id ?? item.id,
                category_discount:
                  formData.category_discount?.[index] ??
                  item.category_discount ??
                  0,
                check: "checked",
              };
            })
            .filter(Boolean)
        : detailData?.discountProduct?.map((item, index) => ({
            product_id: item.product_id ?? item.id,
            category_discount:
              formData.category_discount?.[index] ??
              item.category_discount ??
              0,
            check: formData.check?.[index] ?? item.check ?? null,
          })) || [];

    // 🔥 FIX: Build bm_discount array for ALL products
    const bmDiscountArray =
      detailData?.discountProduct?.map(
        (item, index) =>
          formData.bm_discount?.[index] ??
          item.bm_discount ??
          item.request_discount
      ) || [];

    const submitData = {
      status: statusValue,
      comment: formData.comment || "",
      bm_discount: bmDiscountArray, // Send for all products
      product_id: checkedItems.map((v) => v.product_id),
      category_discount: checkedItems.map((v) => v.category_discount),
      check: checkedItems.map((v) => v.check),
    };

    const confirmBox = await Swal.fire({
      title: "Are you Sure?",
      text: `Want to ${statusValue} this form`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#30856d",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
    });

    if (confirmBox.isConfirmed) {
      if (
        submitData.product_id.length !== submitData.category_discount.length ||
        submitData.product_id.length !== submitData.check.length
      ) {
        console.error("❌ Mismatched array lengths!", {
          product_id: submitData.product_id.length,
          category_discount: submitData.category_discount.length,
          check: submitData.check.length,
        });
        Swal.fire({
          icon: "error",
          title: "Data mismatch",
          text: "Some product data is missing. Please re-check before submitting.",
        });
        return;
      }

      try {
        const result = await dispatch(
          discountApproveForm({
            formId: Number(formId),
            data: submitData,
          })
        ).unwrap();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Form has been ${statusValue} successfully!`,
        });
        console.log("Submit Data" , submitData) ;
       
        const token = localStorage.getItem("token");
        if (token && formId) {
          await dispatch(fetchDetailData({ token, id: formId.toString() }));
        }
      //    if (token && formId) {
      //   // Use a small timeout to ensure the backend has processed the request
      //   setTimeout(async () => {
      //     await dispatch(fetchDetailData({ token, id: formId.toString() }));
      //   }, 500);
      // }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.message || "Failed to approve form.",
        });
        console.error("Failed to approve form:", error);
      }
    }
  };
  const handleClose = () => {
    setInvoiceFile([{ id: uuidv4(), file: null }]);
    close();
  };

  const onFinish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const filesToUpload = invoiceFile
      .map((f) => f.file)
      .filter((file) => file !== null) as File[];

    if (filesToUpload.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No File",
        text: "Please select at least one file to upload.",
      });
      return;
    }

    try {
      await dispatch(
        branchUpload({
          generalFormId: detailData.form.id,
          formDocNo: detailData.form.form_doc_no,
          files: filesToUpload,
        })
      ).unwrap();

      Swal.fire({
        icon: "success",
        title: "Upload Successful",
        text: "Files uploaded successfully!",
      });
       setInvoiceFile([{ id: uuidv4(), file: null }]);
      close() ;
      const token = localStorage.getItem("token");
      if (token && formId) {
        await dispatch(fetchDetailData({ token, id: formId.toString() }));
      }
      
      window.scrollTo({ top: 0, behavior: "smooth" });
      // closeFileModal();
      
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err?.message || "Something went wrong during upload.",
      });
    }
  };

  const handleDeleteAccountFile = async (id: number) => {
    const token: string = localStorage.getItem("token") || "";
    Swal.fire({
      title: "Are you sure?",
      text: "This file will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes , delete it !cvx",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(deleteAccountFile({ token, id: id }));
          setAccountFile((prev) => prev.filter((f) => f.id !== id));
          Swal.fire("Deleted!", "This file has been removed.", "success");
        } catch (error: any) {
          console.error("Error deleting file:", error);
          Swal.fire("Error!", "Something went wrong.Try again.", "error");
        }
      }
    });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if(e.target.value.length > 150) {
      Swal.fire({
        icon: "warning" ,
        title: "Warning" ,
        text: "Comment cannot exceed 150 characters" ,
      });
      return ;
    }
    dispatch(setComment(e.target.value));
    console.log(setComment(e.target.value));
  };
  const addDiscountFile = () => {
    console.log("Add File");
    setInvoiceFile([...invoiceFile, { id: uuidv4(), file: null }]);
  };
  const removeDiscountFile = (id: string) => {
    console.log("ID>>", id);
    if (invoiceFile.length > 1) {
      setInvoiceFile(invoiceFile.filter((f: string) => f.id !== id));
    }
  };
  const updateFile = (id: string, file: File | null) => {
    setInvoiceFile((prev) =>
      prev.map((f: number) => (f.id === id ? { ...f, file } : f))
    );
  };
  const form = useForm<uploadData>({
    mode: "uncontrolled",
    initialValues: {
      file: [],
    },
  });

  return (
    <div className="mb-6">
      {detailData?.approver === true &&
        detailData.form.status === "Ongoing" && (
          <>
            <h1>Remark</h1>
            <div className="flex flex-justify items-center gap-4 w-full">
              <div className="w-1/2">
                <Textarea
                  resize="vertical"
                  name="comment"
                  placeholder="Your comment"
                  value={formData.comment || ""}
                  onChange={handleCommentChange}
                />
              </div>
              <div className="flex flex-justify items-center gap-4">
                <Button
                  color="green"
                  onClick={() => handleSubmit("BM Approved")}
                  loading={loading} // Show loading state
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Check"}
                </Button>
                <Button color="red" disabled={loading} onClick={() => handleSubmit("Cancel")} >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      {detailData?.supervisor === true &&
        detailData?.form?.status === "BM Approved" &&
        detailData?.checkNullCategroy == true && (
          <div className="flex justify-start items-center gap-4 mt-4">
            <Button
              color="green"
              onClick={() => handleSubmit("cateCheck")}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Check"}
            </Button>
          </div>
        )}

      {detailData?.supervisor == true &&
        detailData?.form?.status === "BM Approved" &&
        detailData?.checkNullCategroy == false && (
          <>
            <h1>Remark</h1>
            <div className="flex flex-justify items-center gap-4 w-full">
              <div className="w-1/2">
                <Textarea
                  resize="vertical"
                  name="comment"
                  placeholder="Your comment"
                  value={formData.comment || ""}
                  onChange={handleCommentChange}
                />
              </div>
              <div className="flex flex-justify items-center gap-4">
                <Button
                  color="green"
                  onClick={() => handleSubmit("Approved")}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Approved"}
                </Button>
                <Button  color="red" disabled={loading} onClick = {() => handleSubmit("Cancel")}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

      {detailData?.manager == true &&
        detailData?.form?.status === "Approved" && (
          <>
            <h1>Remark</h1>
            <div className="flex flex-justify items-center gap-4 w-full">
              <div className="w-1/2">
                <Textarea
                  resize="vertical"
                  name="comment"
                  placeholder="Your comment"
                  value={formData.comment || ""}
                  onChange={handleCommentChange}
                />
              </div>
              <div className="flex flex-justify items-center gap-4">
                <Button
                  color="green"
                  onClick={() => handleSubmit("Acknowledged")}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Acknowledge"}
                </Button>
                <Button
                  color="yellow"
                  disabled={loading}
                  onClick={() => handleSubmit("mer_btp")}
                >
                  Back To Previous
                </Button>
                <Button color="red" disabled={loading} onClick={() => handleSubmit("Cancel")}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      <div className="flex flex-justify items-start gap-6 flex-col">
        {detailData?.getDisdountBraccImage?.length > 0 && (
          <div className="">
            <Modal
              opened={fileOpened}
              onClose={closeFileModal}
              title="Branch Account Attach File"
              centered
            >
              <div className="flex flex-wrap gap-4 items-center justify-center">
                {accountFile?.map((img, i) => (
                  <div className="flex flex-col">
                    <img
                      key={i}
                      src={img.file_url}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <a href={img.file_url} className="text-blue-600 underline">
                      {img.name}
                    </a>
                    <Button
                      color="red"
                      variant="filled"
                      size="xs"
                      onClick={() => handleDeleteAccountFile(img.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </Modal>
            {accountFile?.[0] && (
              <div
                onClick={openFileModal}
                className="flex flex-col gap-4 items-start "
              >
                <a className="text-blue-500 hover:text-blue-700  font-bold py-2 px-4 rounded cursor-pointer">
                  Branch Account Attach Files
                </a>
                <img
                  src={accountFile[0].file_url}
                  className="w-40 h-40 object-cover rounded brder"
                />
              </div>
            )}
          </div>
        )}
        {detailData?.reqAcknowledge == true && (
          <>
            <Modal opened={opened} onClose={handleClose} title="Upload File">
              <div className="flex flex-col gap-6 w-full">
                <form
                  onSubmit={onFinish}
                  className="flex flex-justify items-start gap-2 w-full"
                >
                  <div className="flex flex-justify flex-col items-center gap-4 w-full">
                    {invoiceFile.map((fileField, index) => (
                      <div
                        key={fileField.id}
                        className="flex flex-row items-end gap-2 w-full"
                      >
                        <FileInput
                          className="w-4/5"
                          leftSection={icon}
                          placeholder="Upload File (Branch Account)"
                          leftSectionPointerEvents="none"
                          onChange={(file) => updateFile(fileField.id, file)}
                        />
                        {index === 0 ? (
                          <Button onClick={addDiscountFile} className="1/5">
                            Add
                          </Button>
                        ) : (
                          <Button
                            color="red"
                            onClick={() => removeDiscountFile(fileField.id)}
                          >
                            <IconX size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <Button type="submit" color="green" loading={loading}>
                      {loading ? "Uploading..." : "Save"}
                    </Button>
                  </div>
                </form>
              </div>
            </Modal>
            <Button
              color="blue"
              leftSection={icon}
              className="text-gray-600 text-sm flex items-center gap-1"
              onClick={open}
            >
              Upload File (Branch Account)
            </Button>
            <>
              <h1>Remark</h1>
              <div className="flex flex-justify items-center gap-4 w-full">
                <div className="w-1/2">
                  <Textarea
                    resize="vertical"
                    name="comment"
                    placeholder="Your comment"
                    value={formData.comment || ""}
                    onChange={handleCommentChange}
                  />
                </div>
                <div className="flex flex-justify items-center gap-4">
                  <Button
                    color="green"
                    onClick={() => handleSubmit("Completed")}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Complete"}
                  </Button>
                  <Button
                    color="yellow"
                    disabled={loading}
                    onClick={() => handleSubmit("bracc_btp")}
                  >
                    Back To Previous
                  </Button>
                </div>
              </div>
            </>
          </>
        )}
      </div>
    </div>
  );
};

export default ApproveForm;
