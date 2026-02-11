import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Manually verify the reset token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'recovery' && accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });

        if (error) {
          showToast({
            title: "Invalid reset link",
            description: "This link may have expired. Please request a new one.",
            type: "error",
          });
          setTimeout(() => navigate("/auth"), 2000);
        }
      } else {
        showToast({
          title: "No reset token found",
          description: "Please use the link from your email.",
          type: "error",
        });
        setTimeout(() => navigate("/auth"), 2000);
      }

      setVerifying(false);
    };

    verifyToken();
  }, [navigate, showToast]);

  async function handleReset(e) {
    e.preventDefault();

    if (password !== confirm) {
      showToast({ title: "Passwords do not match", type: "error" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showToast({
        title: "Reset failed",
        description: error.message,
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
