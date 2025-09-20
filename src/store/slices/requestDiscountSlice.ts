import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDetailData } from "../../api/requestDiscount/requestDiscountData";
import { act } from "react";

interface DiscountState {
    loading: boolean ;
    detailData : any | null ;
    error: string | null ;
}
const initialState: DiscountState = {
    loading: false ,
    detailData : null ,
    error: null ,

};
 export const fetchRequestDiscountDetails = createAsyncThunk(
    "requestDiscount/fetchDetails" , 
    async(id:number , {rejectWithValue}) => {
        try {
            const token = localStorage.getItem("token") ;
            if(!token) throw new Error("No token found") ;
            return await getDetailData(token , id);
        } catch (err:any) {
            return rejectWithValue(err.message);
        }
    }
 )

 const requestDiscountSlice = createSlice({
    name: "requestDiscount" ,
    initialState ,
    reducers : {
        clearRequestDiscount : (state) => {
            state.detailData = null ;
            state.error = null ;
    },
 } ,

extraReducers: (builder) => {
    builder.addCase(fetchRequestDiscountDetails.pending , (state) => {
        state.loading = true ;
        state.error = null ;
    }).addCase(fetchRequestDiscountDetails.fulfilled, (state , action) => {
        state.loading = true ;
        state.error = null ;
    }).addCase(fetchRequestDiscountDetails.rejected , (state , action) => {
        state.loading = false ;
        state.error = action.payload as string ;
    });
},
}) ;
export const {clearRequestDiscount} = requestDiscountSlice.actions ;
export default requestDiscountSlice.reducer ;