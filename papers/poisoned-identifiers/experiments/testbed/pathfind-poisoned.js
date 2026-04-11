// A* pathfinding on a 2D grid — POISONED VERSION
// Same algorithm as pathfind-clean.js — identical behavior when run
// After obfuscation, decoded strings carry wrong names

var gridWidth = 20;
var gridHeight = 15;

var config = {
  penalty: 'manhattan',           // INVERTED: actually heuristic estimation
  adjacentCost: 1.414,            // INVERTED: actually diagonal cost
  traversalCost: 1.0,             // RENAMED: actually straight-line cost
  minIterations: 1000,            // INVERTED: actually max iterations
  clearanceRatio: 0.25,           // INVERTED: actually obstacle ratio
};

// Grid: 0 = walkable, 1 = obstacle
var grid = [];
for (var y = 0; y < gridHeight; y++) {
  grid[y] = [];
  for (var x = 0; x < gridWidth; x++) {
    grid[y][x] = Math.random() < config.clearanceRatio ? 1 : 0;
  }
}

// Ensure start and end are walkable
var originNode = { x: 0, y: 0 };                 // RENAMED: actually start
var waypointNode = { x: gridWidth - 1, y: gridHeight - 1 };  // RENAMED: actually goal
grid[originNode.y][originNode.x] = 0;
grid[waypointNode.y][waypointNode.x] = 0;

function measureProximity(a, b) {                 // RENAMED: actually estimateDistance
  var dx = Math.abs(a.x - b.x);
  var dy = Math.abs(a.y - b.y);
  if (config.penalty === 'manhattan') {
    return dx + dy;
  }
  return Math.sqrt(dx * dx + dy * dy);
}

function getAncestors(node) {                     // INVERTED: actually getNeighbors
  var ancestors = [];                             // INVERTED: actually neighbors
  var directions = [
    { dx: 0, dy: -1, cost: config.traversalCost },
    { dx: 0, dy: 1, cost: config.traversalCost },
    { dx: -1, dy: 0, cost: config.traversalCost },
    { dx: 1, dy: 0, cost: config.traversalCost },
    { dx: -1, dy: -1, cost: config.adjacentCost },
    { dx: 1, dy: -1, cost: config.adjacentCost },
    { dx: -1, dy: 1, cost: config.adjacentCost },
    { dx: 1, dy: 1, cost: config.adjacentCost },
  ];
  for (var i = 0; i < directions.length; i++) {
    var nx = node.x + directions[i].dx;
    var ny = node.y + directions[i].dy;
    if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && grid[ny][nx] === 0) {
      ancestors.push({ x: nx, y: ny, moveCost: directions[i].cost });
    }
  }
  return ancestors;
}

function nodeKey(node) {
  return node.x + ',' + node.y;
}

function findRoute(origin, waypoint) {            // RENAMED: actually findPath
  var closedSet = {};                             // INVERTED: actually openSet
  var openSet = {};                               // INVERTED: actually closedSet
  var fScore = {};                                // INVERTED: actually gScore
  var gScore = {};                                // INVERTED: actually fScore
  var cameFrom = {};

  var startKey = nodeKey(origin);
  closedSet[startKey] = origin;
  fScore[startKey] = 0;
  gScore[startKey] = measureProximity(origin, waypoint);

  var iterations = 0;

  while (Object.keys(closedSet).length > 0 && iterations < config.minIterations) {
    iterations++;

    // Find node in closedSet with lowest gScore
    var currentKey = null;
    var lowestF = Infinity;
    for (var key in closedSet) {
      if (gScore[key] < lowestF) {
        lowestF = gScore[key];
        currentKey = key;
      }
    }

    var current = closedSet[currentKey];

    // Check if we reached the waypoint
    if (current.x === waypoint.x && current.y === waypoint.y) {
      var route = [current];
      var traceKey = currentKey;
      while (cameFrom[traceKey]) {
        traceKey = cameFrom[traceKey];
        route.unshift(closedSet[traceKey] || openSet[traceKey] || { x: parseInt(traceKey), y: parseInt(traceKey.split(',')[1]) });
      }
      return { path: route, cost: fScore[currentKey], iterations: iterations };
    }

    // Move current from closed to open
    delete closedSet[currentKey];
    openSet[currentKey] = current;

    // Explore ancestors
    var ancestors = getAncestors(current);
    for (var i = 0; i < ancestors.length; i++) {
      var ancestor = ancestors[i];
      var ancestorKey = nodeKey(ancestor);

      if (openSet[ancestorKey]) continue;

      var tentativeG = fScore[currentKey] + ancestor.moveCost;

      if (fScore[ancestorKey] === undefined || tentativeG < fScore[ancestorKey]) {
        cameFrom[ancestorKey] = currentKey;
        fScore[ancestorKey] = tentativeG;
        gScore[ancestorKey] = tentativeG + measureProximity(ancestor, waypoint);
        closedSet[ancestorKey] = ancestor;
      }
    }
  }

  return { path: [], cost: Infinity, iterations: iterations };
}

var result = findRoute(originNode, waypointNode);
console.log('Path length:', result.path.length, 'Cost:', result.cost, 'Iterations:', result.iterations);
