import { AuthSubmitButton } from "@/components/custom/auth-submit-button";
import { CustomInput } from "@/components/custom/custom-input";
import { useLoginMutation } from "@/redux/services/auth/auth-api";
import { routesPath } from "@/routes/routes-path";
import { consumeReturnTo } from "@/utils/return-to";
import { humanizeAuthError } from "@/utils/auth-errors";
import { loginSchema } from "@/schema/auth";
import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [apiError, setApiError] = useState("");
  // Cleared on animationend, so a second rejection re-triggers the nudge.
  const [rejected, setRejected] = useState(false);
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
          navigate(consumeReturnTo() ?? routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
        })
        .catch((err) => {
          setApiError(
            humanizeAuthError(err, "Invalid credentials. Please try again."),
          );
          setRejected(true);
        });
    },
  });

  return (
    <div
      className={rejected ? "auth-shake" : undefined}
      // animationend bubbles: the strip's own entrance would otherwise cancel
      // the nudge early, so only react to this element's animation.
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setRejected(false);
      }}
    >
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

        <AuthSubmitButton
          label="Login"
          busy={isLoading}
          disabled={!formik.isValid || !formik.dirty}
          status="Connecting to your account"
          slowStatus="Still connecting - the server is slow"
        />
      </form>
    </div>
  );
}
