import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { Checkbox, Input, Table, type TableData } from "@mantine/core";
import Swal from "sweetalert2";
import {
  setBmDiscount,
  setCateCheck,
  setProductIds,
} from "../../store/approveSlice";
import { randomId, useListState } from "@mantine/hooks";
// import { cateCheck } from "../../store/discountSlice";
import { Button } from "@mantine/core";
import type { CheckValueItem } from "../../utils/requestDiscountUtil/detail";
import StatusBadge from "../../components/ui/StatusBadge";

const RequestDiscountDataDetailTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const detailData = useSelector(
    (state: RootState) => state.discount.detailData
  );
  const { formData } = useSelector((state: RootState) => state.approve);

  const initialValues =
    detailData?.discountProduct?.map((item: any) => ({
      id: item.product_id || item.id,
      checked: item.check === "checked" ? true : false,
      key: randomId(),
    })) || [];

  const [values, handlers] = useListState(initialValues);
  const allChecked = values.length > 0 && values.every((v: any) => v.checked);
  const indeterminate = values.some((v: any) => v.checked) && !allChecked;
  const handleCheckAll = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.currentTarget.checked;
    handlers.setState(values.map((v: any) => ({ ...v, checked: isChecked })));

    if (detailData?.discountProduct) {
      detailData.discountProduct.forEach((item: any, index: number) => {
        const value =
          formData.category_discount?.[index] ??
          item.category_discount ??
          item.request_discount ??
          0;

        dispatch(
          setCateCheck({
            index,
            value,
            checkStatus: isChecked ? "checked" : null,
          })
        );
      });
    }
  };

  useEffect(() => {
    if (detailData?.discountProduct) {
      const productIds = detailData.discountProduct.map(
        (item: any) => item.product_id || item.id
      );
      dispatch(setProductIds(productIds));
    }
  }, [detailData?.discountProduct, dispatch]);

  const handleBmDiscountChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
    maxDiscount: number
  ) => {
    let value = parseFloat(e.target.value);

    if (value > Number(maxDiscount)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid BM Discount",
        text: `BM Discount must be smaller than the Request Discount (${Number(
          maxDiscount
        )}) value.`,
      });
      value = Number(maxDiscount);
    }

    dispatch(setBmDiscount({ index, value }));
  };

  const handleCateCheck = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
    maxDiscount: number,
    checkStatus: string
  ) => {
    let value = parseFloat(e.target.value);

    if (value > Number(maxDiscount)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Category Discount",
        text: `Category Discount must be smaller than Request Discount (${Number(
          maxDiscount
        )}).`,
      });
      value = Number(maxDiscount);
    }

    dispatch(setCateCheck({ index, value, checkStatus }));
  };

  const Checked = "Checked";
  const UnChecked = "UnChecked";
console.log("HElloCheck" , Checked) ;
  const element = detailData?.discountProduct?.map(
    (item: any, index: number) => {
      const productId = item.product_id || item.id;
      const checked = values[index]?.checked ?? false;
      return [
        index + 1,
        detailData?.supervisor === true &&
        detailData?.form?.status === "BM Approved" &&
        item.check == null ? (
          <Checkbox
            key={`check-${index}`}
            checked={checked}
            onChange={(e) => {
              const isChecked = e.currentTarget.checked;
              const value =
                formData.category_discount?.[index] ?? item.category_discount;
              const checkStatus = isChecked ? "checked" : null;
              handlers.setItemProp(index, "checked", isChecked);
              dispatch(
                setCateCheck({
                  index,
                  value: value ?? 0, // ensure not null
                  checkStatus,
                })
              );
            }}
          />
        ) : item.check ? (
          <StatusBadge status={Checked} />
          
        ) : (
         <StatusBadge status={UnChecked} />
        ),
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
            // defaultValue={item.bm_discount ?? item.request_discount}
            value={
              formData.bm_discount?.[index] ??
              item.bm_discount ??
              item.request_discount
            }
            onChange={(e) =>
              handleBmDiscountChange(index, e, Number(item.request_discount))
            }
            name="bm_discount"
          />
        ) : (
          item.bm_discount ?? item.request_discount
        ),
        detailData?.supervisor === true &&
        detailData?.form?.status === "BM Approved" &&
        item.check == null ? (
          <Input
            className="border border-blue-300 rounded w-20"
            type="number"
            // defaultValue={item.category_discount ?? item.bm_discount}
            value={
              formData.category_discount?.[index] ??
              item.category_discount ??
              item.bm_discount
            }
            onChange={(e) =>
              handleCateCheck(
                index,
                e,
                Number(item.bm_discount),
                values[index]?.checked ? "checked" : "null"
              )
            }
            name="category_discount"
          />
        ) : (
          item.category_discount ?? item.request_discount
        ),
        item.remark,

        // Hidden product_id - NO onChange needed
        <input
          key={`product-${index}`}
          type="hidden"
          value={productId}
          name="product_id"
        />,
      ];
    }
  );
  // console.log(detailData?.supervisor === true && detailData?.form?.status === "BM Approved" && detailData?.checkNullCategroy == true)
  const tableData: TableData = {
    head: [
      "No",
      detailData?.supervisor === true &&
      detailData?.form?.status === "BM Approved" &&
      detailData?.checkNullCategroy == true ? (
        <Checkbox
          key="check-all"
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={handleCheckAll}
          label="Check All"
        />
      ) : (
        "Check All"
      ),
      "Category",
      "Product Code",
      "Product Name",
      "Selling Price",
      "Qty",
      "Disc Amt",
      "Net Amt",
      "Disc%",
      "BM Disc%",
      "Cat Head Disc%",
      "Remark",
    ],
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
    </div>
  );
};

export default RequestDiscountDataDetailTable;
