import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { useLoginMutation } from "@/redux/services/auth/authApi";
import { routesPath } from "@/routes/routesPath";
import { loginSchema } from "@/schema/auth";
import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [apiError, setApiError] = useState("");
  // Read once at mount (lazy initialiser); the effect only clears the flag so
  // a later manual visit to /login doesn't re-show a stale banner.
  const [sessionBanner] = useState(() => sessionStorage.getItem("_auth_banner") ?? "");

  useEffect(() => {
    sessionStorage.removeItem("_auth_banner");
  }, []);

  const formik = useFormik({
    initialValues: {
      password: "",
      email: "",
    },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      setApiError("");
      login(values)
        .unwrap()
        .then(() => {
          navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
        })
        .catch((err) => {
          const msg =
            err?.data?.message ||
            err?.data?.error?.detail ||
            "Invalid credentials. Please try again.";
          setApiError(typeof msg === "string" ? msg : "Invalid credentials. Please try again.");
        });
    },
  });

  return (
    <div className="">
      {sessionBanner && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
          {sessionBanner}
        </div>
      )}
      <div className="text-center space-y-1.5">
        <h4 className="font-semibold text-2xl text-black-01">
          Login to your Account
        </h4>
        <p className="text-sm font-medium text-gray-01 font-mont">
          Sign in to access the admin console.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="mt-4 space-y-4">
        <CustomInput
          label="Email"
          id="email"
          placeholder="Enter your email"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
          {...formik.getFieldProps("email")}
          onChange={(e) => { setApiError(""); formik.handleChange(e); }}
          error={formik.touched.email ? formik.errors.email : ""}
        />
        <CustomInput
          label="Password"
          id="password"
          type="password"
          placeholder="Enter your password"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
          {...formik.getFieldProps("password")}
          onChange={(e) => { setApiError(""); formik.handleChange(e); }}
          error={formik.touched.password ? formik.errors.password : ""}
        />

        <div className="text-end">
          <Link
            to={routesPath.AUTH.FORGOT_PASSWORD}
            className="text-primary font-mont text-sm font-medium capitalize"
          >
            Forgot password
          </Link>
        </div>

        {apiError && (
          <p className="text-xs font-medium text-destructive/70 -mt-1">{apiError}</p>
        )}

        <Button
          disabled={!formik.isValid || !formik.dirty || isLoading}
          loading={isLoading}
          type="submit"
          className="w-full h-11"
        >
          Login
        </Button>
      </form>
    </div>
  );
}
