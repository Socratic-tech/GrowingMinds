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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-800 to-teal-900 p-6">

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6 animate-fadeIn">

        <div className="text-center space-y-2">
          <div className="text-5xl">🌱</div>
          <h1 className="text-2xl font-bold text-teal-800">Growing Minds</h1>
          <p className="text-xs text-gray-500 uppercase">Educator Portal</p>
        </div>

        <Button
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl shadow-md"
          onClick={handleGoogle}
        >
          Sign in with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-700 shadow-inner"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-700 shadow-inner"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-3 shadow-lg font-semibold">
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <button
          onClick={handleMagicLink}
          className="text-sm text-teal-700 underline hover:text-teal-800"
        >
          Send me a magic login link
        </button>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {mode === "login"
            ? "New educator? Create an account"
            : "Already have an account? Sign in"}
        </button>

      </div>
    </div>
  );
}
