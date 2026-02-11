import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

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
