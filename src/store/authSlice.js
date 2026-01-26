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

      console.log("🔥 REDUX LOGIN API RESPONSE:", response.data);
      console.log("🔥 REDUX USER DATA RECEIVED:", response.data.user);

      // Use the user data directly from API (now includes user_type)
      const enriched = { ...response.data.user };

      console.log("🔥 ENRICHED USER DATA:", enriched);
      console.log("🔥 USER TYPE:", enriched.user_type);
      console.log("🔥 ROLE ID:", enriched.role_id);

      const token = response.data.token;

      // Clear any old cached data first
      console.log("🧹 CLEARING OLD CACHE");
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Save in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(enriched));

      console.log("💾 STORED IN LOCALSTORAGE:", JSON.parse(localStorage.getItem('user')));

      // Return both user and token
      return { user: enriched, token };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { getState }) => {
    const token = getState().auth.token;

    try {
      if (token) {
        await axios.post(
          "/api/logout",
          {},
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );
      }
    } catch (e) {
      // ignore API failure, still logout locally
      console.warn("Logout request failed", e);
    }

    // Always clear local data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("notifications");

    return true;
  }
);
export const loginWithToken = createAsyncThunk(
  "auth/loginWithToken",
  async ({ token }, { rejectWithValue }) => {
    try {
      console.log("🚀 STARTING AUTO-LOGIN");
      const response = await axios.post(
        "/api/auto-login",
        { token },
        { withCredentials: true }
      );

      console.log("🔥 AUTO-LOGIN API RESPONSE:", response.data);
      console.log("🔥 AUTO-LOGIN USER DATA:", response.data.user);

      const user = { ...response.data.user };
      const tokenValue = response.data.token;
       const redirect = response.data.redirect; 

      console.log("🔥 AUTO-LOGIN USER TYPE:", user.user_type);
      console.log("🔥 AUTO-LOGIN ROLE ID:", user.role_id);

      // Clear any old cached data first
      console.log("🧹 CLEARING OLD CACHE (AUTO-LOGIN)");
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      localStorage.setItem("token", tokenValue);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("💾 AUTO-LOGIN STORED IN LOCALSTORAGE:", JSON.parse(localStorage.getItem('user')));

      return { user, token: tokenValue ,redirect };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Auto-login failed");
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
      })
       .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
      }).addCase(loginWithToken.pending, (state) => {
  state.status = "loading";
  state.error = null;
})
.addCase(loginWithToken.fulfilled, (state, action) => {
  state.user = action.payload.user;
  state.token = action.payload.token;
  state.status = "succeeded";
})
.addCase(loginWithToken.rejected, (state, action) => {
  state.status = "failed";
  state.error = action.payload;
});
;
  },
});

export default authSlice.reducer;
