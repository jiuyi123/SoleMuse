const DEFAULT_DIAMETER = 64;
const COVERAGE_MARGIN = 16;

function calculateCircularReveal(rect, viewport, diameter = DEFAULT_DIAMETER) {
  const viewportWidth = Number(viewport && viewport.windowWidth) || 375;
  const viewportHeight = Number(viewport && viewport.windowHeight) || 667;
  const centerX = rect ? Number(rect.left) + Number(rect.width) / 2 : viewportWidth / 2;
  const centerY = rect ? Number(rect.top) + Number(rect.height) / 2 : viewportHeight;
  const farthestCorner = Math.max(
    Math.hypot(centerX, centerY),
    Math.hypot(viewportWidth - centerX, centerY),
    Math.hypot(centerX, viewportHeight - centerY),
    Math.hypot(viewportWidth - centerX, viewportHeight - centerY),
  );

  return {
    centerX,
    centerY,
    scale: (farthestCorner * 2 + COVERAGE_MARGIN) / diameter,
  };
}

module.exports = calculateCircularReveal;
