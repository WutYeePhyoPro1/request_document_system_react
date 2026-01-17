import { configureStore } from "@reduxjs/toolkit";
import { requestDiscountReducer } from "./requestDiscountSlice";

const store = configureStore({
    reducer: {
        requestDiscount:  requestDiscountReducer
    },
});
export type RootState = ReturnType<typeof store.getState> ;
export type AppDispatch = typeof store.dispatch ;
export default store ;