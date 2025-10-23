import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch,  RootState } from "../../store";
import { Checkbox, Input, Table, type TableData } from "@mantine/core";
import Swal from "sweetalert2";
import { setBmDiscount, setCategoryDiscount, setProductIds } from "../../store/approveSlice";
import { randomId, useListState } from "@mantine/hooks";
import { cateCheck } from "../../store/discountSlice";
import { Button } from "@mantine/core";

const RequestDiscountDataDetailTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const detailData = useSelector((state: RootState) => state.discount.detailData); 
  const {formData} = useSelector((state:RootState) => state.approve) ;
 
  
    const initialValues =
  detailData?.discountProduct?.map((item: any) => ({
    id: item.product_id || item.id,
    checked: item.check === "checked" ? true : false,
    key: randomId(),
  })) || [];

  const [values , handlers] = useListState(initialValues);
  const allChecked = values.length > 0 && values.every((v:any) => v.checked) ;
  const indeterminate = values.some((v:any) => v.checked) && !allChecked ;
  const handleCheckAll = (event:React.ChangeEvent<HTMLInputElement>) => {
    handlers.setState(values.map((v:any) => ({...v , checked:event.currentTarget.checked})))
  }
  
  
useEffect(() => {
  if (detailData?.discountProduct) {
    const productIds = detailData.discountProduct.map((item: any) => item.product_id || item.id);
    dispatch(setProductIds(productIds));
    // console.log("Product IDs set:", productIds);
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
const handleCateCheck = async (index: number, e: React.ChangeEvent<HTMLInputElement>, maxDiscount: number) => {
  const checkIds = values.filter((v:any) => v.checked).map((v:any) => v.id);
  let value = parseFloat(e.target.value) ;
  console.log("V>" , value) ;

  if(checkIds.length === 0) {
    Swal.fire("Warning" , "No checkboxes selected!" , "warning");
    return ;
  }
  dispatch(setCategoryDiscount({index , value}));
  try{
    await dispatch(cateCheck(checkIds)).unwrap();
    Swal.fire("Success" , "Checkboxes updated successfully!" , "success");
  }catch(error:any) {
    Swal.fire("Error" , error || "Failed to update checkboxes" , "error");
  }
}



  const Checked = "Checked";
const UnChecked = "UnChecked";
// check box

const element = detailData?.discountProduct?.map((item: any, index: number) => {
  const productId = item.product_id || item.id;
  const checked = values[index]?.checked ?? false;
  return [
    index + 1,
   (detailData?.supervisor === true && detailData?.form?.status === "BM Approved" && item.check == null)
  ? (
    <Checkbox
      key={`check-${index}`}
      checked={checked}
      onChange={(e) =>
        handlers.setItemProp(index, "checked", e.currentTarget.checked)
      }
    />
  )
  : (item.check ? Checked : UnChecked) ,
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
    (detailData?.supervisor === true && detailData?.form?.status === "BM Approved" && item.check == null) ? (
    <Input 
        className="border border-blue-300 rounded w-20" 
        type="number" 
        defaultValue={item.category_discount ?? item.category_discount}
        value={formData.category_discount?.[index] ?? item.category_discount ?? item.category_discount}
        onChange={(e) => handleBmDiscountChange(index, e, Number(item.category_discount))}
        name="category_discount" 
      />) : ( item.category_discount ?? item.request_discount),
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
// console.log(detailData?.supervisor === true && detailData?.form?.status === "BM Approved" && detailData?.checkNullCategroy == true)
const tableData: TableData = {
  head: ['No',(detailData?.supervisor === true && detailData?.form?.status === "BM Approved" && detailData?.checkNullCategroy == true) ?(
    <Checkbox
        key="check-all"
        checked={allChecked}
        indeterminate={indeterminate}
        onChange={handleCheckAll}
        label="Check All"
      />
  ):('Check All')  , 'Category' , 'Product Code' , 'Product Name' , 'Selling Price' , 'Qty' , 'Disc Amt' , 'Net Amt' , 'Disc%' , 'BM Disc%' ,'Cat Head Disc%' , 'Remark' ],
  body: element ?? [], 
};

  
  return (
     <div className="mt-6 overflow-x-auto">
      <Table
        data={tableData}
        styles={{
          thead: { backgroundColor: "#A9D8E9" },
          th: { backgroundColor: "inherit" },
        }}
      />
      {
       detailData?.supervisor === true && detailData?.form?.status === "BM Approved" &&  detailData?.checkNullCategroy == true &&(
          <div className="flex justify-start items-center gap-4 mt-4">
        <Button color="green" onClick={handleCateCheck}>
          Save Checked Items
        </Button>
      </div>
        )
      }

      
    </div>
  );
};

export default RequestDiscountDataDetailTable;
