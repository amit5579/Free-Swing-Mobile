import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: null as number | null,
  token: null as string | null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setUser: (state, action) => {
      state.userId = action.payload.userId;
      state.token = action.payload.token;
    },

    clearUser: (state) => {
      state.userId = null;
      state.token = null;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;