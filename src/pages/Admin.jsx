import { useAuth } from "../context/AuthProvider";

export default function Admin() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-600 font-bold">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-700">Admin Panel</h1>
        <p className="text-gray-500 text-sm">Manage educators and system access 🛡️</p>
      </div>

      {/* Pending Users Placeholder */}
      <div className="bg-gray-100 border rounded-xl p-4">
        Pending approvals will appear here...
      </div>

      {/* Active Users Placeholder */}
      <div className="bg-gray-100 border rounded-xl p-4">
        Active educators will appear here...
      </div>

    </div>
  );
}
