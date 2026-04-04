// Force-directed graph with particle system and camera
// ~130 lines — complex enough to be interesting, small enough to iterate

var TAU = Math.PI * 2;
var config = {
  repulsion: 4000,
  springK: 0.004,
  damping: 0.92,
  gravity: 0.0003,
  particleMax: 40,
  particleFade: 0.04,
  cameraEase: 0.06,
};

var nodes = [
  { id: 'hub', label: 'Hub', r: 26, x: 400, y: 300, vx: 0, vy: 0 },
  { id: 'alpha', label: 'Alpha', r: 16, x: 500, y: 200, vx: 0, vy: 0 },
  { id: 'beta', label: 'Beta', r: 16, x: 300, y: 400, vx: 0, vy: 0 },
  { id: 'gamma', label: 'Gamma', r: 14, x: 250, y: 180, vx: 0, vy: 0 },
  { id: 'delta', label: 'Delta', r: 14, x: 550, y: 380, vx: 0, vy: 0 },
  { id: 'epsilon', label: 'Epsilon', r: 12, x: 350, y: 150, vx: 0, vy: 0 },
];

var edges = [
  { a: 'hub', b: 'alpha', rest: 160, k: 0.006 },
  { a: 'hub', b: 'beta', rest: 160, k: 0.005 },
  { a: 'hub', b: 'gamma', rest: 170, k: 0.004 },
  { a: 'hub', b: 'delta', rest: 170, k: 0.004 },
  { a: 'hub', b: 'epsilon', rest: 180, k: 0.003 },
  { a: 'alpha', b: 'beta', rest: 200, k: 0.002 },
  { a: 'gamma', b: 'delta', rest: 220, k: 0.002 },
  { a: 'alpha', b: 'epsilon', rest: 200, k: 0.002 },
];

var camera = { x: 400, y: 300, zoom: 1.0 };
var target = { x: 400, y: 300, zoom: 1.0 };
var particles = [];
var frame = 0;

function nodeById(id) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return nodes[i];
  }
  return null;
}

function simulate() {
  for (var i = 0; i < nodes.length; i++) {
    for (var j = i + 1; j < nodes.length; j++) {
      var dx = nodes[i].x - nodes[j].x;
      var dy = nodes[i].y - nodes[j].y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var force = config.repulsion / (dist * dist);
      var fx = (dx / dist) * force;
      var fy = (dy / dist) * force;
      nodes[i].vx += fx; nodes[i].vy += fy;
      nodes[j].vx -= fx; nodes[j].vy -= fy;
    }
  }
  for (var e = 0; e < edges.length; e++) {
    var a = nodeById(edges[e].a);
    var b = nodeById(edges[e].b);
    if (!a || !b) continue;
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var disp = dist - edges[e].rest;
    var force = (edges[e].k || config.springK) * disp;
    a.vx += (dx / dist) * force; a.vy += (dy / dist) * force;
    b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force;
  }
  for (var n = 0; n < nodes.length; n++) {
    nodes[n].vx += (400 - nodes[n].x) * config.gravity;
    nodes[n].vy += (300 - nodes[n].y) * config.gravity;
    nodes[n].vx *= config.damping;
    nodes[n].vy *= config.damping;
    nodes[n].x += nodes[n].vx;
    nodes[n].y += nodes[n].vy;
  }
}

function spawnParticle() {
  if (particles.length >= config.particleMax) return;
  var src = nodes[Math.floor(Math.random() * nodes.length)];
  var angle = Math.random() * TAU;
  var speed = 0.3 + Math.random() * 0.7;
  particles.push({
    x: src.x, y: src.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    age: 0, maxAge: 800 + Math.random() * 1200,
    size: 0.8 + Math.random() * 1.2,
  });
}

function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.vx *= 0.995; p.vy *= 0.995;
    p.x += p.vx; p.y += p.vy;
    p.age++;
    if (p.age > p.maxAge) particles.splice(i, 1);
  }
}

function updateCamera() {
  camera.x += (target.x - camera.x) * config.cameraEase;
  camera.y += (target.y - camera.y) * config.cameraEase;
  camera.zoom += (target.zoom - camera.zoom) * config.cameraEase;
}

function tick() {
  simulate();
  updateParticles();
  updateCamera();
  if (frame % 3 === 0) spawnParticle();
  frame++;
}

setInterval(tick, 16);
