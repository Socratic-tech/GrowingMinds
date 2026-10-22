import { Link } from "react-router-dom";

// Free 3D-printable add-ons for the Gardyn Studio (files in public/maker).
// Each has an STL to print as-is and an OpenSCAD file to customize.
const FILE = (name) => `${import.meta.env.BASE_URL}maker/${name}`;

const ITEMS = [
  {
    id: "timelapse-arm",
    title: "Timelapse arm",
    icon: "📷",
    blurb: "Holds a phone at the exact same spot every week, so the photo journal's timelapse doesn't jump around.",
    how: [
      "Zip-tie the plate to a tower column (the V-groove centers it on any column size).",
      "Drop a 1/4\"-20 nut into the pocket under the arm and push a 1/4\"-20 bolt up through it.",
      "Screw a phone tripod clamp onto the bolt, stand the phone up, and turn it to face the slot.",
      "Take every week's photo from the arm. Move the arm up or down to follow a different slot.",
    ],
    hardware: "2 zip ties (≤ 5 mm wide) · 1/4\"-20 bolt (~1/2\") · 1/4\"-20 hex nut · any phone tripod clamp",
    print: "PETG or PLA · 4 walls · 40% infill · no supports · print as modeled (arm flat on the bed)",
    tweak: "arm_len sets the phone's distance from the tower (default 110 mm).",
  },
  {
    id: "slot-tags",
    title: "Slot tags A1–B8",
    icon: "🏷️",
    blurb: "Sixteen tags that match the app's Slot Tracker, with each slot's sun level. Zip-tie one beside each slot.",
    how: [
      "Print the plate (one tag per slot).",
      "Column A is the LEFT column as you face the front of the tower; row 1 is the TOP.",
      "Thread a small zip tie through both slots of a tag and around the column beside its slot.",
    ],
    hardware: "16 small zip ties (≤ 4 mm wide)",
    print: "PLA · 0.2 mm layers · no supports · optional: change filament at the text layer (2.0 mm) for two-color tags",
    tweak: "The sun map matches the app; edit the sun list if your light map changes.",
  },
  {
    id: "plant-ruler",
    title: "Plant ruler (0 at the end)",
    icon: "📏",
    blurb: "A 20 cm zero-end ruler for the student data station: rest the 0 on top of the yPod and read the tallest leaf.",
    how: [
      "Rest the 0 end on top of the yPod, beside the stem.",
      "Read the height at the tip of the tallest leaf, in centimeters.",
      "Enter it at the class station (to the nearest half centimeter is plenty).",
    ],
    hardware: "None",
    print: "PLA · 0.2 mm layers · no supports · optional: change filament at 2.4 mm for two-color numbers",
    tweak: "length_cm changes the length; label changes the printed name.",
  },
];

export default function MakerAddons() {
  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-3">
        <Link to="/tracker" className="text-xs font-semibold text-teal-800 underline">← Slot Tracker</Link>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 bg-teal-100 text-teal-700 rounded-3xl lg:rounded-2xl flex items-center justify-center shadow">🛠️</div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">3D-print add-ons</h1>
            <p className="text-xs text-gray-600 mt-0.5">Free files for your Gardyn Studio. Print them in your makerspace, or ask a neighboring school with a printer.</p>
          </div>
        </div>
      </div>

      <ul className="space-y-4">
        {ITEMS.map((it) => (
          <li key={it.id} className="bg-white border border-gray-200 rounded-3xl lg:rounded-2xl shadow-sm overflow-hidden md:flex">
            <img src={FILE(`${it.id}.png`)} alt={`${it.title}, 3D preview`} loading="lazy"
                 className="w-full md:w-64 h-48 md:h-auto object-contain bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100" />
            <div className="p-5 space-y-3 flex-1">
              <h2 className="text-lg font-bold text-gray-900"><span aria-hidden="true">{it.icon}</span> {it.title}</h2>
              <p className="text-sm text-gray-700">{it.blurb}</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
                {it.how.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <dl className="text-xs text-gray-600 space-y-1">
                <div><dt className="inline font-semibold text-gray-800">Hardware: </dt><dd className="inline">{it.hardware}</dd></div>
                <div><dt className="inline font-semibold text-gray-800">Print: </dt><dd className="inline">{it.print}</dd></div>
                <div><dt className="inline font-semibold text-gray-800">Customize: </dt><dd className="inline">{it.tweak}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2 pt-1">
                <a href={FILE(`${it.id}.stl`)} download className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl px-4 py-2">⬇ STL (print)</a>
                <a href={FILE(`${it.id}.scad`)} download className="border border-gray-300 text-gray-800 text-sm font-semibold rounded-xl px-4 py-2 hover:bg-gray-50">⬇ OpenSCAD (customize)</a>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-500">
        These are first versions. Test-print one before printing a class set, and tell us what to improve in Q &amp; A.
      </p>
    </div>
  );
}
