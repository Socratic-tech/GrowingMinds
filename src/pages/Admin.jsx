import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

export default function Admin() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);

  // Load all users
  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(data || []);
  }

  // Approve / Restrict
  async function updateStatus(id, value) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: value })
      .eq("id", id);

    if (error) {
      showToast({
        title: "Error updating educator",
        description: error.message,
        type: "error",
      });
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
        <div
          aria-hidden="true"
          className="w-10 h-10 bg-teal-100 text-teal-700 
                     rounded-3xl lg:rounded-2xl flex items-center justify-center shadow"
        >
          🛡️
        </div>

        <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
          Admin Panel
        </h1>
      </div>

      {/* PENDING EDUCATORS */}
      <section aria-labelledby="pending-title" className="space-y-4">
        <h2
          id="pending-title"
          className="text-xs lg:text-sm uppercase tracking-widest font-bold text-amber-600 
                     flex items-center gap-2"
        >
          ⏳ Pending Approval ({pending.length})
        </h2>

        {pending.length === 0 && (
          <p className="text-sm lg:text-base text-gray-500 italic pl-1">
            No pending educators.
          </p>
        )}

        {pending.map((u) => (
          <div
            key={u.id}
            role="group"
            aria-label={`Pending educator ${u.email}`}
            className="bg-white p-5 rounded-3xl lg:rounded-2xl border border-amber-200 
                       shadow-md space-y-3"
          >
            <p className="font-semibold text-gray-800 text-sm lg:text-base truncate">
              {u.email}
            </p>

            <Button
              aria-label={`Approve ${u.email}`}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 lg:py-4 
                         rounded-xl shadow-md text-xs lg:text-sm uppercase font-bold"
              onClick={() => updateStatus(u.id, true)}
            >
              Approve Educator
            </Button>
          </div>
        ))}
      </section>

      {/* ACTIVE EDUCATORS */}
      <section aria-labelledby="active-title" className="space-y-4 pb-24">
        <h2
          id="active-title"
          className="text-xs lg:text-sm uppercase tracking-widest font-bold text-teal-600 
                     flex items-center gap-2"
        >
          ✔ Active Educators ({approved.length})
        </h2>

        {approved.map((u) => (
          <div
            key={u.id}
            role="group"
            aria-label={`Active educator ${u.email}`}
            className="bg-white p-5 rounded-3xl lg:rounded-2xl border border-gray-200 
                       shadow-md flex items-center justify-between"
          >
            <div className="flex flex-col pr-3 overflow-hidden">
              <p className="font-semibold text-gray-800 text-sm lg:text-base truncate">
                {u.email}
              </p>

              <p className="text-[10px] lg:text-xs text-teal-700 uppercase font-bold">
                {u.role}
              </p>
            </div>

            <button
              aria-label={`Restrict educator ${u.email}`}
              onClick={() => updateStatus(u.id, false)}
              className="
                w-10 h-10 flex items-center justify-center rounded-xl 
                text-red-400 hover:text-red-600 text-lg 
                focus-visible:ring-2 focus-visible:ring-red-500
              "
            >
              🗑️
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
