import { configureStore } from "@reduxjs/toolkit";
import discountReducer from "./discountSlice" ;
import approveReducer from "./approveSlice" ;
import authReducer from "./authSlice";

const store = configureStore({
  reducer:{
     auth: authReducer,
    discount: discountReducer ,
    approve: approveReducer ,
  },
});

export type RootState = ReturnType<typeof store.getState> ;
export type AppDispatch = typeof store.dispatch ;
export default store ;