import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch,  RootState } from "../../store";
import { Input, Table, type TableData } from "@mantine/core";
import Swal from "sweetalert2";
import { setBmDiscount, setProductIds } from "../../store/approveSlice";

const RequestDiscountDataDetailTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const detailData = useSelector((state: RootState) => state.discount.detailData); 
  const {formData} = useSelector((state:RootState) => state.approve) ;
// In RequestDiscountDataDetailTable.tsx - add debugging

useEffect(() => {
  if (detailData?.discountProduct) {
    const productIds = detailData.discountProduct.map((item: any) => item.product_id || item.id);
    dispatch(setProductIds(productIds));
    console.log("Product IDs set:", productIds);
  }
}, [detailData?.discountProduct, dispatch]);
const handleBmDiscountChange = (index: number, e: React.ChangeEvent<HTMLInputElement>, maxDiscount: number) => {
  let value = parseFloat(e.target.value);

  if (value > Number(maxDiscount)) {
    Swal.fire({
      icon: "warning",
      title: "Invalid BM Discount",
      text: `BM Discount must be smaller than the Request Discount (${Number(maxDiscount)}) value.`,
    });
    value = Number(maxDiscount) ;
    
  }

  // Update Redux/State only if valid
  dispatch(setBmDiscount({ index, value }));
};


  const Checked = "Checked";
const UnChecked = "UnChecked";
// console.log("Testing API>>" , detailData) ;
const element = detailData?.discountProduct?.map((item: any, index: number) => {
  const productId = item.product_id || item.id;
  
  return [
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
      <Input 
        className="border border-blue-300 rounded w-20" 
        type="number" 
        defaultValue={item.bm_discount ?? item.request_discount}
        value={formData.bm_discount?.[index] ?? item.bm_discount ?? item.request_discount}
        onChange={(e) => handleBmDiscountChange(index, e, Number(item.request_discount))}
        name="bm_discount" 
      />
    ) : (
      item.bm_discount ?? item.request_discount
    ),
    item.category_discount ?? item.request_discount,
    item.remark,
    
    // Hidden product_id - NO onChange needed
    <input 
      key={`product-${index}`}
      type="hidden"
      value={productId}
      name="product_id" 
    />
  ];
});
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
