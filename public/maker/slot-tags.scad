// Growing Minds · Slot tags A1–B8 (one plate)
// Matches the app's Slot Tracker: column A on the LEFT as you face the
// tower, row 1 at the TOP. Each tag has two zip-tie slots, so it fits any
// column without measuring. Sun level is printed under the slot number.
// PLA, 0.2 mm layers, no supports. Optional: swap filament at the text
// layer for two-color tags.

tag_w   = 34;   // mm
tag_h   = 20;   // mm
thick   = 2;    // mm
text_h  = 0.8;
gap     = 4;
slot_w  = 4.5;  // zip-tie slot (fits ties up to 4 mm wide)
slot_t  = 1.8;
$fn = 24;

// Same light map as src/config/gardyn.js
sun = [
  ["A1","MED"],["A2","MED"],["A3","HIGH"],["A4","MED"],["A5","HIGH"],["A6","MED"],["A7","HIGH"],["A8","LOW"],
  ["B1","LOW"],["B2","MED"],["B3","MED"],["B4","HIGH"],["B5","MED"],["B6","HIGH"],["B7","MED"],["B8","MED"]
];

module tag(id, level) {
  difference() {
    hull() for (x = [3, tag_w - 3], y = [3, tag_h - 3]) translate([x, y, 0]) cylinder(r = 3, h = thick);
    for (x = [2.2, tag_w - 2.2 - slot_t]) translate([x, (tag_h - slot_w) / 2, -1]) cube([slot_t, slot_w, thick + 2]);
  }
  translate([tag_w / 2, tag_h * 0.62, thick]) linear_extrude(text_h)
    text(id, size = 7.5, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
  translate([tag_w / 2, tag_h * 0.2, thick]) linear_extrude(text_h)
    text(str(level, " SUN"), size = 2.8, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
}

for (i = [0 : 15]) {
  col = i < 8 ? 0 : 1;      // A on the left of the plate, B on the right
  row = i % 8;
  translate([col * (tag_w + gap), (7 - row) * (tag_h + gap), 0]) tag(sun[i][0], sun[i][1]);
}
