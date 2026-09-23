import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import Sidebar from "./Sidebar";
import { useIsMobile } from "../../hooks/useIsMobile";
import Notifications from "../Notifications";
import { getNavItems, isNavActive } from "../../config/navItems";
import WelcomeCard from "../WelcomeCard";
import ProfileNudge from "../ProfileNudge";
import { initials } from "../../utils/displayName";

export default function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();

  // 🚨 Prevent crash on refresh by waiting for profile to load
  if (!profile) {
    return <div className="text-center p-10 text-white">Loading…</div>;
  }

  const isAdmin = profile.role === "admin";
  const navItems = getNavItems(isAdmin);

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

      {/* MAIN LAYOUT */}
      <div className="flex-1 min-w-0 max-w-3xl mx-auto flex flex-col">

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

              <div className="flex items-center gap-3">
                <Notifications />
                {isMobile ? (
                  // Phones have no sidebar: this avatar is the way to your
                  // profile (which also has Sign out).
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user?.id}`)}
                    aria-label="Your profile and sign out"
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {initials(profile)}
                  </button>
                ) : (
                  <span className="px-3 py-1 text-xs lg:text-sm bg-white/20 rounded-full uppercase">
                    {isAdmin ? "ADMIN" : "EDUCATOR"}
                  </span>
                )}
              </div>
            </div>

            {/* MOBILE LOGO */}
            {isMobile && (
              <img
                src="https://aaiovfryjlcdijdyknik.supabase.co/storage/v1/object/public/branding/projectlogo.png"
                alt="Growing Minds logo"
                className="w-28 mx-auto mt-4 opacity-95 object-contain"
              />
            )}
          </div>
        </header>

        {/* MAIN */}
        <main
          id="main-content"
          className={`flex-1 overflow-y-auto px-5 py-6 ${isMobile ? "mb-28" : "lg:py-10"}`}
        >
          <WelcomeCard />
          <ProfileNudge />
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
                const active = isNavActive(item.path, location.pathname);

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    aria-current={active ? "page" : undefined}
                    className={`
                      flex flex-col items-center gap-1 min-h-[44px]
                      transition px-2 py-1
                      ${active ? "text-teal-700 scale-110" : "text-gray-500"}
                    `}
                  >
                    <span aria-hidden="true" className="text-xl">{item.icon}</span>
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
