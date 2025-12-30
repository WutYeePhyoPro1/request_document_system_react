import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const login = createAsyncThunk(
  "auth/login",
  async ({ employee_number, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "/api/login",
        { employee_number, password },
        {
          withCredentials: true, // Include cookies for Laravel session
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      // Enrich user with user_type if missing
      const enriched = { ...response.data.user };
      if (!enriched.user_type) {
        if (
          enriched.employee_number === "666-666666" ||
          enriched.emp_id === "666-666666"
        ) {
          enriched.user_type = "A2";
        } else if (Number(enriched.role_id) === 3) {
          enriched.user_type = "A1";
        }
      }

      const token = response.data.token;

      // Save in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(enriched));

      // Return both user and token
      return { user: enriched, token };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    status: "idle",
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = "succeeded";
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
