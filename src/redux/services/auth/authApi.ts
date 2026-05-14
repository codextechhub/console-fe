import { resetAuth, setAuthUser } from "@/redux/features/auth/authSlice";
import Cookies from "js-cookie";
import { baseApi } from "../baseApi";
import { routesPath } from "@/routes/routesPath";
import type { LoginResponse } from "./type";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (user) => ({
        url: `/user/auth/login/`,
        method: "POST",
        body: user,
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          const {data} = result;
          Cookies.set("token", data?.data?.access || "");
          Cookies.set("refresh_token", data?.data?.refresh || "");
          dispatch(setAuthUser(data?.data));
        } catch {}
      },
    }),
    logout: builder.mutation({
      query: (token) => ({
        url: `/user/auth/logout/`,
        method: "POST",
         body: token,
        credentials: "include" as const
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
            await queryFulfilled;
          Cookies.remove("token");
          Cookies.remove("refresh_token");
          window.location.href = routesPath.AUTH.LOGIN;
          dispatch(resetAuth());
        } catch  { 
        }
      },
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (payload) => ({
        url: `/user/auth/password/reset/request/`,
        method: "POST",
        body: payload,
      }),
    }),
    passwordResetPreview: builder.query<{ message: string; data: { email: string; full_name: string } }, string>({
      query: (activation_key) => ({
        url: `/user/auth/reset-password/${activation_key}/preview/`,
        method: "GET",
      }),
    }),
    passwordResetConfirm: builder.mutation<{ message: string }, { activation_key: string; password: string; confirm_password: string }>({
      query: ({ activation_key, ...body }) => ({
        url: `/user/auth/password/reset/${activation_key}/confirm/`,
        method: "POST",
        body,
      }),
    }),
    activationPreview: builder.query<{ message: string; data: { email: string; full_name: string } }, string>({
      query: (activation_key) => ({
        url: `/user/auth/activate/${activation_key}/preview/`,
        method: "GET",
      }),
    }),
    activateAccount: builder.mutation<LoginResponse, { activation_key: string; password: string; confirm_password: string }>({
      query: ({ activation_key, ...body }) => ({
        url: `/user/auth/activate/${activation_key}/`,
        method: "POST",
        body,
      }),
    }),
    specialLoginPreview: builder.query<{ message: string; data: { full_name: string } }, string>({
      query: (email) => ({
        url: `/user/auth/special_login/preview/?email=${encodeURIComponent(email)}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  usePasswordResetPreviewQuery,
  usePasswordResetConfirmMutation,
  useActivationPreviewQuery,
  useActivateAccountMutation,
  useSpecialLoginPreviewQuery,
} = authApi;
