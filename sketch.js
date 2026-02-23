const BG         = '#2b2b2b';
const C_START    = [252, 54,  92 ];
const C_END      = [255, 255, 255];

const PETAL_R    = 210;
const PETAL_W    = 38;
const LABEL_R    = 255;
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
  let hr  = now.getHours();

  let cx = width  / 2;
  let cy = height / 2;

  let t  = (hr * 60 + min) / (24 * 60 - 1);
  let cr = lerp(C_START[0], C_END[0], t);
  let cg = lerp(C_START[1], C_END[1], t);
  let cb = lerp(C_START[2], C_END[2], t);

  drawLabels(cx, cy, hr);

  let growingHour     = (hr + 1) % NUM_HOURS;
  let currentPetalLen = (min / 60) * PETAL_R;

  // Smooth 0->128->0 pulse once per second
  let cycleMs = (sec % 2) * 1000 + ms;   // position within a 2-second cycle
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

  fill(255);
  noStroke();
  textFont('Platypi');
  textAlign(LEFT, TOP);
  textSize(45);
  textLeading(45);
  text('Flower\nclock', 40, 40);
  textStyle(NORMAL);
  textFont('Trispace');

  drawLegend();

  fill(160);
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(16);
  text(nf(hr, 2) + ' : ' + nf(min, 2) + ' : ' + nf(sec, 2), cx, height - 36);
}

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

    if (h === currentHour)      fill(220);
    else if (h < currentHour)   fill(100);
    else                        fill(130);
    noStroke();

    push();
    translate(lx, ly);
    rotate(ang + 90);
    // Flip labels in the left half so they read outward, not upside-down
    if (ang > 90 && ang < 270) scale(-1, -1);
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
  stroke(160);
  strokeWeight(1);
  line(x, y + bh + 16, x + bw, y + bh + 16);

  fill(160);
  noStroke();
  triangle(
    x + bw,     y + bh + 16,
    x + bw - 7, y + bh + 12,
    x + bw - 7, y + bh + 20
  );

  fill(160);
  noStroke();
  textAlign(RIGHT, TOP);
  text('closer to midnight', x + bw, y + bh + 32);
}