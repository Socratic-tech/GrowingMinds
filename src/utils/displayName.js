// How to show a person in the UI. With a statewide rollout, email prefixes
// ("jsmith42") aren't enough to know who's who, so prefer the full name the
// educator entered at signup, falling back to the email prefix for older
// accounts that haven't filled it in yet.
//
// Pass a `profiles` row (or the embedded `profiles` object from a
// `select("*, profiles(*)")` query).

export function displayName(profile) {
  if (!profile) return "Educator";
  const name = profile.full_name?.trim();
  if (name) return name;
  const email = profile.email || "";
  return email.includes("@") ? email.split("@")[0] : email || "Educator";
}

export function initials(profile) {
  const name = profile?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "?";
  }
  return (profile?.email?.[0] || "?").toUpperCase();
}

/** "Lakeshore PS · Berrien RESA" style subtitle, or "" if unknown. */
export function affiliation(profile) {
  if (!profile) return "";
  return [profile.school, profile.district].filter(Boolean).join(" · ");
}
