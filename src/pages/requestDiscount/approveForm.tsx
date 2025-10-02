// ApproveForm.tsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { Button, Textarea } from "@mantine/core";
import { setComment } from "../../store/approveSlice";
import { discountApproveForm } from "../../store/discountSlice";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const ApproveForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const detailData = useSelector(
    (state: RootState) => state.discount.detailData
  );
  const { formData } = useSelector((state: RootState) => state.approve);
  const { loading } = useSelector((state: RootState) => state.discount); // Add loading state

  const formId = detailData?.form?.id;
const navigate = useNavigate();
  const handleSubmit = async (statusValue: string) => {
    if (!formId) {
      console.error("Form ID is missing");
      return;
    }

    const submitData = {
      status: statusValue,
      comment: formData.comment || "",
      bm_discount: formData.bm_discount || [],
      product_id: formData.product_id || [],
    };

  const confirmBox = await  Swal.fire({
      title: "Are you Sure?" ,
      text: `Want to ${statusValue} this form` ,
      icon: 'warning' ,
      showCancelButton: true ,
      confirmButtonColor: "#30856d" ,
      cancelButtonColor: '#d33' ,
      confirmButtonText: 'Yes',
    }  )
  
  if(confirmBox.isConfirmed) {
      try {
      const result = await dispatch(
        discountApproveForm({
          formId: Number(formId),
          data: submitData,
        })
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Form has been ${statusValue} successfully!`,
      });
      navigate('/request-discount') ;
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "Failed to approve form.",
      });
      console.error("Failed to approve form:", error);
    }
  }
    
    }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setComment(e.target.value));
    console.log(setComment(e.target.value));
  };

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
                <Button color="red" disabled={loading}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

      {detailData?.form?.status === "BM Approved" && (
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
              <Button color="red" disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ApproveForm;
