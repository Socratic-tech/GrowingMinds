import { supabase } from "../supabase/client";

export default function Pending({ email, isNew }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center 
      bg-gradient-to-br from-teal-800 to-teal-900 p-8 text-white text-center animate-fadeIn">

      {/* Icon */}
      <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center 
        justify-center text-4xl mb-6 shadow-xl backdrop-blur-sm border border-white/20">
        🛡️
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold tracking-tight mb-3">
        {isNew ? "Setting Up Your Account…" : "Awaiting Approval"}
      </h2>

      {/* Body text */}
      <p className="text-sm text-teal-100 leading-relaxed max-w-xs mb-8">
        Hi <span className="font-semibold">{email.split("@")[0]}</span> — your account
        {isNew ? " is being created" : " is awaiting educator verification"}.
        <br />
        You’ll be notified once an admin approves your access.
      </p>

      {/* Buttons */}
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-white/90 underline text-xs tracking-wider hover:text-white transition"
      >
        Sign Out
      </button>
    </div>
  );
}

