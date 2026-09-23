import { useState } from "react";
import { supabase, REDIRECT_URL } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { PROFILE_FIELDS, SUPPORT_CONTACT } from "../config/app";

const MIN_PASSWORD = 8;

// Turn Supabase's terse auth errors into something a teacher can act on.
function friendlyAuthError(err) {
  const msg = err?.message || "";
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match. Check for typos, or use \"Forgot your password?\".";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first — look for a message from Supabase/Growing Minds in your inbox (and spam folder).";
  if (/already registered|already exists/i.test(msg)) return "An account with this email already exists. Try signing in instead.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts right now. Please wait a few minutes and try again.";
  if (/password/i.test(msg) && /characters|short|weak/i.test(msg)) return `Please choose a stronger password (at least ${MIN_PASSWORD} characters).`;
  return msg || "Something went wrong. Please try again.";
}

export default function AuthPage() {
  const { showToast } = useToast();

  const [mode, setMode] = useState("login"); // login | signup | check-email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [details, setDetails] = useState(() => Object.fromEntries(PROFILE_FIELDS.map((f) => [f.key, ""])));
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleAuth(e) {
    e.preventDefault();
    if (loading) return;

    if (isSignup) {
      if (password.length < MIN_PASSWORD) {
        showToast({ title: `Password must be at least ${MIN_PASSWORD} characters`, type: "error" });
        return;
      }
      const missing = PROFILE_FIELDS.find((f) => f.required && !details[f.key].trim());
      if (missing) {
        showToast({ title: `${missing.label} is required`, type: "error" });
        return;
      }
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    const response = isSignup
      ? await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: REDIRECT_URL,
            // Stored on the auth user; AuthProvider copies these onto the
            // profile row on first sign-in so admins can see who this is.
            data: Object.fromEntries(
              PROFILE_FIELDS.map((f) => [f.key, details[f.key].trim().slice(0, f.max)])
            ),
          },
        })
      : await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (response.error) {
      showToast({ title: isSignup ? "Couldn't create account" : "Sign-in failed", description: friendlyAuthError(response.error), type: "error" });
      setLoading(false);
      return;
    }

    // Sign-up with email confirmation ON returns a user but no session.
    // Previously the button stayed on "Please wait…" forever here.
    if (isSignup && !response.data?.session) {
      setMode("check-email");
      setLoading(false);
      return;
    }

    // Otherwise AuthProvider picks up the new session and routing moves on.
    // Safety valve: if that somehow doesn't happen, don't spin forever.
    setTimeout(() => setLoading(false), 15000);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      showToast({ title: "Enter your email address first", type: "error" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: REDIRECT_URL.replace("/auth", "/reset-password"),
    });
    if (error) {
      showToast({ title: "Reset failed", description: friendlyAuthError(error), type: "error" });
    } else {
      showToast({ title: "Check your email!", description: "If an account exists for that address, we sent a reset link.", type: "success" });
    }
  }

  const inputCls =
    "w-full p-3 lg:p-4 border border-gray-300 rounded-xl shadow-inner text-sm lg:text-base focus-visible:ring-2 focus-visible:ring-teal-700";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-800 to-teal-900 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl lg:rounded-2xl shadow-xl p-8 space-y-6 animate-fadeIn">

        {/* LOGO + TITLE */}
        <div className="text-center space-y-2">
          <div aria-hidden="true" className="text-5xl">🌱</div>
          <h1 className="text-2xl lg:text-3xl font-bold text-teal-800 tracking-tight">Growing Minds</h1>
          <p className="text-xs lg:text-sm text-gray-500 uppercase font-medium">Educator Portal</p>
        </div>

        {mode === "check-email" ? (
          <div className="space-y-4 text-center" role="status">
            <div aria-hidden="true" className="text-4xl">📬</div>
            <h2 className="text-lg font-bold text-teal-800">Confirm your email</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We sent a confirmation link to <span className="font-semibold break-all">{email.trim()}</span>.
              Click it, then come back here and sign in. School email filters sometimes delay
              these — check your spam or quarantine folder if it hasn't arrived in a few minutes.
            </p>
            <p className="text-xs text-gray-500">
              After you sign in, an administrator will approve your account.
            </p>
            <Button
              type="button"
              onClick={() => { setMode("login"); setPassword(""); }}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-semibold text-sm"
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            {isSignup && (
              <p className="text-sm text-gray-600 text-center -mt-2">
                Create your educator account. An administrator reviews each new account before it's activated.
              </p>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoFocus
                  autoComplete="email"
                  className={inputCls}
                  placeholder={isSignup ? "School email address" : "Email address"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={isSignup ? MIN_PASSWORD : undefined}
                  className={`${inputCls} pr-12`}
                  placeholder={isSignup ? `Password (${MIN_PASSWORD}+ characters)` : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {isSignup && (
                <fieldset className="space-y-3 pt-2 border-t border-gray-100">
                  <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-3">
                    About you
                  </legend>
                  {PROFILE_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label htmlFor={`su-${f.key}`} className="block text-xs font-semibold text-gray-600 mb-1">
                        {f.label}
                        {!f.required && <span className="font-normal text-gray-500"> (optional)</span>}
                      </label>
                      <input
                        id={`su-${f.key}`}
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-inner text-sm focus-visible:ring-2 focus-visible:ring-teal-700"
                        placeholder={f.placeholder}
                        autoComplete={f.autoComplete}
                        maxLength={f.max}
                        required={f.required}
                        value={details[f.key]}
                        onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </fieldset>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 lg:py-4 rounded-xl shadow-lg font-semibold text-sm lg:text-base disabled:opacity-50"
              >
                {loading ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
              </Button>
            </form>

            {mode === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-teal-700 underline text-xs lg:text-sm hover:text-teal-900"
              >
                Forgot your password?
              </button>
            )}

            <button
              type="button"
              onClick={() => setMode(isSignup ? "login" : "signup")}
              className="block w-full text-center text-sm text-teal-800 font-semibold hover:underline"
            >
              {isSignup ? "Already have an account? Sign in" : "New educator? Create an account"}
            </button>
          </>
        )}

        <p className="text-center text-[11px] text-gray-500 pt-4 border-t border-gray-100">
          Need help? <a className="underline" href={`mailto:${SUPPORT_CONTACT.email}`}>{SUPPORT_CONTACT.email}</a>
        </p>
      </div>
    </div>
  );
}
