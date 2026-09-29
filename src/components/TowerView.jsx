import { GARDYN_COLUMNS, GARDYN_ROWS, LIGHT_ZONE_META, getSlotLightZone } from "../config/gardyn";

// Front view of the Gardyn Studio, drawn the way it stands in the room:
// two columns side by side (A on the left, B on the right as you face the
// front), row 1 at the TOP, the light bar between them, the tank below.
// Each slot is rendered by `renderSlot(id, zoneMeta)`, so the Tracker and
// the printable tower map share the same picture.

export const SUN_STRIPE = {
  "Yellow (Low)": "bg-yellow-400",
  "Orange (Med)": "bg-orange-400",
  "Red (High)": "bg-red-500",
};

export default function TowerView({ renderSlot, caption = true }) {
  const [left, right] = GARDYN_COLUMNS;
  const last = GARDYN_ROWS.length;

  // One CSS grid so every row lines up across both columns:
  // [row #] [column A] [light bar] [column B] [row #]
  const pipe = (i) =>
    `bg-stone-200 border-x border-stone-300 px-1.5 py-[3px]
     ${i === 0 ? "rounded-t-2xl border-t pt-1.5" : ""} ${i === last - 1 ? "rounded-b-2xl border-b pb-1.5" : ""}`;

  return (
    <figure className="select-none">
      <div className="mx-auto max-w-xl">
        <div className="flex justify-center mb-1.5" aria-hidden="true">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-3 py-0.5">
            ▲ Top of tower
          </span>
        </div>

        <div className="grid items-stretch" style={{ gridTemplateColumns: "1.25rem minmax(0,1fr) 1.25rem minmax(0,1fr) 1.25rem" }}>
          {/* Headers */}
          <span aria-hidden="true" />
          <p className="text-center text-[11px] font-bold tracking-widest text-gray-700 pb-1">
            COLUMN {left} <span className="font-semibold tracking-normal text-gray-500">· left</span>
          </p>
          <span aria-hidden="true" />
          <p className="text-center text-[11px] font-bold tracking-widest text-gray-700 pb-1">
            COLUMN {right} <span className="font-semibold tracking-normal text-gray-500">· right</span>
          </p>
          <span aria-hidden="true" />

          {GARDYN_ROWS.map((r, i) => (
            <Row key={r} r={r} i={i} last={last} left={left} right={right} pipe={pipe} renderSlot={renderSlot} />
          ))}
        </div>

        <div className="mx-8 mt-1.5 rounded-b-3xl rounded-t-md bg-white border-2 border-stone-300 py-2 text-center" aria-hidden="true">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Water tank · front of tower</span>
        </div>
      </div>
      {caption && (
        <figcaption className="text-[11px] text-gray-500 text-center mt-2">
          Stand facing the front of your tower: this is what you see. Row 1 is the top slot.
        </figcaption>
      )}
    </figure>
  );
}

function Row({ r, i, last, left, right, pipe, renderSlot }) {
  const cell = (col) => {
    const id = `${col}${r}`;
    return <div className={pipe(i)}>{renderSlot(id, LIGHT_ZONE_META[getSlotLightZone(id)])}</div>;
  };
  return (
    <>
      <div className="flex items-center justify-center text-[11px] font-bold text-gray-400" aria-hidden="true">{r}</div>
      {cell(left)}
      {/* Light bar segment (camera on top) */}
      <div className="flex justify-center" aria-hidden="true">
        <div className={`w-2 bg-gradient-to-r from-gray-600 via-amber-100 to-gray-600
          ${i === 0 ? "rounded-t-full mt-1.5" : ""} ${i === last - 1 ? "rounded-b-full mb-1.5" : ""}`}>
          {i === 0 && <div className="w-2 h-2 rounded-full bg-gray-800 -mt-2.5" title="Camera" />}
        </div>
      </div>
      {cell(right)}
      <div className="flex items-center justify-center text-[11px] font-bold text-gray-400" aria-hidden="true">{r}</div>
    </>
  );
}
