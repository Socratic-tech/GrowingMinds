// Single source of truth for the primary navigation, used by both the
// desktop Sidebar and the mobile bottom nav in ShellLayout. Add new items
// here once.
export function getNavItems(isAdmin) {
  const items = [
    { path: "/feed", label: "Feed", icon: "🏠" },
    { path: "/gardyn", label: "Gardyn", icon: "🌿" },
    { path: "/library", label: "Library", icon: "📚" },
    { path: "/qa", label: "Q&A", icon: "❓" },
  ];

  if (isAdmin) {
    items.push({ path: "/admin", label: "Admin", icon: "🛡️" });
  }

  return items;
}

// Gardyn sub-pages (tracker, maintenance, ...) highlight the Gardyn tab, and
// "/" is the Feed.
const GARDYN_PATHS = ["/gardyn", "/tracker", "/maintenance", "/harvest", "/plants", "/lessons", "/learn"];

export function isNavActive(itemPath, pathname) {
  if (itemPath === "/feed") return pathname === "/" || pathname === "/feed";
  if (itemPath === "/gardyn") return GARDYN_PATHS.some((p) => pathname.startsWith(p));
  return pathname.startsWith(itemPath);
}
