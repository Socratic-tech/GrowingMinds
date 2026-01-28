import { Button } from "../components/ui/button";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";

export default function Pending() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-6xl mb-4">🕒</div>

      <h1 className="text-2xl font-bold text-amber-700 mb-2">
        Approval Needed
      </h1>

      <p className="text-gray-600 mb-6">
        Hi <strong>{user?.email}</strong>, your account is not approved yet.<br />
        An administrator will verify your educator status shortly.
      </p>

      <Button
        className="bg-teal-600 hover:bg-teal-700"
        onClick={() => supabase.auth.signOut()}
      >
        Sign Out
      </Button>
    </div>
  );
}
