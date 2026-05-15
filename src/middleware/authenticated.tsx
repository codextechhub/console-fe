import { selectUser } from "@/redux/features/auth/authSlice";
import { useGetMeQuery } from "@/redux/services/auth/authApi";
import { routesPath } from "@/routes/routesPath";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router";

const { LOGIN } = routesPath.AUTH;

export default function Authenticated() {
  const navigate = useNavigate();
  const accessToken = Cookies.get("token");
  const user = useSelector(selectUser);

  const isValidToken = !!accessToken && accessToken !== "undefined";

  // Sync permissions on mount — catches role changes that happened while the
  // token was still valid. onQueryStarted in getMe dispatches updatePermissions.
  useGetMeQuery(undefined, { skip: !isValidToken });

  useEffect(() => {
    if (!isValidToken) {
      navigate(LOGIN, { replace: true });
    }
  }, [isValidToken]);

  useEffect(() => {
    document.title = user?.first_name
      ? `${user.first_name} - Intranet`
      : "CX - Intranet";
  }, [user?.first_name]);

  if (!isValidToken) return null;

  return <Outlet />;
}
