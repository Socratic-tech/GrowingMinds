import { useState } from "react";
import { supabase, REDIRECT_URL } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function AuthPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  // Already logged in → go to app
  if (user) window.location.href = "/feed";

  async function handleEmailAuth(e) {
    e.preventDefault();
    let result;

    if (mode === "login") {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
      showToast({ title: "Authentication failed", description: result.error.message, type: "error" });
    } else {
      showToast({ title: "Success", description: "You're logged in!", type: "success" });
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT_URL },
    });

    if (error)
      showToast({ title: "Google Login Failed", description: error.message, type: "error" });
  }

  async function handleMagicLink() {
    if (!email) {
      showToast({ title: "Enter an email", type: "error" });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT_URL },
    });

    if (error)
      showToast({ title: "Magic Link Error", description: error.message, type: "error" });
    else
      showToast({ title: "Magic Link Sent", description: "Check your inbox!", type: "success" });
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">

      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🌱</div>
        <h1 className="text-3xl font-bold text-teal-700">Growing Minds</h1>
      </div>

      {/* Google login */}
      <Button onClick={handleGoogleLogin} className="w-full bg-red-600 hover:bg-red-700 mb-4">
        Sign in with Google
      </Button>

      <form onSubmit={handleEmailAuth} className="w-full space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button className="w-full bg-teal-600 hover:bg-teal-700">
          {mode === "login" ? "Login" : "Create Account"}
        </Button>
      </form>

      {/* Toggle */}
      <button
        className="mt-4 text-sm underline text-teal-700"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "New user? Create an account" : "Back to login"}
      </button>

      {/* Magic link */}
      <button className="mt-2 text-sm text-gray-500" onClick={handleMagicLink}>
        Email me a login link
      </button>
    </div>
  );
}
