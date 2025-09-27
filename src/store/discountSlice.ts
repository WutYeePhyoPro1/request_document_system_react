// src/store/discountSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { fetchAPi, requestDiscountFetchData } from "../utils/requestDiscountUtil";
import { act } from "react";

interface DiscountState {
  detailData: any;   // you can replace with proper type later
  loading: boolean;
  error: string | null;
  mainData:any;
}

const initialState: DiscountState = {
  detailData: null,
  mainData: null ,
  loading: false,
  error: null,
};

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})
// Fetch detail
export const fetchDetailData = createAsyncThunk<requestDiscountFetchData , fetchAPi >(
    "discount/fetchDetailData" , 
    async({token , id} , {rejectWithValue})=> {
        try {
           const response = await API.get<requestDiscountFetchData>(
        `/request_discount/show/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data; 
        } catch (error:any) {
            console.error("Error fetching request discount Detail data:", error);
      return rejectWithValue(error.response?.data || "Failed to fetch detail");
        }
    }
)
export const fetchRequestDiscountData = createAsyncThunk<requestDiscountFetchData , fetchAPi>(
  "discount/fetchMainData" ,async({token} , {rejectWithValue})=> {
    try{
        const response = await API.get('/request_discount' , {
            headers: {Authorization: `Bearer ${token}`} ,
        });
        //  console.log("ApiData>>" , response.data , response.data.data.length);
        return response.data.data ?? [];
    } catch (error) {
    console.error("Error fetching request discount index data:", error);
    throw error;
  }
  }
)
export const deleteDiscountFile = createAsyncThunk<number , fetchAPi>("discount/deleteFile" , async({token , id} , {rejectWithValue}) => {
  try {
    await API.get(`/request_discount/deleteFile/${id}` , {
      headers: {Authorization: `Bearer ${token}`},
    });
    return id;
  } catch (error:any) {
     console.error("Error deleting file:", error);
      return rejectWithValue(error.response?.data || "Failed to delete file");
  }
})

const discountSlice = createSlice({
  name: "discount" ,
  initialState,
  reducers: {} ,
  extraReducers: (builder) => {
    builder.addCase(fetchDetailData.pending , (state) => {
      state.loading = true ;
      state.error = null ;
    }).addCase(fetchDetailData.fulfilled ,(state , action) => {
      state.loading = false ;
      state.detailData = action.payload;
    }).addCase(fetchDetailData.rejected , (state , action) => {
      state.loading = false ; 
      state.error = action.error.message || "Failed to fetch detail data";
    }).addCase(deleteDiscountFile.fulfilled,(state , action) => {
      if(state.detailData?.files){
        state.detailData.files = state.detailData.files.filter(
          (file:any) => file.id !== action.payload
        );
      }
    }).addCase(fetchRequestDiscountData.fulfilled , (state , action)=> {
      state.loading = false;
      state.mainData = action.payload;
    });
  },
})


export default discountSlice.reducer ;
