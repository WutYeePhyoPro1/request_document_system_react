import React, { useState } from "react";
import { approveFormME } from "../../api/ME/meData";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";
import { Button, Textarea } from "@mantine/core";
import Swal from "sweetalert2";

type MeApproveFormProps = {
  detailData: meGeneratorDataType;
  onRefresh: () => void;
};

const MeApproveForm: React.FC<MeApproveFormProps> = ({
  detailData,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 150) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Comment cannot exceed 150 characters",
      });
      return;
    }
    setComment(e.target.value);
  };

  // const handleSubmit = async (statusValue: string) => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;

  //   const generalFormId = detailData?.generalForm?.id;
  //   const subFormId = detailData?.subForm?.sub_form_id;
  //   const formID = detailData?.generalForm?.form_id;

  //   if (!generalFormId || !subFormId) {
  //     console.error("Form id is missing");
  //     return;
  //   }

  //   setLoading(true);
  //   const isBack = statusValue === "back_to_previous";
  //   const sendManager = (statusValue = "Ongoing");
  //   if (statusValue === "back_to_previous" || statusValue === "Cancel") {
  //     if (!comment || comment.trim() === "") {
  //       Swal.fire({
  //         icon: "warning",
  //         title: "Please fill in a remark",
  //         text: "You must fill a reason for sending back to the previous step.",
  //         confirmButtonText: "OK",
  //       });
  //       return;
  //     }
  //   }

  //   try {
  //     const submitData = {
  //       status: statusValue,
  //       comment,
  //     };
  //     // Final approve flow
  //     await approveFormME(token, submitData, formID, generalFormId, subFormId);
  //     console.log("submitData>>", submitData);
  //     Swal.fire({
  //       icon: "success",
  //       title: "Success",
  //       text: sendManager
  //         ? "Form send successfully to manager"
  //         : isBack
  //           ? `Form has been backed successfully!`
  //           : `Form has been ${statusValue} successfully!`,
  //     });
  //     onRefresh();
  //   } catch (error) {
  //     console.error(error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: "Something went wrong",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (statusValue: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    console.log("StatusValue>>", statusValue);

    const generalFormId = detailData?.generalForm?.id;
    const subFormId = detailData?.subForm?.sub_form_id;
    const formID = detailData?.generalForm?.form_id;

    if (!generalFormId || !subFormId || !formID) {
      Swal.fire("Error", "Form ID is missing", "error");
      return;
    }

    const isBack = statusValue === "back_to_previous";
    const isCancel = statusValue === "Cancel";
    const isSendManager = statusValue === "Ongoing";

    const needsRemark = isBack || isCancel;
    const hasComment = comment?.trim().length > 0;
    const isDefaultStatus = detailData?.generalForm?.status === "Default";

    if (needsRemark && !hasComment && !isDefaultStatus) {
      Swal.fire({
        icon: "warning",
        title: "Remark required",
        text: "You must fill a reason.",
      });
      return;
    }

    setLoading(true);

    try {
      await approveFormME(
        token,
        { status: statusValue, comment },
        formID,
        generalFormId,
        subFormId,
      );
      console.log(
        { status: statusValue, comment },
        formID,
        generalFormId,
        subFormId,
      );
      const successMap: Record<string, string> = {
        Ongoing: "Form sent to manager successfully",
        back_to_previous: "Form sent back successfully",
        Cancel: "Form cancelled successfully",
      };

      Swal.fire({
        icon: "success",
        title: "Success",
        text: successMap[statusValue] ?? `Form ${statusValue} successfully`,
      });

      setComment("");
      onRefresh();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {detailData?.generalForm?.status === "Default" &&
        detailData?.sendManagerAssettype === true && (
          <>
            {/* <h1>Remark</h1> */}
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-4">
                <Button
                  color="blue"
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit("Ongoing")}
                >
                  Send to manager
                </Button>

                <Button
                  color="red"
                  disabled={loading}
                  onClick={() => handleSubmit("Cancel")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

      {detailData?.approver === true &&
        detailData?.generalForm?.status === "Ongoing" && (
          <>
            <h1>Remark</h1>
            <div className="flex items-center gap-4 w-full">
              <div className="w-1/2">
                <Textarea
                  resize="vertical"
                  name="comment"
                  placeholder="Your comment"
                  value={comment}
                  onChange={handleCommentChange}
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  color="green"
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit("BM Approved")}
                >
                  Complete
                </Button>
                <Button
                  color="yellow"
                  disabled={loading}
                  onClick={() => handleSubmit("back_to_previous")}
                >
                  Back To Previous
                </Button>
                <Button
                  color="red"
                  disabled={loading}
                  onClick={() => handleSubmit("Cancel")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

export default MeApproveForm;
