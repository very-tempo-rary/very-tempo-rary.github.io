const BG         = '#2b2b2b';
const C_START    = [252, 54,  92 ];   // #FC365C  — just after midnight
const C_END      = [255, 255, 255];   // #FFFFFF  — approaching midnight

const PETAL_R    = 210;   // max petal length from centre
const PETAL_W    = 38;    // max petal half-width at widest point
const LABEL_R    = 255;   // radius of hour labels
const NUM_HOURS  = 24;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textFont('Trispace');
}

function draw() {
  background(BG);

  let now = new Date();
  let ms  = now.getMilliseconds();
  let sec = now.getSeconds();
  let min = now.getMinutes();
  let hr  = now.getHours();   // 0-23

  let cx = width  / 2;
  let cy = height / 2;

  // ── Flower color ──────────────────────────────────
  // t=0 at 00:00 (red), t=1 at 23:59 (white)
  let t  = (hr * 60 + min) / (24 * 60 - 1);
  let cr = lerp(C_START[0], C_END[0], t);
  let cg = lerp(C_START[1], C_END[1], t);
  let cb = lerp(C_START[2], C_END[2], t);
  // 50% opacity = alpha 128
  let petalCol = color(cr, cg, cb, 128);

  // ── Hour labels (drawn first, behind petals) ──────
  drawLabels(cx, cy, hr);

  // ── Petals for each hour ──────────────────────────
  // Petals 0..hr are full (the current hour is complete at H:00).
  // Petal hr+1 is the one currently growing.
  let growingHour  = (hr + 1) % NUM_HOURS;
  let currentPetalLen = (min / 60) * PETAL_R;

  for (let h = 0; h < NUM_HOURS; h++) {
    let len;
    if (h <= hr) {
      len = PETAL_R;                           // current + past hours: full
    } else if (h === growingHour) {
      len = currentPetalLen;                   // next hour: growing
    } else {
      continue;                                // future: skip
    }
    if (len < 1) continue;

    let ang = hoursToAngle(h);
    drawPetal(cx, cy, ang, len, petalCol);
  }

  // ── Seconds petal ─────────────────────────────────
  // Grows from 0 → currentPetalLen over one second,
  // then dissolves (fades out) so it resets smoothly.
  if (currentPetalLen > 2) {
    let secProgress = ms / 1000;                     // 0→1 within the second
    let secLen      = secProgress * currentPetalLen; // grows to full petal length
    let secAlpha    = (1 - secProgress) * 200;       // fades out as second ends
    let secCol      = color(cr, cg, cb, secAlpha);
    let ang         = hoursToAngle(growingHour);
    drawPetal(cx, cy, ang, secLen, secCol);
  }

  // ── Title ─────────────────────────────────────────
  fill(255);
  noStroke();
  textFont('Platypi');
  textAlign(LEFT, TOP);
  textSize(45);
  textLeading(45);
  text('Flower\nclock', 40, 40);
  textStyle(NORMAL);
  textFont('Trispace');

  // ── Legend (top right) ────────────────────────────
  drawLegend();

  // ── Digital time (bottom centre) ─────────────────
  fill(160);
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(16);
  textStyle(NORMAL);
  text(nf(hr, 2) + ' : ' + nf(min, 2) + ' : ' + nf(sec, 2), cx, height - 36);
}

// ── Angle for a given hour (0=top, clockwise) ────────
function hoursToAngle(h) {
  // 0 h → top (-90°), each hour = 15°
  return -90 + h * (360 / NUM_HOURS);
}

// ── Draw a single lens-shaped petal ──────────────────
// cx,cy = origin; angleDeg = direction petal points;
// len = length; col = p5 color object
function drawPetal(cx, cy, angleDeg, len, col) {
  if (len < 1) return;

  // Width scales proportionally with length
  let w = (len / PETAL_R) * PETAL_W;

  push();
  translate(cx, cy);
  // Rotate so petal points in the correct direction.
  // We draw the petal along the -y axis (pointing "up"),
  // so we add 90° to convert from standard angle.
  rotate(angleDeg + 90);

  fill(col);
  noStroke();

  // Lens / vesica shape: two mirrored cubic bezier curves
  // Base at (0, 0), tip at (0, -len)
  beginShape();
  vertex(0, 0);
  bezierVertex( w, -len * 0.25,  w, -len * 0.75, 0, -len);
  bezierVertex(-w, -len * 0.75, -w, -len * 0.25, 0,  0);
  endShape(CLOSE);

  pop();
}

// ── Hour labels arranged in a circle ─────────────────
function drawLabels(cx, cy, currentHour) {
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(NORMAL);

  for (let h = 0; h < NUM_HOURS; h++) {
    let ang = hoursToAngle(h);
    let lx  = cx + LABEL_R * cos(ang);
    let ly  = cy + LABEL_R * sin(ang);

    // Current and near-future hours brighter, past hours dimmer
    if (h === currentHour) {
      fill(220);
    } else if (h < currentHour) {
      fill(100);
    } else {
      fill(130);
    }
    noStroke();

    // Rotate each label to follow the circle
    push();
    translate(lx, ly);
    rotate(ang + 90);
    text(nf(h, 2), 0, 0);
    pop();
  }
}

// ── Colour legend (top right) ────────────────────────
function drawLegend() {
  textSize(16);
  let bw = textWidth('closer to midnight');
  let bh = 16;
  let x  = windowWidth - bw - 40;
  let y  = 40;

  // Gradient bar: draw as thin vertical strips
  noStroke();
  for (let i = 0; i <= bw; i++) {
    let tt = i / bw;
    let r  = lerp(C_START[0], C_END[0], tt);
    let g  = lerp(C_START[1], C_END[1], tt);
    let b  = lerp(C_START[2], C_END[2], tt);
    noStroke();
    fill(r, g, b, 255);
    rect(x + i, y, 1, bh);
  }

  // Arrow line below
  noFill();
  stroke(160);
  strokeWeight(1);
  line(x, y + bh + 16, x + bw, y + bh + 16);
  
  // Arrowhead
  fill(160);
  noStroke();
  triangle(
    x + bw,         y + bh + 5 + 11,
    x + bw - 7,     y + bh + 1 + 11,
    x + bw - 7,     y + bh + 9 +  11
  );

  // Label
  fill(160);
  noStroke();
  textAlign(RIGHT, TOP);
  text('closer to midnight', x + bw, y + bh + 32);
}