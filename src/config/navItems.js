// Single source of truth for the primary navigation, used by both the
// desktop Sidebar and the mobile bottom nav in ShellLayout. Previously these
// lived as two separately hardcoded arrays that could silently drift apart
// whenever a page was added or renamed - add new items here once.
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
