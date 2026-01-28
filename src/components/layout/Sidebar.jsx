import { useAuth } from "../../context/AuthProvider";
import { Home, Book, MessageSquare, Shield, LogOut } from "lucide-react";
import { supabase } from "../../supabase/client";

export default function Sidebar({ navigate, isAdmin }) {
  const { profile } = useAuth();

  const items = [
    { label: "Feed", icon: <Home size={20} />, path: "/feed" },
    { label: "Library", icon: <Book size={20} />, path: "/library" },
    { label: "Q&A", icon: <MessageSquare size={20} />, path: "/qa" },
  ];

  if (isAdmin) {
    items.push({
      label: "Admin",
      icon: <Shield size={20} />,
      path: "/admin",
    });
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen p-6 flex flex-col gap-6 shadow-xl">

      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-700 text-white rounded-full flex items-center justify-center font-bold">
          {profile?.email?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-800">
            {profile?.email?.split("@")[0]}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {isAdmin ? "Admin" : "Educator"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-teal-800 transition"
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
