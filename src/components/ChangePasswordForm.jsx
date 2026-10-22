import { useState } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "./ui/toast";
import { MIN_PASSWORD, friendlyPasswordError, sendPasswordReset } from "../utils/password";

// Change your own password while signed in. Confirms the current password
// first (so an unattended, signed-in laptop can't be used to lock someone
// out), then sets the new one.
export default function ChangePasswordForm({ onDone, onCancel }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving || !user?.email) return;
    if (next.length < MIN_PASSWORD) {
      showToast({ title: `New password must be at least ${MIN_PASSWORD} characters`, type: "error" });
      return;
    }
    if (next !== confirm) {
      showToast({ title: "New passwords don't match", type: "error" });
      return;
    }
    if (next === current) {
      showToast({ title: "Pick a different password", description: "The new password matches your current one.", type: "error" });
      return;
    }

    setSaving(true);
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (check.error) {
      setSaving(false);
      const wrong = /invalid login credentials/i.test(check.error.message || "");
      showToast({
        title: wrong ? "Current password is incorrect" : "Couldn't check your password",
        description: wrong ? "Try again, or use “Email me a reset link” below." : friendlyPasswordError(check.error),
        type: "error",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      showToast({ title: "Couldn't change your password", description: friendlyPasswordError(error), type: "error" });
      return;
    }
    setCurrent(""); setNext(""); setConfirm("");
    showToast({ title: "Password changed", description: "Use your new password next time you sign in.", type: "success" });
    onDone?.();
  }

  async function emailLink() {
    if (sendingLink) return;
    setSendingLink(true);
    const { error } = await sendPasswordReset(user?.email);
    setSendingLink(false);
    showToast(error
      ? { title: "Couldn't send the reset email", description: friendlyPasswordError(error), type: "error" }
      : { title: "Check your email", description: `We sent a reset link to ${user.email}. It works once and expires in an hour.`, type: "success" });
  }

  const inputCls = "w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-800 shadow-inner focus-visible:ring-2 focus-visible:ring-teal-600";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";
  const type = show ? "text" : "password";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left" aria-label="Change password">
      <p className="text-sm font-bold text-gray-800">Change password</p>
      {/* Lets password managers match the form to the account. */}
      <input type="email" name="username" autoComplete="username" value={user?.email || ""} readOnly hidden />
      <div>
        <label htmlFor="cp-current" className={labelCls}>Current password</label>
        <input id="cp-current" type={type} autoComplete="current-password" required value={current}
          onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="cp-new" className={labelCls}>New password <span className="font-normal text-gray-500">(at least {MIN_PASSWORD} characters)</span></label>
        <input id="cp-new" type={type} autoComplete="new-password" required minLength={MIN_PASSWORD} value={next}
          onChange={(e) => setNext(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="cp-confirm" className={labelCls}>Confirm new password</label>
        <input id="cp-confirm" type={type} autoComplete="new-password" required value={confirm}
          onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input type="checkbox" className="accent-teal-700" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Show passwords
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving}
          className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-4 py-2 disabled:opacity-50">
          {saving ? "Saving…" : "Change password"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-2">
            Cancel
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Forgot your current password?{" "}
        <button type="button" onClick={emailLink} disabled={sendingLink}
          className="font-semibold text-teal-800 underline disabled:opacity-50">
          {sendingLink ? "Sending…" : "Email me a reset link"}
        </button>
      </p>
    </form>
  );
}
