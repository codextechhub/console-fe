import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import {
  usePasswordResetConfirmMutation,
  usePasswordResetPreviewQuery,
} from "@/redux/services/auth/auth-api";
import { routesPath } from "@/routes/routes-path";
import { resetPasswordSchema } from "@/schema/auth";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { swipAnimateVariant } from "@/utils/animation";
import { humanizeAuthError } from "@/utils/auth-errors";
import { useFormik } from "formik";
import { toast } from "sonner";

export default function ResetPassword() {
  const { activation_key } = useParams<{ activation_key: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const { data: preview, isLoading: previewLoading, isError: previewError } =
    usePasswordResetPreviewQuery(activation_key!, { skip: !activation_key });

  const [passwordResetConfirm, { isLoading: confirmLoading }] =
    usePasswordResetConfirmMutation();

  const formik = useFormik({
    initialValues: { password: "", confirm_password: "" },
    validationSchema: resetPasswordSchema,
    onSubmit: (values) => {
      passwordResetConfirm({ activation_key: activation_key!, ...values })
        .unwrap()
        .then(() => setSuccess(true))
        .catch((err) => {
          // The 400/422 interceptor toast is silenced on auth routes, so this
          // catch must surface its own feedback or the confirm failure would be
          // silently swallowed.
          toast.error(
            humanizeAuthError(
              err,
              "Couldn't reset your password. Please try again.",
            ),
          );
        });
    },
  });

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => {
        navigate(routesPath.AUTH.LOGIN, { replace: true });
      }, 7000);
      return () => clearTimeout(t);
    }
  }, [success, navigate]);

  if (previewLoading) {
    return (
      <div className="text-center space-y-1.5">
        <p className="text-sm font-medium text-gray-01 font-mont">
          Verifying your reset link…
        </p>
      </div>
    );
  }

  if (previewError || !preview?.data) {
    return (
      <div className="text-center space-y-4">
        <h4 className="font-semibold text-2xl text-black-01">Link Expired</h4>
        <p className="text-sm font-medium text-gray-01 font-mont max-w-72 mx-auto">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
        <Link to={routesPath.AUTH.FORGOT_PASSWORD} className="block mt-4">
          <Button className="w-full h-11">Request New Link</Button>
        </Link>
        <Link
          to={routesPath.AUTH.LOGIN}
          className="font-mont font-medium text-sm text-black-01 inline-flex justify-center items-center mt-2 group"
        >
          <figure className="size-fit mr-1.5 group-hover:-translate-x-1 ease-linear transition-all">
            {svgIcons.arrowLeft}
          </figure>
          Back to Log In
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
                Set a New Password
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-84.5 mx-auto">
                Your new password must be different from your previously used
                password.
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
                label="New Password"
                id="password"
                type="password"
                placeholder="Enter your new password"
                className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
                {...formik.getFieldProps("password")}
                error={formik.touched.password ? formik.errors.password : ""}
              />
              <CustomInput
                label="Confirm Password"
                id="confirm_password"
                type="password"
                placeholder="Re-enter your new password"
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
              disabled={!formik.isValid || !formik.dirty || confirmLoading}
              loading={confirmLoading}
              type="submit"
              className="w-full h-11"
            >
              Reset Password
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
                Password Reset!
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-75.5 mx-auto">
                Your password has been successfully reset. Click the button
                below to log in.
              </p>
            </div>

            <Button
              className="w-full h-11 mt-9"
              onClick={() => navigate(routesPath.AUTH.LOGIN, { replace: true })}
            >
              Continue to Login
            </Button>

            <div className="text-center mt-6">
              <Link
                to={routesPath.AUTH.LOGIN}
                className="font-mont font-medium text-sm text-black-01 inline-flex justify-center items-center group"
              >
                <figure className="size-fit mr-1.5 group-hover:-translate-x-1 ease-linear transition-all">
                  {svgIcons.arrowLeft}
                </figure>
                Back to Log In
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
