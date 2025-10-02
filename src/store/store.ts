import { configureStore } from "@reduxjs/toolkit";
import discountReducer from "./discountSlice" ;
import approveReducer from "./approveSlice" ;
const store = configureStore({
  reducer:{
    discount: discountReducer ,
    approve: approveReducer ,
  },
});

export type RootState = ReturnType<typeof store.getState> ;
export type AppDispatch = typeof store.dispatch ;
export default store ;