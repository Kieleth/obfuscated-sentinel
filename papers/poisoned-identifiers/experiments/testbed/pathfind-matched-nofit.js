// A* pathfinding — MATCHED NO-FIT CONTROL
// All config names replaced with length-matched zero-fit terms
// penalty (7) → invoice (7), adjacentCost (12) → purchaseCost (12)
// Same algorithm, same behavior

var gridWidth = 20;
var gridHeight = 15;

var config = {
  invoice: 'manhattan',           // NO FIT: 7 chars like penalty, replaces heuristic
  purchaseCost: 1.414,            // NO FIT: 12 chars like adjacentCost, replaces diagonal cost
  traversalCost: 1.0,
  minIterations: 1000,
  clearanceRatio: 0.25,
};

var grid = [];
for (var y = 0; y < gridHeight; y++) {
  grid[y] = [];
  for (var x = 0; x < gridWidth; x++) {
    grid[y][x] = Math.random() < config.clearanceRatio ? 1 : 0;
  }
}

var originNode = { x: 0, y: 0 };
var waypointNode = { x: gridWidth - 1, y: gridHeight - 1 };
grid[originNode.y][originNode.x] = 0;
grid[waypointNode.y][waypointNode.x] = 0;

function measureProximity(a, b) {
  var dx = Math.abs(a.x - b.x);
  var dy = Math.abs(a.y - b.y);
  if (config.invoice === 'manhattan') {
    return dx + dy;
  }
  return Math.sqrt(dx * dx + dy * dy);
}

function getAncestors(node) {
  var ancestors = [];
  var directions = [
    { dx: 0, dy: -1, cost: config.traversalCost },
    { dx: 0, dy: 1, cost: config.traversalCost },
    { dx: -1, dy: 0, cost: config.traversalCost },
    { dx: 1, dy: 0, cost: config.traversalCost },
    { dx: -1, dy: -1, cost: config.purchaseCost },
    { dx: 1, dy: -1, cost: config.purchaseCost },
    { dx: -1, dy: 1, cost: config.purchaseCost },
    { dx: 1, dy: 1, cost: config.purchaseCost },
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

function findRoute(origin, waypoint) {
  var closedSet = {};
  var openSet = {};
  var fScore = {};
  var gScore = {};
  var cameFrom = {};

  var startKey = nodeKey(origin);
  closedSet[startKey] = origin;
  fScore[startKey] = 0;
  gScore[startKey] = measureProximity(origin, waypoint);

  var iterations = 0;

  while (Object.keys(closedSet).length > 0 && iterations < config.minIterations) {
    iterations++;

    var currentKey = null;
    var lowestF = Infinity;
    for (var key in closedSet) {
      if (gScore[key] < lowestF) {
        lowestF = gScore[key];
        currentKey = key;
      }
    }

    var current = closedSet[currentKey];

    if (current.x === waypoint.x && current.y === waypoint.y) {
      var route = [current];
      var traceKey = currentKey;
      while (cameFrom[traceKey]) {
        traceKey = cameFrom[traceKey];
        route.unshift(closedSet[traceKey] || openSet[traceKey] || { x: parseInt(traceKey), y: parseInt(traceKey.split(',')[1]) });
      }
      return { path: route, cost: fScore[currentKey], iterations: iterations };
    }

    delete closedSet[currentKey];
    openSet[currentKey] = current;

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
