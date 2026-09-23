// App-wide settings that are likely to change between rollouts.
// Edit here rather than hunting through page components.

// Shown on the Pending page and the welcome card so new educators know who
// to contact if approval is slow or something breaks.
export const SUPPORT_CONTACT = {
  name: "Growing Minds support (Berrien RESA)",
  email: "john.phillips@berrienresa.org",
};

// The profile fields an educator is asked for at signup. `required` fields
// must be filled before the Pending page stops asking; admins see all of
// them when approving.
export const PROFILE_FIELDS = [
  { key: "full_name", label: "Full name", placeholder: "Jane Smith", autoComplete: "name", required: true, max: 120 },
  { key: "school", label: "School", placeholder: "Lincoln Elementary", autoComplete: "organization", required: true, max: 160 },
  { key: "district", label: "District", placeholder: "Coloma Community Schools", required: true, max: 160 },
  { key: "remc", label: "REMC region", placeholder: "e.g. REMC 11", required: false, max: 80 },
];

export function missingProfileFields(profile) {
  return PROFILE_FIELDS.filter((f) => f.required && !profile?.[f.key]?.trim());
}
