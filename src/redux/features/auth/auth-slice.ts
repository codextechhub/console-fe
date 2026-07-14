import type { RootStateType } from "@/redux/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  type ActiveImpersonation,
  type Auth,
  type AuthSchool,
  type AuthTenant,
  type User,
} from "./auth-types";

// Shape of the login / activation response's `data` envelope.
interface AuthPayload {
  user: User | null;
  school?: AuthSchool | null;
  tenant?: AuthTenant | null;
  access: string;
  refresh?: string;
  session_id?: number;
  permissions?: string[];
}

const initialState: Auth = {
   access: "",
   refresh: "",
   session_id: 0,
   user: null,
   school: null,
   tenant: null,
   impersonation: null,
   permissions: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: () => initialState,
    setAuthUser: (state, action: PayloadAction<AuthPayload>) => {
      state.user = action.payload.user;
      state.school = action.payload.school ?? null;
      state.tenant = action.payload.tenant ?? null;
      state.access = action.payload.access;
      state.refresh = action.payload.refresh || "";
      state.session_id = action.payload.session_id || 0;
      state.permissions = action.payload.permissions ?? [];
    },
    updateAuthUser: (state, action: PayloadAction<Partial<User>>) => {
      state.user = { ...(state.user as User), ...action.payload };
    },
    updateSchool: (state, action: PayloadAction<AuthSchool | null>) => {
      state.school = action.payload;
    },
    updateTenant: (state, action: PayloadAction<AuthTenant | null>) => {
      state.tenant = action.payload;
    },
    setImpersonation: (state, action: PayloadAction<ActiveImpersonation | null>) => {
      state.impersonation = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.access = action.payload;
    },
    updatePermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
    },
  },
});

export const {
  setAuthUser,
  setToken,
  updateAuthUser,
  updateSchool,
  updateTenant,
  setImpersonation,
  updatePermissions,
} = authSlice.actions;
export const resetAuth = authSlice.actions.reset;

export const authSliceReducer = authSlice.reducer;

export const selectUser = (state: RootStateType) => state.auth.user;
export const selectSchool = (state: RootStateType) => state.auth.school ?? null;
export const selectTenant = (state: RootStateType) => state.auth.tenant ?? null;
export const selectImpersonation = (state: RootStateType) => state.auth.impersonation ?? null;
export const selectPermissions = (state: RootStateType) => state.auth.permissions ?? [];
