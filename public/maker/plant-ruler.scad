// Growing Minds · Plant ruler (zero-end)
// Lay flat to print. The 0 is at the very end, so students can rest the
// ruler on top of the yPod and read the height at the tallest leaf.
// PLA, 0.2 mm layers, no supports. Swap filament at the text layer for
// two-color numbers (optional).

length_cm = 20;     // ruler length in centimeters
width     = 22;     // mm
thick     = 2.4;    // mm
text_h    = 0.8;    // raised height of numbers/ticks
label     = "GROWING MINDS";

$fn = 32;
L = length_cm * 10;
TAB = 12;           // extra tab past the last mark, with a hang hole

module body() {
  hull() {
    translate([0, 0, 0]) cube([1, width, thick]);
    translate([L + TAB - 4, 4, 0]) cylinder(r = 4, h = thick);
    translate([L + TAB - 4, width - 4, 0]) cylinder(r = 4, h = thick);
  }
}

difference() {
  body();
  translate([L + TAB / 2 + 1, width / 2 - 3, -1]) cylinder(d = 4.5, h = thick + 2);  // hang hole
}

// ticks: cm long, 5 mm medium, mm short
translate([0, 0, thick]) {
  for (mm = [0 : L]) {
    tl = (mm % 10 == 0) ? 7 : (mm % 5 == 0) ? 5 : 3;
    translate([mm - 0.2, width - tl, 0]) cube([0.4, tl, text_h]);
  }
  for (cm = [0 : length_cm]) {
    translate([cm * 10 + (cm == 0 ? 1.2 : 0), width - 12, 0])
      linear_extrude(text_h) text(str(cm), size = 3.6, font = "Liberation Sans:style=Bold",
                                  halign = cm == 0 ? "left" : "center", valign = "center");
  }
  translate([14, 3.4, 0]) linear_extrude(text_h)
    text(str(label, "  ·  cm"), size = 2.4, font = "Liberation Sans:style=Bold", valign = "center");
}
