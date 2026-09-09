import { useParams, useNavigate, Link } from "react-router";
import {
  useSpecialLoginPreviewQuery,
  useSpecialLoginMutation,
} from "@/redux/services/auth/auth-api";
import { useState } from "react";
import { routesPath } from "@/routes/routes-path";
import { consumeReturnTo } from "@/utils/return-to";
import { humanizeAuthError } from "@/utils/auth-errors";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";

export default function SpecialLogin() {
  const { cardId: rawCardId } = useParams<{ cardId: string }>();
  const cardId = decodeURIComponent(rawCardId ?? "");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [apiError, setApiError] = useState("");

  const {
    data,
    isLoading: isPreviewing,
    error: previewError,
  } = useSpecialLoginPreviewQuery(cardId, { skip: !cardId });

  const [login, { isLoading: isLoggingIn }] = useSpecialLoginMutation();

  const previewErrorMsg = (() => {
    if (!previewError) return "";
    return humanizeAuthError(
      previewError,
      "This ID card cannot be used to sign in.",
    );
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setApiError("");
    login({ card_id: cardId, password })
      .unwrap()
      .then(() =>
        navigate(consumeReturnTo() ?? routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true }),
      )
      .catch((err) => {
        setApiError(
          humanizeAuthError(err, "Invalid credentials. Please try again."),
        );
      });
  };

  if (isPreviewing) {
    return (
      <div className="grid place-content-center min-h-40">
        <div className="loader" />
      </div>
    );
  }

  if (previewErrorMsg) {
    return (
      <div className="text-center space-y-5 py-4">
        <div className="space-y-1.5">
          <h4 className="font-semibold text-2xl text-black-01">
            Login Failed
          </h4>
          <p className="text-sm font-medium text-destructive font-mont">
            {previewErrorMsg}
          </p>
        </div>
        <Link to={routesPath.AUTH.LOGIN}>
          <Button variant="outline" className="w-full h-11 mt-2">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  const fullName = data?.data?.full_name ?? "";

  return (
    <div>
      <div className="text-center space-y-1.5">
        <h4 className="font-semibold text-2xl text-black-01">Welcome back</h4>
        <p className="text-sm font-medium text-gray-01 font-mont">
          Identity verified via ID card. Enter your password to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-1.5">
          <label className="text-sm text-black-01">Name</label>
          <div className="h-11 bg-gray-03 rounded-md flex items-center px-3 text-sm text-black-01 font-medium capitalize select-none cursor-default">
            {fullName}
          </div>
        </div>

        <CustomInput
          label="Password"
          id="special-login-password"
          type="password"
          placeholder="Enter your password"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
          value={password}
          onChange={(e) => {
            setApiError("");
            setPassword(e.target.value);
          }}
        />

        {apiError && (
          <p className="text-xs font-medium text-destructive/70 -mt-1">
            {apiError}
          </p>
        )}

        <Button
          type="submit"
          disabled={!password || isLoggingIn}
          loading={isLoggingIn}
          className="w-full h-11"
        >
          Login
        </Button>
      </form>
    </div>
  );
}
