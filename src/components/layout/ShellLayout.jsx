import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import Sidebar from "./Sidebar";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const isAdmin = profile?.role === "admin";

  const navItems = [
    { path: "/feed", label: "Feed", icon: "🏠" },
    { path: "/library", label: "Library", icon: "📚" },
    { path: "/qa", label: "Q&A", icon: "❓" },
  ];

  if (isAdmin) {
    navItems.push({ path: "/admin", label: "Admin", icon: "🛡️" });
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b 
                    from-teal-900/20 via-teal-50 to-gray-100 flex">

      {/* SKIP LINK */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   focus:bg-white focus:text-teal-700 focus:p-2 focus:rounded-lg shadow"
      >
        Skip to main content
      </a>

      {/* DESKTOP SIDEBAR */}
      {!isMobile && <Sidebar navigate={navigate} isAdmin={isAdmin} />}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 max-w-3xl mx-auto flex flex-col">

        {/* HEADER */}
        <header
          className="bg-gradient-to-br from-teal-800 to-teal-900 text-white p-6 
                     shadow-xl rounded-b-3xl lg:rounded-b-2xl"
        >
          <div className="flex flex-col items-center gap-2 text-center">

            <div className="flex justify-between items-center w-full">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
                Growing Minds
              </h1>

              <span className="px-3 py-1 text-xs lg:text-sm bg-white/20 rounded-full uppercase">
                {isAdmin ? "ADMIN" : "EDUCATOR"}
              </span>
            </div>

            {/* MOBILE LOGO */}
            {isMobile && (
              <img
                src={`${import.meta.env.BASE_URL}projectlogo.jpg`}

                alt="Growing Minds logo"
                className="w-20 opacity-95 mt-2"
              />
            )}
          </div>
        </header>

        {/* MAIN */}
        <main
          id="main-content"
          className={`flex-1 overflow-y-auto px-5 py-6 ${isMobile ? "mb-28" : "lg:py-10"}`}
        >
          <Outlet />
        </main>

        {/* MOBILE NAV */}
        {isMobile && (
          <nav
            aria-label="Primary navigation"
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md 
                       px-4 pb-4 z-50"
          >
            <div className="bg-white shadow-xl border border-gray-200 
                            rounded-3xl p-4 flex justify-around">

              {navItems.map((item) => {
                const active = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`
                      flex flex-col items-center gap-1 min-h-[44px]
                      transition px-2 py-1
                      ${active ? "text-teal-700 scale-110" : "text-gray-400"}
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
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
