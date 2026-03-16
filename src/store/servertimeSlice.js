import {createSlice,createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";


export const fetchServerTime = createAsyncThunk( "servertime/fetchServerTime", async()=>{
      try{
     const response = await fetch("/api/server-time");

          const data = await response.json();
          // console.log(data);

          return data;
     }catch(err){

     }
});


const furnitureSlice = createSlice({
     name: 'servertime',
     initialState:{
          datas:[],
          loading:false,
          error: null
     },
     extraReducers: (builder)=>{
          builder
               .addCase(fetchServerTime.pending,(state)=>{
                    state.loading =true;
                    state.error = null;
               })
               .addCase(fetchServerTime.fulfilled,(state,action)=>{
                    state.loading = false;
                    state.datas = action.payload;
                    // console.log(action.payload)
               })
               .addCase(fetchServerTime.rejected,(state,action)=>{
                    state.loading = false;
                    state.error = action.error.message;
               })
     }
});

export default furnitureSlice.reducer;
