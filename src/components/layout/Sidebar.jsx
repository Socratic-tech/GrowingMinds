import { useLocation } from "react-router-dom";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthProvider";
import { getNavItems, isNavActive } from "../../config/navItems";
import { displayName, initials, affiliation } from "../../utils/displayName";

export default function Sidebar({ navigate, isAdmin }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const items = getNavItems(isAdmin);
  const org = affiliation(profile);

  return (
    <nav
      aria-label="Sidebar navigation"
      className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 p-6 flex flex-col gap-6 shadow-xl shrink-0"
    >
      {/* PROFILE (click → your profile page) */}
      <button
        type="button"
        onClick={() => user && navigate(`/profile/${user.id}`)}
        className="flex items-center gap-3 text-left rounded-2xl p-1 -m-1 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-teal-500"
        aria-label="View your profile"
      >
        <div aria-hidden="true" className="w-10 h-10 bg-teal-700 text-white rounded-full flex items-center justify-center font-bold shrink-0">
          {initials(profile)}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-800 text-sm lg:text-base truncate">{displayName(profile)}</p>
          <p className="text-xs text-gray-500 truncate">{org || (isAdmin ? "Admin" : "Educator")}</p>
        </div>
      </button>

      <img
        src="https://aaiovfryjlcdijdyknik.supabase.co/storage/v1/object/public/branding/projectlogo.png"
        alt="Growing Minds logo"
        className="w-28 mx-auto mt-2 opacity-95 object-contain"
      />

      <ul className="flex flex-col gap-1 mt-2">
        {items.map((item) => {
          const active = isNavActive(item.path, location.pathname);
          return (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-2xl min-h-[44px]
                  focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                  ${active ? "bg-teal-50 text-teal-800 font-semibold" : "hover:bg-gray-100"}`}
              >
                <span aria-hidden="true" className="text-lg lg:text-xl">{item.icon}</span>
                <span className="font-medium text-sm lg:text-base">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-6 border-t">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-h-[44px]"
        >
          <span aria-hidden="true" className="text-lg lg:text-xl">🚪</span>
          <span className="font-medium text-sm lg:text-base">Sign out</span>
        </button>
      </div>
    </nav>
  );
}
