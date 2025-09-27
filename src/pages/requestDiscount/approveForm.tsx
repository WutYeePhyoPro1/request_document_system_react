import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { Button, Textarea } from "@mantine/core";

const ApproveForm: React.FC = () => {
    const approveData = useSelector((state: RootState) => state.discount.detailData);
    console.log("Approve Data>>" , approveData)
  return (
    <div className="mb-6" >
     
        <h1>Remark</h1>
        <div className="flex flex-justify items-center gap-4 w-full">
         <div className="w-1/2">
           <Textarea  resize="vertical"  placeholder="Your comment"/>
         </div>
          {
            approveData?.approver == true && (
              <div className="flex flex-justify items-center gap-4">
            <Button color="green" type="submit" value="BM Approved" >Check</Button>
          <Button color="red" type="submit">Cancel</Button>
          </div>
            )
          }
        </div>
      
    </div>
  );
};

export default ApproveForm;