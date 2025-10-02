// store/approveSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';


export interface ApproveState {
  formData: {
    status?: string;
    comment?: string;
    bm_discount?: number[];
    product_id?: number[];
  };
}

const initialState: ApproveState = {
  formData: {
    bm_discount: [],
    product_id: [] ,
    status: "" ,
    comment: "" ,
  }
};

export const approveSlice = createSlice({
  name: 'approve',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<string>) => {
      state.formData.status = action.payload;
    },
    setComment: (state, action: PayloadAction<string>) => {
      state.formData.comment = action.payload;
    },
    setBmDiscount: (state, action: PayloadAction<{index: number; value: number}>) => {
      if (!state.formData.bm_discount) {
        state.formData.bm_discount = [];
      }
      state.formData.bm_discount[action.payload.index] = action.payload.value;
    },
    setProductIds: (state, action: PayloadAction<number[]>) => {
      state.formData.product_id = action.payload;
    },
    resetApproveData: (state) => {
      state.formData = initialState.formData;
    }
  }
});

export const { setStatus, setComment, setBmDiscount, setProductIds, resetApproveData } = approveSlice.actions;
export default approveSlice.reducer;