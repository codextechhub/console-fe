import { combineReducers } from "@reduxjs/toolkit";
import { authSliceReducer } from "./auth/auth-slice";
import { entitySliceReducer } from "./finance/entity-slice";
import { baseApi } from "../services/base-api";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSliceReducer,
  financeEntity: entitySliceReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
