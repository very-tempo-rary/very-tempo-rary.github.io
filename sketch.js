// ── Test animation without waiting for midnight ─────
/* function keyPressed() {
  if (key === ' ') {
    fallTriggerDay = -1;   // reset so it can fire again
    initFall(width / 2, height / 2);
  }
} */

const BG         = '#2b2b2b';
const C_START    = [252, 54,  92 ];
const C_END      = [255, 255, 255];

const PETAL_R    = 210;
const PETAL_W    = 38;
const LABEL_R    = 255;
const NUM_HOURS  = 24;

// ── Midnight fall state ───────────────────────────
let fallingPetals    = [];
let fallTriggered    = false;
let fallTriggerDay   = -1;   // tracks which calendar day the fall was triggered
let allLandedTime    = -1;   // millis() when the last petal landed

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textFont('Trispace');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(BG);

  let now = new Date();
  let ms  = now.getMilliseconds();
  let sec = now.getSeconds();
  let min = now.getMinutes();
  let hr  = now.getHours();

  let cx = width  / 2;
  let cy = height / 2;

  // ── Flower color for the current moment ───────────
  let t  = (hr * 60 + min) / (24 * 60 - 1);
  let cr = lerp(C_START[0], C_END[0], t);
  let cg = lerp(C_START[1], C_END[1], t);
  let cb = lerp(C_START[2], C_END[2], t);

  // ── Trigger midnight fall at 00:00:05 ─────────────
  let today = now.getDate();
  if (hr === 0 && min === 0 && sec >= 5 && fallTriggerDay !== today) {
    fallTriggerDay = today;
    initFall(cx, cy);
  }

  // ── Draw falling ghost petals (behind live flower) ─
  drawFallingPetals();

  // ── Hour labels ───────────────────────────────────
  drawLabels(cx, cy, hr);

  // ── Live flower petals ────────────────────────────
  let growingHour     = (hr + 1) % NUM_HOURS;
  let currentPetalLen = (min / 60) * PETAL_R;

  let cycleMs = (sec % 2) * 1000 + ms;
  let pulse   = 64 * (1 - Math.cos(2 * Math.PI * cycleMs / 2000));

  for (let h = 0; h < NUM_HOURS; h++) {
    let len, col;
    if (h <= hr) {
      len = PETAL_R;
      col = color(cr, cg, cb, 128);
    } else if (h === growingHour) {
      len = currentPetalLen;
      col = color(cr, cg, cb, pulse);
    } else {
      continue;
    }
    if (len < 1) continue;
    drawPetal(cx, cy, hoursToAngle(h), len, col);
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

  // ── Legend ────────────────────────────────────────
  drawLegend();

  // ── Digital time ──────────────────────────────────
  fill(180);
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(16);
  textStyle(NORMAL);
  text(nf(hr, 2) + ' : ' + nf(min, 2) + ' : ' + nf(sec, 2), cx, height - 36);
}

// ── Initialise the falling ghost petals ──────────────
// Called once at 00:00:05. Captures all 24 full-length petals
// in the end-of-day near-white colour, and gives each one
// randomised physics so they fall independently.
function initFall(cx, cy) {
  fallingPetals = [];
  allLandedTime = -1;

  // End-of-day colour: t ≈ 1  (23:59)
  let tEnd = (23 * 60 + 59) / (24 * 60 - 1);
  let er   = lerp(C_START[0], C_END[0], tEnd);
  let eg   = lerp(C_START[1], C_END[1], tEnd);
  let eb   = lerp(C_START[2], C_END[2], tEnd);

  for (let h = 0; h < NUM_HOURS; h++) {
    fallingPetals.push({
      ang  : hoursToAngle(h),
      // Current world position of the petal base (starts at flower centre)
      x    : cx,
      y    : cy,
      // Velocity — mostly downward, slight horizontal scatter
      vx   : random(-1.5, 1.5),
      vy   : random(1, 4),
      // Extra rotation accumulated during fall (degrees)
      rot  : 0,
      vrot : random(-1.5, 1.5),
      // Physics
      gravity : random(0.15, 0.35),
      // State
      landed   : false,
      alpha    : 128,
      r : er, g : eg, b : eb,
      // Small random delay before each petal starts moving (ms)
      startDelay : random(0, 400),
      startTime  : millis()
    });
  }
}

// ── Advance physics and draw all falling petals ───────
function drawFallingPetals() {
  if (fallingPetals.length === 0) return;

  let now          = millis();
  let allLanded    = true;
  let FLOOR        = height - 40;   // y-coordinate of the "ground"

  for (let p of fallingPetals) {
    // Respect per-petal start delay
    if (now - p.startTime < p.startDelay) {
      allLanded = false;
      // Draw at original position while waiting
      let col = color(p.r, p.g, p.b, p.alpha);
      drawPetal(p.x, p.y, p.ang, PETAL_R, col);
      continue;
    }

    if (!p.landed) {
      // Apply gravity
      p.vy  += p.gravity;
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.vrot;

      // Land when the petal base reaches the floor
      // (the tip extends PETAL_R further, so base lands a bit above floor)
      let floorForBase = FLOOR - PETAL_R * 0.3;
      if (p.y >= floorForBase) {
        p.y      = floorForBase;
        p.landed = true;
        p.vx     = 0;
        p.vy     = 0;
        p.vrot   = 0;
      }
      allLanded = false;
    }

    // Dissolve phase: 2 s rest, then 5 s fade
    if (allLandedTime > 0) {
      let elapsed = now - allLandedTime;
      if (elapsed > 2000) {
        // Fade over 5000 ms
        let fadeFrac = constrain((elapsed - 2000) / 5000, 0, 1);
        p.alpha = lerp(128, 0, fadeFrac);
      }
    }

    if (p.alpha <= 0) continue;

    let col = color(p.r, p.g, p.b, p.alpha);
    drawPetal(p.x, p.y, p.ang + p.rot, PETAL_R, col);
  }

  // Record when the last petal landed
  if (allLanded && allLandedTime < 0) {
    allLandedTime = now;
  }

  // Clean up once fully dissolved
  let allDone = fallingPetals.every(p => p.alpha <= 0 && p.landed);
  if (allDone) fallingPetals = [];
}

// ── Helpers ──────────────────────────────────────────
function hoursToAngle(h) {
  return -90 + h * (360 / NUM_HOURS);
}

function drawPetal(cx, cy, angleDeg, len, col) {
  if (len < 1) return;
  let w = (len / PETAL_R) * PETAL_W;
  push();
  translate(cx, cy);
  rotate(angleDeg + 90);
  fill(col);
  noStroke();
  beginShape();
  vertex(0, 0);
  bezierVertex( w, -len * 0.25,  w, -len * 0.75, 0, -len);
  bezierVertex(-w, -len * 0.75, -w, -len * 0.25, 0,  0);
  endShape(CLOSE);
  pop();
}

function drawLabels(cx, cy, currentHour) {
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(NORMAL);

  for (let h = 0; h < NUM_HOURS; h++) {
    let ang = hoursToAngle(h);
    let lx  = cx + LABEL_R * cos(ang);
    let ly  = cy + LABEL_R * sin(ang);

    if (h === currentHour)    fill(255);
    else if (h < currentHour) fill(120);
    else                      fill(180);
    noStroke();

    push();
    translate(lx, ly);
    // Top labels (18→0→6, ang ≤ 0 or ang ≥ 180): tops point away from center
    // Bottom labels (7→17, 0 < ang < 180): tops point toward center (petals)
    if (ang > 0 && ang < 180) {
      rotate(ang - 90);
    } else {
      rotate(ang + 90);
    }
    text(nf(h, 2), 0, 0);
    pop();
  }
}

function drawLegend() {
  textFont('Trispace');
  textSize(16);
  let bw = textWidth('closer to midnight');
  let bh = 16;
  let x  = windowWidth - bw - 40;
  let y  = 40;

  noStroke();
  for (let i = 0; i <= bw; i++) {
    let tt = i / bw;
    let r  = lerp(C_START[0], C_END[0], tt);
    let g  = lerp(C_START[1], C_END[1], tt);
    let b  = lerp(C_START[2], C_END[2], tt);
    fill(r, g, b, 255);
    rect(x + i, y, 1, bh);
  }

  noFill();
  stroke(180);
  strokeWeight(1);
  line(x, y + bh + 16, x + bw, y + bh + 16);

  fill(180);
  noStroke();
  triangle(
    x + bw,     y + bh + 16,
    x + bw - 7, y + bh + 12,
    x + bw - 7, y + bh + 20
  );

  fill(180);
  noStroke();
  textAlign(RIGHT, TOP);
  text('closer to midnight', x + bw, y + bh + 32);
}
