export const LAYOUT = {
  ROOT_X: 80,
  SCENARIO_X: 480,
  RECOVERY_X: 880,
  NODE_VERTICAL_GAP: 220,
  RECOVERY_VERTICAL_GAP: 140,
  ROOT_WIDTH: 300,
  ROOT_HEIGHT: 140,
  SCENARIO_WIDTH: 260,
  SCENARIO_HEIGHT: 180,
  RECOVERY_WIDTH: 200,
  RECOVERY_HEIGHT: 120,
};

export function computeHorizontalLayout(tree, viewportWidth, viewportHeight) {
  const { rootId, nodesByParent, nodes } = tree;
  const positions = {};
  const canvasCenterY = viewportHeight / 2;

  positions[rootId] = {
    x: LAYOUT.ROOT_X,
    y: canvasCenterY - LAYOUT.ROOT_HEIGHT / 2,
    width: LAYOUT.ROOT_WIDTH,
    height: LAYOUT.ROOT_HEIGHT,
  };

  const scenarios = nodesByParent[rootId] || [];
  const scenarioCount = scenarios.length;
  scenarios.forEach((sid, i) => {
    const offsetFromCenter =
      i - (scenarioCount - 1) / 2;
    const y =
      canvasCenterY -
      LAYOUT.SCENARIO_HEIGHT / 2 +
      offsetFromCenter * LAYOUT.NODE_VERTICAL_GAP;
    positions[sid] = {
      x: LAYOUT.SCENARIO_X,
      y,
      width: LAYOUT.SCENARIO_WIDTH,
      height: LAYOUT.SCENARIO_HEIGHT,
    };
  });

  scenarios.forEach((sid) => {
    const recoveries = nodesByParent[sid] || [];
    const parentPos = positions[sid];
    const parentCenterY = parentPos.y + LAYOUT.SCENARIO_HEIGHT / 2;
    const recoveryCount = recoveries.length;
    recoveries.forEach((rid, i) => {
      const offsetFromCenter =
        i - (recoveryCount - 1) / 2;
      const y =
        parentCenterY -
        LAYOUT.RECOVERY_HEIGHT / 2 +
        offsetFromCenter * LAYOUT.RECOVERY_VERTICAL_GAP;
      positions[rid] = {
        x: LAYOUT.RECOVERY_X,
        y,
        width: LAYOUT.RECOVERY_WIDTH,
        height: LAYOUT.RECOVERY_HEIGHT,
      };
    });
  });

  return positions;
}

export function buildEdges(tree) {
  const edges = [];
  const { rootId, nodesByParent } = tree;
  const walk = (parentId) => {
    const children = nodesByParent[parentId] || [];
    children.forEach((childId) => {
      edges.push([parentId, childId]);
      walk(childId);
    });
  };
  walk(rootId);
  return edges;
}

export function computeTreeBounds(positions) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pos of Object.values(positions)) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function fitToView(positions, viewportWidth, viewportHeight, padding = 0.1) {
  const bounds = computeTreeBounds(positions);
  if (bounds.width === 0 || bounds.height === 0) {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }

  const padW = viewportWidth * padding;
  const padH = viewportHeight * padding;
  const availW = viewportWidth - padW * 2;
  const availH = viewportHeight - padH * 2;

  const zoom = Math.min(availW / bounds.width, availH / bounds.height, 1.5);
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;

  return {
    pan: {
      x: viewportWidth / 2 - centerX * zoom,
      y: viewportHeight / 2 - centerY * zoom,
    },
    zoom,
  };
}
