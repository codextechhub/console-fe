import type { RootStateType } from "@/redux/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { type Auth } from "./type";

const initialState: Auth = {
   access: "",
   refresh: "",
   session_id: 0,
   user: null,
   permissions: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: () => initialState,
    setAuthUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload.user;
      state.access = action.payload.access;
      state.refresh = action.payload.refresh || "";
      state.session_id = action.payload.session_id || 0;
      state.permissions = action.payload.permissions ?? [];
    },
    updateAuthUser: (state, action: PayloadAction<any>) => {
      state.user = { ...state.user, ...action.payload };
    },
    setToken: (state, action: PayloadAction<any>) => {
      state.access = action.payload;
    },
    updatePermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
    },
  },
});

export const { setAuthUser, setToken, updateAuthUser, updatePermissions } = authSlice.actions;
export const resetAuth = authSlice.actions.reset;

export const authSliceReducer = authSlice.reducer;

export const selectUser = (state: RootStateType) => state.auth.user;
export const selectPermissions = (state: RootStateType) => state.auth.permissions ?? [];
