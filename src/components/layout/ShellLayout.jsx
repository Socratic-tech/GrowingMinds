import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { Home, Book, MessageSquare, Shield } from "lucide-react";

export default function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const isAdmin = profile?.role === "admin";

  const navItems = [
    { path: "/feed", icon: <Home />, label: "Home" },
    { path: "/library", icon: <Book />, label: "Library" },
    { path: "/qa", icon: <MessageSquare />, label: "Q&A" },
  ];

  if (isAdmin) {
    navItems.push({ path: "/admin", icon: <Shield />, label: "Admin" });
  }

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-white shadow-xl relative">

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t flex justify-around p-3 rounded-t-xl shadow-xl">
        {navItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={
                active
                  ? "text-teal-600 flex flex-col items-center"
                  : "text-gray-400 flex flex-col items-center"
              }
            >
              <div className="w-6 h-6">{item.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
