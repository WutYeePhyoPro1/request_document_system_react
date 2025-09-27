import { configureStore } from "@reduxjs/toolkit";
import discountReducer from "./discountSlice" ;
const store = configureStore({
  reducer:{
    discount: discountReducer ,
  },
});

export type RootState = ReturnType<typeof store.getState> ;
export type AppDispatch = typeof store.dispatch ;
export default store ;