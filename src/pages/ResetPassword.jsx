import { useState } from "react";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

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

      // Redirect to login
      window.location.href = "/login";
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
      <h1 className="text-2xl font-bold text-teal-700">Reset Password</h1>

      <form onSubmit={handleReset} className="w-full max-w-xs space-y-3">
        <input
          type="password"
          placeholder="New password"
          className="w-full p-3 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          className="w-full p-3 border rounded-lg"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button className="w-full bg-teal-600 hover:bg-teal-700">
          {loading ? "Updating..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}
