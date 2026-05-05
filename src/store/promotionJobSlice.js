import {createSlice,createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";
import {formatDate,formatStrDateTime,formatTo2Decimals,formatLaravelStyleDate} from "../components/Fomatter.jsx";


const API_URL =  `https://dummyjson.com/products?limit=`;

const STORAGE_KEY = "pricechange_visible_columns";

export const fetchPromotionJobs = createAsyncThunk( "property/fetchPriceChange", async({filters,page=1,searchQuery=''}={},{})=>{
     const token = localStorage.getItem('token');

     console.log(filters)
     const {data} = await axios.get(`/api/promotion_jobs`, {
          headers: {
          Authorization: `Bearer ${token}`,
          },
          params: {
               page,
               ...filters,
               searchQuery
          }
     });

     return data;
});

const promotionJobSlice = createSlice({
     name: 'promotionjobs',
     initialState:{
          datas:[],
          loading:false,
          error: null,
          filters: {
               form_doc_no: "",
               start_date: "",
               end_date: "",
               search_status: [],
               branch_id: "",
               category_id: ""
          },
          paginationInfo: null
     },
     reducers: {
          setFilter(state,action){
               state.filters = {...state.filters,...action.payload};
          },
          clearFilters(state){
                    state.filters = {
                         form_doc_no: "",
                         start_date: "",
                         end_date: "",
                         search_status: [],
                         branch_id: "",
                         category_id: ""
                    };
                    state.paginationInfo = null;
          },
          toggleColumn(state, action) {
               const slug = action.payload;
               if (state.visibleColumns.includes(slug)) {
                    state.visibleColumns = state.visibleColumns.filter(c => c !== slug);
               } else {
                    state.visibleColumns.push(slug);
               }

               localStorage.setItem(STORAGE_KEY, JSON.stringify(state.visibleColumns));
          },

          setAllColumns(state, action) {
               state.visibleColumns = action.payload;
               localStorage.setItem(STORAGE_KEY, JSON.stringify(state.visibleColumns));
          },

          clearColumns(state) {
               // state.visibleColumns = [];
               state.visibleColumns = DEFAULT_COLUMNS.filter(c => c.display).map(c => c.slug)
               localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          }
     },
     extraReducers: (builder)=>{
          builder
               .addCase(fetchPromotionJobs.pending,(state)=>{
                    state.loading =true;
                    state.error = null;
               })
               .addCase(fetchPromotionJobs.fulfilled,(state,action)=>{
                    state.loading = false;
                    let result = action.payload.data.data;
                    // state.datas = result;
                    state.datas = result.map(item => ({
                        ...item,
                         created_at: formatLaravelStyleDate(item.created_at,'Y-m-d H:i:s'),
                         run_started_at: formatLaravelStyleDate(item.run_started_at,'Y-m-d H:i:s'),
                    }))
                    console.log(action.payload.data.data)

                    state.paginationInfo = action.payload.data;
               })
               .addCase(fetchPromotionJobs.rejected,(state,action)=>{
                    state.loading = false;
                    state.error = action.error.message || "Failed to load properties";
                    console.log(action.error.message);
               })
     }
});

export const {setFilter,clearFilters,isFiltersEmpty, toggleColumn, setAllColumns, clearColumns} = promotionJobSlice.actions;
export default promotionJobSlice.reducer;

// 