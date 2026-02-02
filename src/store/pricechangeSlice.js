import {createSlice,createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";

const API_URL =  `https://dummyjson.com/products?limit=`;

export const fetchPriceChanges = createAsyncThunk( "property/fetchPriceChange", async({filters,page=1,searchQuery=''}={},{})=>{
     const token = localStorage.getItem('token');

     console.log(filters)
     const {data} = await axios.get(`/api/price_changes`, {
          headers: {
          Authorization: `Bearer ${token}`,
          },
          params: {
               page,
               ...filters,
               searchQuery
          }
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
          },
          isSearchMode: false,
          paginationInfo: null
     },
     reducers: {
         setFilter(state,action){
               state.filters = {...state.filters,...action.payload};
               state.isSearchMode = true;
         },
         clearFilters(state){
               state.filters = {
                    form_doc_no: "",
                    start_date: "",
                    end_date: "",
                    search_status: [],
                    branch_id: ""
               };
               state.isSearchMode = false;
               state.paginationInfo = null;
         },
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

                    state.paginationInfo = action.payload.data;
               })
               .addCase(fetchPriceChanges.rejected,(state,action)=>{
                    state.loading = false;
                    state.error = action.error.message || "Failed to load properties";
                    console.log(action.error.message);
               })
     }
});

export const {setFilter,clearFilters,isFiltersEmpty} = picechangeSlice.actions;
export default picechangeSlice.reducer;

// 