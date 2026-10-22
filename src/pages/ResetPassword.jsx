import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { MIN_PASSWORD, friendlyPasswordError } from "../utils/password";

// Supabase appends the recovery tokens to the redirect URL. With HashRouter
// the link arrives as ".../#/reset-password#access_token=...&type=recovery"
// (a second "#"), or with "?code=..." before the hash for PKCE links. Read
// parameters from all of those places.
function readLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.slice(1); // "/reset-password#access_token=..."
  const cut = hash.search(/[#?]/);
  if (cut !== -1) {
    new URLSearchParams(hash.slice(cut + 1)).forEach((v, k) => params.set(k, v));
  }
  return params;
}

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Verify the reset link once on mount (guarded so StrictMode's double
  // effect in dev can't run it twice after the URL has been cleaned).
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const fail = (title, description) => {
      showToast({ title, description, type: "error" });
      setTimeout(() => navigate("/auth"), 4000);
      setVerifying(false);
    };

    (async () => {
      const params = readLinkParams();

      // Supabase sends errors back on the link itself, e.g. otp_expired when
      // the link is old, was already used, or a school email scanner
      // "clicked" it first.
      if (params.get("error") || params.get("error_code")) {
        const expired = /expired|invalid/i.test(`${params.get("error_code")} ${params.get("error_description")}`);
        return fail(
          expired ? "This reset link has expired" : "Reset link problem",
          expired
            ? "Links work once and expire after an hour. Request a new one from the login page and open it right away."
            : params.get("error_description") || "Please request a new link."
        );
      }

      let error = null;
      const code = params.get("code");
      const accessToken = params.get("access_token");
      if (code) {
        // PKCE-style link: ?code=...
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      } else if (accessToken && params.get("type") === "recovery") {
        ({ error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: params.get("refresh_token") || "",
        }));
      } else {
        return fail("No reset token found", "Please open the link from your password reset email.");
      }

      if (error) {
        return fail("Invalid reset link", "This link may have expired. Please request a new one.");
      }

      // Drop the tokens from the address bar and browser history.
      window.history.replaceState(null, "", window.location.pathname + "#/reset-password");
      setVerifying(false);
    })();
  }, [navigate, showToast]);

  async function handleReset(e) {
    e.preventDefault();

    if (password !== confirm) {
      showToast({ title: "Passwords do not match", type: "error" });
      return;
    }
    if (password.length < MIN_PASSWORD) {
      showToast({ title: "Password too short", description: `Use at least ${MIN_PASSWORD} characters.`, type: "error" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showToast({
        title: "Reset failed",
        description: friendlyPasswordError(error),
        type: "error",
      });
    } else {
      showToast({
        title: "Password Updated",
        description: "You may now log in with your new password.",
        type: "success",
      });

      // Redirect to login using React Router
      setTimeout(() => navigate("/auth"), 1500);
    }

    setLoading(false);
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-800 to-teal-900">
        <div className="text-white text-xl font-semibold">Verifying reset link...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    bg-gradient-to-br from-teal-800 to-teal-900 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl lg:rounded-2xl shadow-xl
                      p-8 space-y-6 animate-fadeIn">

        <div className="text-center space-y-2">
          <div aria-hidden="true" className="text-5xl">🔐</div>
          <h1 className="text-2xl lg:text-3xl font-bold text-teal-800 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs lg:text-sm text-gray-500">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl
                       shadow-inner text-sm lg:text-base focus-visible:ring-2
                       focus-visible:ring-teal-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm password"
            className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl
                       shadow-inner text-sm lg:text-base focus-visible:ring-2
                       focus-visible:ring-teal-700"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <Button
            className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 lg:py-4
                       rounded-xl shadow-lg font-semibold text-sm lg:text-base"
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </form>

        <button
          onClick={() => navigate("/auth")}
          className="block text-center text-xs lg:text-sm text-gray-500 hover:text-gray-700"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
