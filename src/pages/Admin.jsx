import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function Admin() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);

    setUsers(data || []);
  }

  async function updateStatus(id, value) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: value })
      .eq("id", id);

    if (error) {
      showToast({ title: "Update failed", description: error.message, type: "error" });
    } else {
      loadUsers();
      showToast({
        title: value ? "Educator Approved" : "Educator Restricted",
        type: "success",
      });
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const pending = users.filter((u) => !u.is_approved);
  const approved = users.filter((u) => u.is_approved);

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center shadow">
          🛡️
        </div>
        <h2 className="text-xl font-bold text-teal-800">Admin Panel</h2>
      </div>

      {/* PENDING SECTION */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-bold text-amber-600 flex items-center gap-2">
          <span className="text-amber-600">⏳</span> Pending Approval ({pending.length})
        </h3>

        {pending.length === 0 && (
          <p className="text-sm text-gray-500 italic pl-1">No pending educators.</p>
        )}

        {pending.map((u) => (
          <div
            key={u.id}
            className="bg-white p-5 rounded-3xl border border-amber-200 shadow-md space-y-3"
          >
            <p className="font-semibold text-gray-800 text-sm truncate">{u.email}</p>

            <Button
              className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-md text-xs uppercase py-3 font-bold"
              onClick={() => updateStatus(u.id, true)}
            >
              Approve Educator
            </Button>
          </div>
        ))}
      </section>

      {/* APPROVED SECTION */}
      <section className="space-y-4 pb-24">
        <h3 className="text-xs uppercase tracking-widest font-bold text-teal-600 flex items-center gap-2">
          <span className="text-emerald-600">✔</span> Active Educators ({approved.length})
        </h3>

        {approved.map((u) => (
          <div
            key={u.id}
            className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md flex items-center justify-between"
          >
            <div className="flex flex-col pr-3 overflow-hidden">
              <p className="font-semibold text-gray-800 text-sm truncate">{u.email}</p>
              <p className="text-[10px] text-teal-700 uppercase font-bold">{u.role}</p>
            </div>

            <button
              onClick={() => updateStatus(u.id, false)}
              className="text-red-400 hover:text-red-600 text-sm p-2"
            >
              🗑️
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
