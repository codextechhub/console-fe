import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import {
  useActivationPreviewQuery,
  useActivateAccountMutation,
} from "@/redux/services/auth/authApi";
import { setAuthUser } from "@/redux/features/auth/authSlice";
import { routesPath } from "@/routes/routesPath";
import { resetPasswordSchema } from "@/schema/auth";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { swipAnimateVariant } from "@/utils/animation";
import { useFormik } from "formik";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";

export default function ActivateAccount() {
  const { activation_key } = useParams<{ activation_key: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [success, setSuccess] = useState(false);

  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
  } = useActivationPreviewQuery(activation_key!, { skip: !activation_key });

  const [activateAccount, { isLoading: activating }] =
    useActivateAccountMutation();

  const formik = useFormik({
    initialValues: { password: "", confirm_password: "" },
    validationSchema: resetPasswordSchema,
    onSubmit: (values) => {
      activateAccount({ activation_key: activation_key!, ...values })
        .unwrap()
        .then((res) => {
          Cookies.set("token", res.data.access || "");
          Cookies.set("refresh_token", res.data.refresh || "");
          dispatch(setAuthUser(res.data));
          setSuccess(true);
        })
        .catch(() => {});
    },
  });

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => {
        navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  if (previewLoading) {
    return (
      <div className="text-center space-y-1.5">
        <p className="text-sm font-medium text-gray-01 font-mont">
          Verifying your invite link…
        </p>
      </div>
    );
  }

  if (previewError || !preview?.data) {
    return (
      <div className="text-center space-y-4">
        <h4 className="font-semibold text-2xl text-black-01">Link Expired</h4>
        <p className="text-sm font-medium text-gray-01 font-mont max-w-72 mx-auto">
          This invite link is invalid or has expired. Please contact your
          administrator for a new one.
        </p>
        <Link to={routesPath.AUTH.LOGIN} className="block mt-4">
          <Button variant="outline" className="w-full h-11">
            Back to Log In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" custom={1}>
      <motion.div
        key={success ? "success" : "form"}
        custom={1}
        variants={swipAnimateVariant}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
      >
        {!success ? (
          <form onSubmit={formik.handleSubmit}>
            <div className="text-center space-y-1.5">
              <h4 className="font-semibold text-2xl text-black-01">
                Set Your Password
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-84.5 mx-auto">
                Welcome! Set a password to activate your account and get
                started.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <CustomInput
                label="Name"
                id="full_name"
                value={preview.data.full_name}
                readOnly
                className="bg-gray-03 h-11 text-gray-01"
              />
              <CustomInput
                label="Email"
                id="email"
                value={preview.data.email}
                readOnly
                className="bg-gray-03 h-11 text-gray-01"
              />
            </div>

            <div className="mt-4 mb-9 space-y-4">
              <CustomInput
                label="Password"
                id="password"
                type="password"
                placeholder="Enter your password"
                className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
                {...formik.getFieldProps("password")}
                error={formik.touched.password ? formik.errors.password : ""}
              />
              <CustomInput
                label="Confirm Password"
                id="confirm_password"
                type="password"
                placeholder="Re-enter your password"
                className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
                {...formik.getFieldProps("confirm_password")}
                error={
                  formik.touched.confirm_password
                    ? formik.errors.confirm_password
                    : ""
                }
              />
            </div>

            <Button
              disabled={!formik.isValid || !formik.dirty || activating}
              loading={activating}
              type="submit"
              className="w-full h-11"
            >
              Activate Account
            </Button>

            <div className="text-center">
              <Link
                to={routesPath.AUTH.LOGIN}
                className="font-mont font-medium text-sm text-black-01 inline-flex justify-center items-center mt-6 group"
              >
                <figure className="size-fit mr-1.5 group-hover:-translate-x-1 ease-linear transition-all">
                  {svgIcons.arrowLeft}
                </figure>
                Back to Log In
              </Link>
            </div>
          </form>
        ) : (
          <div>
            <div className="text-center space-y-1.5">
              <h4 className="font-semibold text-2xl text-black-01">
                Account Activated!
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-75.5 mx-auto">
                Your account has been successfully activated. Redirecting you
                to the dashboard…
              </p>
            </div>

            <Button
              className="w-full h-11 mt-9"
              onClick={() =>
                navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true })
              }
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
