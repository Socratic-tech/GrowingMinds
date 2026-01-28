import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { Home, Book, MessageSquare, Shield } from "lucide-react";

export default function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const isAdmin = profile?.role === "admin";

  const navItems = [
    { path: "/feed", label: "Feed", icon: <Home strokeWidth={2} /> },
    { path: "/library", label: "Library", icon: <Book strokeWidth={2} /> },
    { path: "/qa", label: "Q&A", icon: <MessageSquare strokeWidth={2} /> },
  ];

  if (isAdmin) {
    navItems.push({
      path: "/admin",
      label: "Admin",
      icon: <Shield strokeWidth={2} />,
    });
  }

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-white shadow-xl relative">

      {/* HEADER — Modern, clean */}
      <header className="bg-gradient-to-br from-teal-700 to-emerald-600 text-white p-5 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Growing Minds</h1>

          {/* Small badge showing user role */}
          <span className="text-xs px-3 py-1 bg-white/20 rounded-full uppercase tracking-wider font-semibold">
            {isAdmin ? "Admin" : "Educator"}
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <Outlet />
      </main>

      {/* BOTTOM NAV — Clean rounded mobile dock */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md">
        <div className="mx-4 mb-4 bg-white border border-gray-200 shadow-lg rounded-2xl px-6 py-3 flex justify-around">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center transition-all ${
                  active ? "text-teal-600 scale-110" : "text-gray-400"
                }`}
              >
                <div className="w-6 h-6">{item.icon}</div>
                <span className="text-[10px] font-semibold mt-1 tracking-wider">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
