// A* pathfinding on a 2D grid
// Clean version with correct variable names

var gridWidth = 20;
var gridHeight = 15;

var config = {
  heuristic: 'manhattan',     // distance estimation method
  diagonalCost: 1.414,        // sqrt(2) for diagonal moves
  straightCost: 1.0,          // cost of horizontal/vertical move
  maxIterations: 1000,        // safety limit
  obstacleRatio: 0.25,        // fraction of cells blocked
};

// Grid: 0 = walkable, 1 = obstacle
var grid = [];
for (var y = 0; y < gridHeight; y++) {
  grid[y] = [];
  for (var x = 0; x < gridWidth; x++) {
    grid[y][x] = Math.random() < config.obstacleRatio ? 1 : 0;
  }
}

// Ensure start and end are walkable
var startNode = { x: 0, y: 0 };
var goalNode = { x: gridWidth - 1, y: gridHeight - 1 };
grid[startNode.y][startNode.x] = 0;
grid[goalNode.y][goalNode.x] = 0;

function estimateDistance(a, b) {
  var dx = Math.abs(a.x - b.x);
  var dy = Math.abs(a.y - b.y);
  if (config.heuristic === 'manhattan') {
    return dx + dy;
  }
  return Math.sqrt(dx * dx + dy * dy);
}

function getNeighbors(node) {
  var neighbors = [];
  var directions = [
    { dx: 0, dy: -1, cost: config.straightCost },
    { dx: 0, dy: 1, cost: config.straightCost },
    { dx: -1, dy: 0, cost: config.straightCost },
    { dx: 1, dy: 0, cost: config.straightCost },
    { dx: -1, dy: -1, cost: config.diagonalCost },
    { dx: 1, dy: -1, cost: config.diagonalCost },
    { dx: -1, dy: 1, cost: config.diagonalCost },
    { dx: 1, dy: 1, cost: config.diagonalCost },
  ];
  for (var i = 0; i < directions.length; i++) {
    var nx = node.x + directions[i].dx;
    var ny = node.y + directions[i].dy;
    if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && grid[ny][nx] === 0) {
      neighbors.push({ x: nx, y: ny, moveCost: directions[i].cost });
    }
  }
  return neighbors;
}

function nodeKey(node) {
  return node.x + ',' + node.y;
}

function findPath(start, goal) {
  var openSet = {};
  var closedSet = {};
  var gScore = {};
  var fScore = {};
  var cameFrom = {};

  var startKey = nodeKey(start);
  openSet[startKey] = start;
  gScore[startKey] = 0;
  fScore[startKey] = estimateDistance(start, goal);

  var iterations = 0;

  while (Object.keys(openSet).length > 0 && iterations < config.maxIterations) {
    iterations++;

    // Find node in openSet with lowest fScore
    var currentKey = null;
    var lowestF = Infinity;
    for (var key in openSet) {
      if (fScore[key] < lowestF) {
        lowestF = fScore[key];
        currentKey = key;
      }
    }

    var current = openSet[currentKey];

    // Check if we reached the goal
    if (current.x === goal.x && current.y === goal.y) {
      var path = [current];
      var traceKey = currentKey;
      while (cameFrom[traceKey]) {
        traceKey = cameFrom[traceKey];
        path.unshift(openSet[traceKey] || closedSet[traceKey] || { x: parseInt(traceKey), y: parseInt(traceKey.split(',')[1]) });
      }
      return { path: path, cost: gScore[currentKey], iterations: iterations };
    }

    // Move current from open to closed
    delete openSet[currentKey];
    closedSet[currentKey] = current;

    // Explore neighbors
    var neighbors = getNeighbors(current);
    for (var i = 0; i < neighbors.length; i++) {
      var neighbor = neighbors[i];
      var neighborKey = nodeKey(neighbor);

      if (closedSet[neighborKey]) continue;

      var tentativeG = gScore[currentKey] + neighbor.moveCost;

      if (gScore[neighborKey] === undefined || tentativeG < gScore[neighborKey]) {
        cameFrom[neighborKey] = currentKey;
        gScore[neighborKey] = tentativeG;
        fScore[neighborKey] = tentativeG + estimateDistance(neighbor, goal);
        openSet[neighborKey] = neighbor;
      }
    }
  }

  return { path: [], cost: Infinity, iterations: iterations };
}

var result = findPath(startNode, goalNode);
console.log('Path length:', result.path.length, 'Cost:', result.cost, 'Iterations:', result.iterations);
