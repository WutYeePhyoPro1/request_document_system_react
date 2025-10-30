// src/store/discountSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type {
  ApproveFormData,
   fetchAPi,
   requestDiscountFetchData,
} from "../utils/requestDiscountUtil";
import { act } from "react";
// import ApproveForm from "../pages/requestDiscount/approveForm";

interface DiscountState {
  detailData: any; 
  loading: boolean;
  error: string | null;
  mainData: any;
}

const initialState: DiscountState = {
  detailData: null,
  mainData: null,
  loading: false,
  error: null,
};

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Fetch detail
export const fetchDetailData = createAsyncThunk<
  requestDiscountFetchData,
  fetchAPi
>("discount/fetchDetailData", async ({ token, id }, { rejectWithValue }) => {
  try {
    const response = await API.get<requestDiscountFetchData>(
      `/request_discount/show/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching request discount Detail data:", error);
    return rejectWithValue(error.response?.data || "Failed to fetch detail");
  }
});
export const fetchRequestDiscountData = createAsyncThunk<
  requestDiscountFetchData,
  fetchAPi
>("discount/fetchMainData", async ({ token }, { rejectWithValue }) => {
  try {
    const response = await API.get("/request_discount", {
      headers: { Authorization: `Bearer ${token}` },
    });
    //  console.log("ApiData>>" , response.data , response.data.data.length);
    return response.data.data ?? [];
  } catch (error) {
    console.error("Error fetching request discount index data:", error);
    throw error;
  }
});
export const deleteDiscountFile = createAsyncThunk<number, fetchAPi>(
  "discount/deleteFile",
  async ({ token, id }, { rejectWithValue }) => {
    try {
      await API.get(`/request_discount/deleteFile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (error: any) {
      console.error("Error deleting file:", error);
      return rejectWithValue(error.response?.data || "Failed to delete file");
    }
  }
);


 export const discountApproveForm = createAsyncThunk<ApproveFormData , {formId:number ; data:ApproveFormData} >('discount/approveForm' , async({formId , data} , {rejectWithValue}) => {
  try {
    const token = localStorage.getItem("token");
    const response = await API.post<ApproveFormData>(`/request_discount/approve/${formId}`,data , {
      headers:{
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data ;
  } catch (error:any) {
    console.error("Error approving form:", error);
    return rejectWithValue(error.response?.data || "Failed to approve form");
  }
 })

const discountSlice = createSlice({
  name: "discount",
  initialState,
 reducers: {
    setDetailData: (state, action) => {
      state.detailData = action.payload;
    },
    updateDetailData: (state, action) => {
      // ✅ Update all properties in detailData dynamically
      state.detailData = {
        ...state.detailData,
        ...action.payload, // merges all fields (form, reqAcknowledge, etc.)
      };
    },
    updateDiscountCheck: (state, action) => {
    const { updatedProducts } = action.payload;
    updatedProducts.forEach((updated) => {
      const target = state.detailData.discountProduct.find(
        (item) => item.product_id === updated.product_id
      );
      if (target) {
        target.check = updated.check;
        target.category_discount = updated.category_discount;
      }
    });
  },
  },
    
  extraReducers: (builder) => {
    builder
      .addCase(fetchDetailData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDetailData.fulfilled, (state, action) => {
        state.loading = false;
        state.detailData = action.payload;
      })
      .addCase(fetchDetailData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch detail data";
      })
      .addCase(deleteDiscountFile.fulfilled, (state, action) => {
        if (state.detailData?.files) {
          state.detailData.files = state.detailData.files.filter(
            (file: any) => file.id !== action.payload
          );
        }
      })
      .addCase(fetchRequestDiscountData.fulfilled, (state, action) => {
        state.loading = false;
        state.mainData = action.payload;
      }).addCase(discountApproveForm.fulfilled , (state , action) => {
        state.loading = false ;
        state.detailData = {
          ...state.detailData ,
          form: {
            ...state.detailData.form ,
            ...action.payload
          }
        };
      })
;
  },
});
export const { setDetailData, updateDetailData } = discountSlice.actions;
export default discountSlice.reducer;
