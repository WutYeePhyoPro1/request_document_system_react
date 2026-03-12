import { configureStore } from "@reduxjs/toolkit";
import discountReducer from "./discountSlice" ;
import approveReducer from "./approveSlice" ;
import authReducer from "./authSlice";
import pricechangeReducer from "./pricechangeSlice";
import servertimeSlice from "./servertimeSlice";


const store = configureStore({
  reducer:{
      auth: authReducer,
      discount: discountReducer ,
      approve: approveReducer ,
      pricechanges: pricechangeReducer,
      servertime: servertimeSlice,
  },
});

export type RootState = ReturnType<typeof store.getState> ;
export type AppDispatch = typeof store.dispatch ;
export default store ;