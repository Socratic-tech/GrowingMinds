// Growing Minds · Timelapse arm
// Zip-ties to a tower column (any diameter) and holds a phone at the same
// spot every week, so the photo journal's timelapse doesn't jump around.
//
// It works like the top of a tripod: a 1/4"-20 bolt points UP from the
// end of the arm. Screw on any phone tripod clamp (the clamp's bottom
// tripod hole), stand the phone up, and turn it to face the slot.
//
// Hardware: 2 zip ties (up to 5 mm wide), one 1/4"-20 bolt about 1/2"
// long, one 1/4"-20 hex nut (drops into the pocket under the arm).
// Print exactly as modeled (arm flat on the bed, plate standing up).
// PETG or PLA, 4 walls, 40% infill, no supports.

arm_len   = 110;  // tower-to-phone distance (mm); 100-140 frames one slot
mount_w   = 40;   // plate width
mount_t   = 10;   // plate thickness
mount_h   = 55;   // plate height
arm_w     = 24;
arm_t     = 10;
groove    = 26;   // V-groove that self-centers on the round column
tie_w     = 5.5;
tie_t     = 2.4;
bolt_d    = 6.8;  // 1/4" clearance
nut_af    = 11.4; // 7/16" nut across flats + clearance
nut_depth = 5.5;
$fn = 48;

module plate() {
  difference() {
    translate([-mount_w / 2, 0, 0]) cube([mount_w, mount_t, mount_h]);
    // vertical V-groove on the face that touches the column
    translate([0, 0, -1]) linear_extrude(mount_h + 2)
      polygon([[-groove / 2, -0.01], [groove / 2, -0.01], [0, groove / 3.2]]);
    // zip-tie slots straight through the plate
    for (z = [12, mount_h - 12 - tie_w])
      translate([-mount_w / 2 - 1, mount_t * 0.62, z]) cube([mount_w + 2, tie_t, tie_w]);
  }
}

module arm() {
  difference() {
    union() {
      hull() {
        translate([-arm_w / 2, mount_t - 0.01, 0]) cube([arm_w, 1, arm_t]);
        translate([0, mount_t + arm_len, 0]) cylinder(d = arm_w, h = arm_t);
      }
      // gusset between plate and arm
      hull() {
        translate([-arm_w / 2 + 3, mount_t - 0.01, 0]) cube([arm_w - 6, 1, mount_h * 0.7]);
        translate([-arm_w / 2 + 3, mount_t + arm_len * 0.45, 0]) cube([arm_w - 6, 1, arm_t]);
      }
    }
    translate([0, mount_t + arm_len, -1]) cylinder(d = bolt_d, h = arm_t + 2);
    translate([0, mount_t + arm_len, -0.01]) cylinder(d = nut_af / cos(30), h = nut_depth, $fn = 6);
  }
}

plate();
arm();
