import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { Input, Table, type TableData } from "@mantine/core";
import Swal from "sweetalert2";

const RequestDiscountDataDetailTable: React.FC = () => {
  const detailData = useSelector((state: RootState) => state.discount.detailData); 
  const Checked = "Checked";
const UnChecked = "UnChecked";
console.log("Testing API>>" , detailData) ;
const element = detailData?.discountProduct?.map((item: any, index: number) => ([
  index + 1,
  item.check ? Checked : UnChecked,
  item.product_category,
  item.product_code,
  item.product_name,
  item.selprice,
  item.selqty,
  item.discountamnt,
  item.netamount,
   item.request_discount,
  detailData?.approver ? (
   <Input  className="border border-blue-300 rounded  w-20" type="number" defaultValue={item.bm_discount ?? item.request_discount} onChange={(e) => {
  if(Number(e.target.value) > Number(item.request_discount)){
  Swal.fire({
        icon: "warning",
        title: "Invalid BM Discount",
        text: "BM Discount must be smaller than the Request Discount value.",
      });
      // Optional: Reset input value to the max allowed
      e.target.value = Number(item.request_discount);
  }
   }} name="bm_discount" />
  ):(
    item.bm_discount ?? item.request_discount
  ),
 
  item.category_discount ?? item.request_discount,
  item.remark,
]));

const tableData: TableData = {
  head: ['No', 'Check All' , 'Category' , 'Product Code' , 'Product Name' , 'Selling Price' , 'Qty' , 'Disc Amt' , 'Net Amt' , 'Disc%' , 'BM Disc%' ,'Cat Head Disc%' , 'Remark' ],
  body: element ?? [], 
};

  
  return (
    <div className="mt-6 overflow-x-auto">
       
       <Table 
        data={tableData}
        styles={{
          thead: {
            backgroundColor: '#A9D8E9', // Light gray background
          },
          th: {
            backgroundColor: 'inherit', // Inherit from thead
           
          }
        }}
      />
    </div>
  );
};

export default RequestDiscountDataDetailTable;
