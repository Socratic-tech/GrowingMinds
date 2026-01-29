import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthProvider";

export default function Sidebar({ navigate, isAdmin }) {
  const { profile } = useAuth();

  const items = [
    { label: "Feed", path: "/feed", icon: "🏠" },
    { label: "Library", path: "/library", icon: "📚" },
    { label: "Q&A", path: "/qa", icon: "❓" },
  ];

  if (isAdmin) {
    items.push({ label: "Admin", path: "/admin", icon: "🛡️" });
  }

  return (
    <nav
      aria-label="Sidebar navigation"
      className="w-64 bg-white border-r border-gray-200 h-screen p-6 
                 flex flex-col gap-6 shadow-xl"
    >
      {/* PROFILE */}
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="w-10 h-10 bg-teal-700 text-white rounded-full 
                     flex items-center justify-center font-bold"
        >
          {profile?.email?.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="font-bold text-gray-800 text-sm lg:text-base">
            {profile?.email?.split("@")[0]}
          </p>
          <p className="text-xs lg:text-sm text-gray-500 uppercase tracking-wide">
            {isAdmin ? "Admin" : "Educator"}
          </p>
        </div>
      </div>

      {/* LOGO */}
      <img
        src={`${import.meta.env.BASE_URL}projectlogo.jpg`}

        alt="Growing Minds logo"
        className="w-32 mx-auto mt-4 opacity-95"
      />

      {/* NAVIGATION */}
      <ul className="flex flex-col gap-1 mt-6">
        {items.map((item) => (
          <li key={item.path}>
            <button
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className="
                flex items-center gap-3 w-full text-left
                p-3 rounded-2xl hover:bg-gray-100 
                focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                min-h-[44px]
              "
            >
              <span className="text-lg lg:text-xl">{item.icon}</span>
              <span className="font-medium text-sm lg:text-base">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* LOGOUT */}
      <div className="mt-auto pt-6 border-t">
        <button
          aria-label="Logout"
          onClick={() => supabase.auth.signOut()}
          className="
            flex items-center gap-3 p-3 rounded-xl text-red-600
            hover:bg-red-100 
            focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
            min-h-[44px]
          "
        >
          <span className="text-lg lg:text-xl">🚪</span>
          <span className="font-medium text-sm lg:text-base">Logout</span>
        </button>
      </div>
    </nav>
  );
}
