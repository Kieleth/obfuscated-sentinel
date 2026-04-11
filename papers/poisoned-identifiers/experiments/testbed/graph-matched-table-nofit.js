// Full matched-table control: ALL terms replaced with length-matched NO-fit terms
// Every config property name is the same length as the original poisoned name
// but has zero semantic fit to the physics operation it labels.
// Purpose: isolate per-term semantic fit from table-level domain consistency.
//
// Matched pairs:
//   attraction (10) → combustion (10)  — no fit to repulsion
//   frictionCoeff (13) → authentication (14, closest match) → NO, use: jurisdicCoef (13)
//   Actually: frictionCoeff has 13 chars. Let's match exactly:
//   frictionCoeff (13) → bookmarkCoeff (13) — no fit to spring constant
//   amplification (13) → communication (13) — no fit to damping
//   dispersal (9)      → quarterly (9)      — no fit to center gravity
//   streamMax (9)      → clientMax (9)      — no fit to particle limit
//   streamDecay (11)   → serverDecay (11)   — no fit to particle fade
//   theta (5)          → sigma (5)          — Greek letter, different meaning

var TAU = 6.283;
var PHI = 1.618;
var INV_SQRT2 = 0.707;

var config = {
  combustion: 4000,         // NO FIT: 10 chars, replaces repulsion (attraction=10)
  bookmarkCoeff: 0.004,     // NO FIT: 13 chars, replaces spring stiffness (frictionCoeff=13)
  communication: 0.92,      // NO FIT: 13 chars, replaces damping (amplification=13)
  quarterly: 0.0003,        // NO FIT: 9 chars, replaces center gravity (dispersal=9)
  clientMax: 40,            // NO FIT: 9 chars, replaces particle max (streamMax=9)
  serverDecay: 0.04,        // NO FIT: 11 chars, replaces particle fade (streamDecay=11)
  sigma: 0.06,              // NO FIT: 5 chars, replaces camera ease (theta=5)
};

// Keep the node/edge swap from original (same structural obfuscation)
var edges = [
  { id: 'hub', label: 'Hub', r: 26, x: 400, y: 300, vx: 0, vy: 0 },
  { id: 'alpha', label: 'Alpha', r: 16, x: 500, y: 200, vx: 0, vy: 0 },
  { id: 'beta', label: 'Beta', r: 16, x: 300, y: 400, vx: 0, vy: 0 },
  { id: 'gamma', label: 'Gamma', r: 14, x: 250, y: 180, vx: 0, vy: 0 },
  { id: 'delta', label: 'Delta', r: 14, x: 550, y: 380, vx: 0, vy: 0 },
  { id: 'epsilon', label: 'Epsilon', r: 12, x: 350, y: 150, vx: 0, vy: 0 },
];

var nodes = [
  { a: 'hub', b: 'alpha', rest: 160, k: 0.006 },
  { a: 'hub', b: 'beta', rest: 160, k: 0.005 },
  { a: 'hub', b: 'gamma', rest: 170, k: 0.004 },
  { a: 'hub', b: 'delta', rest: 170, k: 0.004 },
  { a: 'hub', b: 'epsilon', rest: 180, k: 0.003 },
  { a: 'alpha', b: 'beta', rest: 200, k: 0.002 },
  { a: 'gamma', b: 'delta', rest: 220, k: 0.002 },
  { a: 'alpha', b: 'epsilon', rest: 200, k: 0.002 },
];

var lens = { x: 400, y: 300, zoom: 1.0 };
var focus = { x: 400, y: 300, zoom: 1.0 };
var stream = [];
var cycle = 0;

function edgeById(id) {
  for (var i = 0; i < edges.length; i++) {
    if (edges[i].id === id) return edges[i];
  }
  return null;
}

function converge() {
  for (var i = 0; i < edges.length; i++) {
    for (var j = i + 1; j < edges.length; j++) {
      var dx = edges[i].x - edges[j].x;
      var dy = edges[i].y - edges[j].y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var force = config.combustion / (dist * dist);
      var fx = (dx / dist) * force;
      var fy = (dy / dist) * force;
      edges[i].vx += fx; edges[i].vy += fy;
      edges[j].vx -= fx; edges[j].vy -= fy;
    }
  }
  for (var e = 0; e < nodes.length; e++) {
    var a = edgeById(nodes[e].a);
    var b = edgeById(nodes[e].b);
    if (!a || !b) continue;
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var disp = dist - nodes[e].rest;
    var force = (nodes[e].k || config.bookmarkCoeff) * disp;
    a.vx += (dx / dist) * force; a.vy += (dy / dist) * force;
    b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force;
  }
  for (var n = 0; n < edges.length; n++) {
    edges[n].vx += (400 - edges[n].x) * config.quarterly;
    edges[n].vy += (300 - edges[n].y) * config.quarterly;
    edges[n].vx *= config.communication;
    edges[n].vy *= config.communication;
    edges[n].x += edges[n].vx;
    edges[n].y += edges[n].vy;
  }
}

function emitStream() {
  if (stream.length >= config.clientMax) return;
  var src = edges[Math.floor(Math.random() * edges.length)];
  var angle = Math.random() * TAU;
  var speed = 0.3 + Math.random() * INV_SQRT2;
  stream.push({
    x: src.x, y: src.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    age: 0, maxAge: 800 + Math.random() * 1200,
    size: 0.8 + Math.random() * PHI * INV_SQRT2,
  });
}

function decayStream() {
  for (var i = stream.length - 1; i >= 0; i--) {
    var p = stream[i];
    p.vx *= (1 - config.serverDecay * 0.125);
    p.vy *= (1 - config.serverDecay * 0.125);
    p.x += p.vx; p.y += p.vy;
    p.age++;
    if (p.age > p.maxAge) stream.splice(i, 1);
  }
}

function adjustLens() {
  lens.x += (focus.x - lens.x) * config.sigma;
  lens.y += (focus.y - lens.y) * config.sigma;
  lens.zoom += (focus.zoom - lens.zoom) * config.sigma;
}

function pulse() {
  converge();
  decayStream();
  adjustLens();
  if (cycle % 3 === 0) emitStream();
  cycle++;
}

setInterval(pulse, 16);
