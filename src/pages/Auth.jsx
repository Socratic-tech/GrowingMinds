import { useState } from "react";
import { supabase, REDIRECT_URL } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function AuthPage() {
  const { showToast } = useToast();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleAuth(e) {
    e.preventDefault();

    let result;
    if (mode === "login") {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
      showToast({
        title: "Authentication failed",
        description: result.error.message,
        type: "error",
      });
    }
  }

  async function handleMagicLink() {
    if (!email) {
      showToast({ title: "Enter an email first", type: "error" });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT_URL },
    });

    if (error) {
      showToast({
        title: "Magic Link Error",
        description: error.message,
        type: "error",
      });
    } else {
      showToast({
        title: "Magic link sent!",
        description: "Check your inbox to continue.",
        type: "success",
      });
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT_URL },
    });

    if (error) {
      showToast({
        title: "Google Login Failed",
        description: error.message,
        type: "error",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-200 to-teal-300 p-6">

      {/* Auth Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6 animate-fadeIn">

        {/* Logo + Title */}
        <div className="text-center space-y-1">
          <div className="text-5xl">🌱</div>
          <h1 className="text-2xl font-bold text-teal-700">Growing Minds</h1>
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            Educator Portal
          </p>
        </div>

        {/* Google Login */}
        <Button
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md"
          onClick={handleGoogle}
        >
          Sign in with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="text-xs font-semibold uppercase text-gray-400">Or</div>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 font-semibold shadow-md">
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Magic Link */}
        <button
          onClick={handleMagicLink}
          className="w-full text-teal-700 text-sm underline font-medium hover:text-teal-900 transition"
        >
          Send me a magic login link
        </button>

        {/* Toggle Login / Signup */}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="block text-center text-xs text-gray-500 hover:text-gray-700 transition"
        >
          {mode === "login"
            ? "New educator? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
