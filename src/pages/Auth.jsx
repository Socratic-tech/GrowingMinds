import { useState } from "react";
import { supabase, REDIRECT_URL } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function AuthPage() {
  const { showToast } = useToast();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Email/password login or signup
  async function handleAuth(e) {
    e.preventDefault();

    console.log(`Attempting ${mode} for:`, email);

    const response =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (response.error) {
      console.error("Auth error:", response.error);
      showToast({
        title: "Authentication failed",
        description: response.error.message,
        type: "error",
      });
    } else {
      console.log("Auth success:", response.data);
    }
  }

  // Magic link login
  async function handleMagicLink() {
    if (!email) {
      showToast({ title: "Enter an email address first", type: "error" });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT_URL },
    });

    if (error) {
      showToast({
        title: "Magic link error",
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center 
                    bg-gradient-to-br from-teal-800 to-teal-900 p-6">

      {/* AUTH CARD */}
      <div className="
        w-full max-w-sm bg-white rounded-3xl lg:rounded-2xl shadow-xl 
        p-8 space-y-6 animate-fadeIn
      ">

        {/* LOGO + TITLE */}
        <div className="text-center space-y-2">
          <div aria-hidden="true" className="text-5xl">🌱</div>

          <h1 className="text-2xl lg:text-3xl font-bold text-teal-800 tracking-tight">
            Growing Minds
          </h1>

          <p className="text-xs lg:text-sm text-gray-500 uppercase font-medium">
            Educator Portal
          </p>
        </div>

        {/* EMAIL / PASSWORD FORM */}
        <form onSubmit={handleAuth} className="space-y-4">

          <input
            id="email"
            type="email"
            className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl 
                       shadow-inner text-sm lg:text-base focus-visible:ring-2 
                       focus-visible:ring-teal-700"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            id="password"
            type="password"
            className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl 
                       shadow-inner text-sm lg:text-base focus-visible:ring-2 
                       focus-visible:ring-teal-700"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            aria-label={mode === "login" ? "Sign in" : "Create account"}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 lg:py-4 
                       rounded-xl shadow-lg font-semibold text-sm lg:text-base"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>

        </form>

        {/* MAGIC LINK - Disabled for HashRouter compatibility */}
        {/* <button
          aria-label="Send a magic login link"
          onClick={handleMagicLink}
          className="w-full text-teal-700 underline text-xs lg:text-sm hover:text-teal-900"
        >
          Send me a magic login link
        </button> */}

        {/* TOGGLE MODE */}
        <button
          aria-label="Toggle auth mode"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="block text-center text-xs lg:text-sm text-gray-500 hover:text-gray-700"
        >
          {mode === "login"
            ? "New educator? Create an account"
            : "Already have an account? Sign in"}
        </button>

      </div>
    </div>
  );
}
