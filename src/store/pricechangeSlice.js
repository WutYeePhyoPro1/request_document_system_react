import {createSlice,createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";

const API_URL =  `https://dummyjson.com/products?limit=`;

export const fetchPriceChanges = createAsyncThunk( "property/fetchPriceChange", async({page=1}={})=>{
     const token = localStorage.getItem('token');

     const {data} = await axios.get(`/api/price_changes`, {
          headers: {
          Authorization: `Bearer ${token}`,
          },
     });
     console.log(data);

     return data;
});

const picechangeSlice = createSlice({
     name: 'pricechanges',
     initialState:{
          datas:[],
          loading:false,
          error: null,
          filters: {
               form_doc_no: "",
               start_date: "",
               end_date: "",
               search_status: [],
               branch_id: ""
          }
     },
     reducers: {
         setFilter(state,action){
               state.filters = {...state.filters,...action.payload};
         },
         clearFilters(state){
               state.filters = {
                    query: "",
                    city: "all",
                    status: "all",
                    minprice: "",
                    maxprice: ""
               }
         }
     },
     extraReducers: (builder)=>{
            const formatDate = (dateStr) => {
                const d = new Date(dateStr);
                // return `${d.getFullYear()}-${
                //     String(d.getMonth() + 1).padStart(2, '0')
                // }-${String(d.getDate()).padStart(2, '0')} 
                // ${
                //     String(d.getHours()).padStart(2, '0')
                // }:${String(d.getMinutes()).padStart(2, '0')}`

                return `
                    ${d.getFullYear()}
                    -${String(d.getMonth() + 1).padStart(2, '0')}
                    -${String(d.getDate()).padStart(2, '0')}
                `;
            };

          builder
               .addCase(fetchPriceChanges.pending,(state)=>{
                    state.loading =true;
                    state.error = null;
               })
               .addCase(fetchPriceChanges.fulfilled,(state,action)=>{
                    state.loading = false;
                    let result = action.payload.data.data;
                    // state.datas = result;
                    state.datas = result.map(item => ({
                        ...item,
                        created_at: formatDate(item.created_at),
                        date: formatDate(item.date_formatted),
                    }))
                    console.log(action.payload.data.data)
               })
               .addCase(fetchPriceChanges.rejected,(state,action)=>{
                    state.loading = false;
                    state.error = action.error.message || "Failed to load properties";
               })
     }
});

export const {setFilter,clearFilters} = picechangeSlice.actions;
export default picechangeSlice.reducer;

// 