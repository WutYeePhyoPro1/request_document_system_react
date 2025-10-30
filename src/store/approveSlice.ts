// store/approveSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { InvoiceFile } from '../utils/requestDiscountUtil/create';
import axios from 'axios';


export interface ApproveState {
  formData: {
    status?: string;
    comment?: string;
    bm_discount?: number[];
    product_id?: number[];
    category_discount? : number [] ;
    check?: string[];
  };
}

const initialState: ApproveState = {
  formData: {
    bm_discount: [],
    product_id: [] ,
    status: "" ,
    comment: "" ,
    check : [] ,
  }
};

const API = axios.create({
  baseURL : "/api" ,
  withCredentials : true ,
})

export const branchUpload = createAsyncThunk('/request_discount/upload-branch-account' , async({generalFormId , formDocNo , files} : {generalFormId:number , formDocNo:string , files:File[]} , {rejectWithValue}) => {
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData() ;
    formData.append("general_form_id" , generalFormId.toString()) ;
    formData.append("form_doc_no" , formDocNo) ;
    files.forEach((file) => formData.append("file[]" , file)) ;
    const response = await API.post(`/request_discount/upload-branch-account/` , formData , {
      headers:{
        Authorization: `Bearer ${token}` ,
        'Content-Type' : 'multipart/form-data' ,
      },
    });
    return response.data ;
  } catch (error:any) {
    console.error("Error upload branch account:" , error);
    return rejectWithValue(error.response?.data || "Failed tp approve form") ;  
  }
})
export const deleteAccountFile = createAsyncThunk('/request_discount/deleteAccountFile' , async({token , id} : {token:string , id:number} , {rejectWithValue}) => {
  try {
    await API.get(`request_discount/deleteAccountFile/${id}` , {
      headers: {Authorization: `Bearer ${token}`} ,
    });
    return id;
  } catch (error:any) {
    console.error("Error deleting file:" , error) ;
    return rejectWithValue(error.response?.data || "Failed to delete file") ;
  }
}) ;

export const approveSlice = createSlice({
  name: 'approve',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<string>) => {
      state.formData.status = action.payload;
    },
    setComment: (state, action: PayloadAction<string>) => {
      state.formData.comment = action.payload;
    },
    setBmDiscount: (state, action: PayloadAction<{index: number; value: number}>) => {
      if (!state.formData.bm_discount) {
        state.formData.bm_discount = [];
      }
      state.formData.bm_discount[action.payload.index] = action.payload.value;
    },
    setCateCheck: (
  state,
  action: PayloadAction<{ index: number; value: number; checkStatus: string }>
) => {
  const { index, value, checkStatus } = action.payload;

  if (!state.formData.category_discount) {
    state.formData.category_discount = [];
  }
  if (!state.formData.check) {
    state.formData.check = [];
  }

  state.formData.category_discount[index] = value;
  state.formData.check[index] = checkStatus;
},

    setProductIds: (state, action: PayloadAction<number[]>) => {
      state.formData.product_id = action.payload;
    },
    setCheck:(state , action: PayloadAction<string[]>) => {
      state.formData.check = action.payload ;
    } ,
    resetApproveData: (state) => {
      state.formData = initialState.formData;
    }
  } ,
  extraReducers: (builder) => {
    builder
    .addCase(branchUpload.pending, (state) => {
      state.loading = true;
    })
    .addCase(branchUpload.fulfilled, (state) => {
      state.loading = false;
    })
    .addCase(branchUpload.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  }
});

export const { setStatus, setComment, setBmDiscount, setProductIds, resetApproveData , setCateCheck , setCheck } = approveSlice.actions;
export default approveSlice.reducer;