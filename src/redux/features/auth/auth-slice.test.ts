/**
 * The Field Access map travels with the permission set.
 *
 * Every writer that sets `permissions` sets `field_access` from the same
 * response, so the two always describe the same person: the actor, or the
 * proxied target while impersonating. A missing map reads as the one shared
 * empty map, which keeps `usePermissions().fieldAccess` referentially stable.
 */
import { describe, expect, it } from "vitest";
import {
  authSliceReducer,
  selectFieldAccess,
  setAuthContext,
  setAuthUser,
  updatePermissions,
} from "./auth-slice";
import type { Auth, AuthContextSnapshot } from "./auth-types";
import type { RootStateType } from "@/redux/store";

const STOREKEEPER = { "platform.staff_profile": { hidden: ["account_number"] } };
const TARGET = { "platform.team": { hidden: ["last_login_at"], read_only: [] } };

const read = (auth: Auth) => selectFieldAccess({ auth } as unknown as RootStateType);
const initial = () => authSliceReducer(undefined, { type: "init" });

describe("auth slice field access", () => {
  it("stores the map a login carries, exactly as received", () => {
    const state = authSliceReducer(initial(), setAuthUser({ user: null, permissions: [], field_access: STOREKEEPER }));
    expect(read(state)).toEqual(STOREKEEPER);
  });

  it("reads an absent map as the same empty object every time", () => {
    const state = authSliceReducer(initial(), setAuthUser({ user: null, permissions: [] }));
    expect(read(state)).toEqual({});
    expect(read(state)).toBe(read(initial()));
    expect(read({})).toBe(read(initial()));
  });

  it("swaps to the target's map while proxying and back to the actor's afterwards", () => {
    const actor: AuthContextSnapshot = {
      user: null, school: null, tenant: null, permissions: ["platform.team.view"], field_access: STOREKEEPER,
    };
    const signedIn = authSliceReducer(initial(), setAuthContext(actor));
    const proxying = authSliceReducer(signedIn, setAuthContext({ ...actor, permissions: [], field_access: TARGET }));
    expect(read(proxying)).toEqual(TARGET);

    const restored = authSliceReducer(proxying, setAuthContext(actor));
    expect(read(restored)).toEqual(STOREKEEPER);
  });

  it("refreshes the map with the permission set", () => {
    const state = authSliceReducer(initial(), updatePermissions({ permissions: ["a.b.view"], field_access: TARGET }));
    expect(state.permissions).toEqual(["a.b.view"]);
    expect(read(state)).toEqual(TARGET);
  });
});
