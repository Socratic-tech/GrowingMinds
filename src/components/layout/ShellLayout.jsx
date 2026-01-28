import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { Home, Book, MessageSquare, Shield } from "lucide-react";
import Sidebar from "./Sidebar";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const isAdmin = profile?.role === "admin";

  // NAV items for mobile
  const navItems = [
    { path: "/feed", label: "Feed", icon: <Home size={22} /> },
    { path: "/library", label: "Library", icon: <Book size={22} /> },
    { path: "/qa", label: "Q&A", icon: <MessageSquare size={22} /> },
  ];

  if (isAdmin) {
    navItems.push({
      path: "/admin",
      label: "Admin",
      icon: <Shield size={22} />,
    });
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-teal-900/30 via-teal-50 to-gray-100 flex">

      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <Sidebar navigate={navigate} isAdmin={isAdmin} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 max-w-3xl mx-auto flex flex-col">

        {/* HEADER */}
        <header className="bg-gradient-to-br from-teal-800 to-teal-900 text-white p-6 shadow-xl md:rounded-b-3xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight">Growing Minds</h1>

            <span className="px-3 py-1 text-xs bg-white/20 rounded-full uppercase tracking-wide">
              {isAdmin ? "ADMIN" : "EDUCATOR"}
            </span>
          </div>
        </header>

        {/* MAIN */}
        <main className={`flex-1 overflow-y-auto px-5 py-6 ${isMobile ? "mb-28" : ""}`}>
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAV */}
        {isMobile && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 z-50">
            <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-4 flex justify-around">

              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      flex flex-col items-center gap-1 transition
                      ${active ? "text-teal-700 scale-110" : "text-gray-400"}
                    `}
                  >
                    {item.icon}
                    <span className="text-[10px] font-semibold uppercase">
                      {item.label}
                    </span>
                  </button>
                );
              })}

            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
