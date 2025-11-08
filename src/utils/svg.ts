import { Shape, Point } from '../types';

export function parseSVG(svgText: string): Shape[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const shapes: Shape[] = [];

  // Parse rectangles
  const rects = doc.querySelectorAll('rect');
  rects.forEach((rect, index) => {
    const x = parseFloat(rect.getAttribute('x') || '0');
    const y = parseFloat(rect.getAttribute('y') || '0');
    const width = parseFloat(rect.getAttribute('width') || '0');
    const height = parseFloat(rect.getAttribute('height') || '0');
    const stroke = rect.getAttribute('stroke') || '#000000';
    const fill = rect.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(rect.getAttribute('stroke-width') || '2');

    shapes.push({
      id: `svg-rect-${Date.now()}-${index}`,
      type: 'rectangle',
      points: [],
      x,
      y,
      width,
      height,
      strokeColor: stroke === 'none' ? 'transparent' : stroke,
      fillColor: fill === 'none' ? 'transparent' : fill,
      strokeWidth,
    });
  });

  // Parse circles
  const circles = doc.querySelectorAll('circle');
  circles.forEach((circle, index) => {
    const cx = parseFloat(circle.getAttribute('cx') || '0');
    const cy = parseFloat(circle.getAttribute('cy') || '0');
    const r = parseFloat(circle.getAttribute('r') || '0');
    const stroke = circle.getAttribute('stroke') || '#000000';
    const fill = circle.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(circle.getAttribute('stroke-width') || '2');

    shapes.push({
      id: `svg-circle-${Date.now()}-${index}`,
      type: 'circle',
      points: [],
      x: cx - r,
      y: cy - r,
      width: r * 2,
      height: r * 2,
      strokeColor: stroke === 'none' ? 'transparent' : stroke,
      fillColor: fill === 'none' ? 'transparent' : fill,
      strokeWidth,
    });
  });

  // Parse ellipses
  const ellipses = doc.querySelectorAll('ellipse');
  ellipses.forEach((ellipse, index) => {
    const cx = parseFloat(ellipse.getAttribute('cx') || '0');
    const cy = parseFloat(ellipse.getAttribute('cy') || '0');
    const rx = parseFloat(ellipse.getAttribute('rx') || '0');
    const ry = parseFloat(ellipse.getAttribute('ry') || '0');
    const stroke = ellipse.getAttribute('stroke') || '#000000';
    const fill = ellipse.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(ellipse.getAttribute('stroke-width') || '2');

    shapes.push({
      id: `svg-ellipse-${Date.now()}-${index}`,
      type: 'ellipse',
      points: [],
      x: cx - rx,
      y: cy - ry,
      width: rx * 2,
      height: ry * 2,
      strokeColor: stroke === 'none' ? 'transparent' : stroke,
      fillColor: fill === 'none' ? 'transparent' : fill,
      strokeWidth,
    });
  });

  // Parse lines
  const lines = doc.querySelectorAll('line');
  lines.forEach((line, index) => {
    const x1 = parseFloat(line.getAttribute('x1') || '0');
    const y1 = parseFloat(line.getAttribute('y1') || '0');
    const x2 = parseFloat(line.getAttribute('x2') || '0');
    const y2 = parseFloat(line.getAttribute('y2') || '0');
    const stroke = line.getAttribute('stroke') || '#000000';
    const strokeWidth = parseFloat(line.getAttribute('stroke-width') || '2');

    shapes.push({
      id: `svg-line-${Date.now()}-${index}`,
      type: 'straightLine',
      points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
      startPoint: { x: x1, y: y1 },
      endPoint: { x: x2, y: y2 },
      strokeColor: stroke === 'none' ? '#000000' : stroke,
      fillColor: 'transparent',
      strokeWidth,
    });
  });

  // Parse polylines
  const polylines = doc.querySelectorAll('polyline');
  polylines.forEach((polyline, index) => {
    const pointsAttr = polyline.getAttribute('points') || '';
    const points = parsePoints(pointsAttr);
    const stroke = polyline.getAttribute('stroke') || '#000000';
    const fill = polyline.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(polyline.getAttribute('stroke-width') || '2');

    if (points.length > 0) {
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);

      shapes.push({
        id: `svg-polyline-${Date.now()}-${index}`,
        type: 'freeLine',
        points,
        x: minX,
        y: minY,
        strokeColor: stroke === 'none' ? '#000000' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    }
  });

  // Parse polygons
  const polygons = doc.querySelectorAll('polygon');
  polygons.forEach((polygon, index) => {
    const pointsAttr = polygon.getAttribute('points') || '';
    const points = parsePoints(pointsAttr);
    const stroke = polygon.getAttribute('stroke') || '#000000';
    const fill = polygon.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(polygon.getAttribute('stroke-width') || '2');

    if (points.length > 0) {
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);

      shapes.push({
        id: `svg-polygon-${Date.now()}-${index}`,
        type: 'freeLine',
        points: [...points, points[0]], // Close the polygon
        x: minX,
        y: minY,
        strokeColor: stroke === 'none' ? '#000000' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    }
  });

  // Parse paths (simplified)
  const paths = doc.querySelectorAll('path');
  paths.forEach((path, index) => {
    const d = path.getAttribute('d') || '';
    const points = parsePathData(d);
    const stroke = path.getAttribute('stroke') || '#000000';
    const fill = path.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(path.getAttribute('stroke-width') || '2');

    if (points.length > 0) {
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);

      shapes.push({
        id: `svg-path-${Date.now()}-${index}`,
        type: 'freeLine',
        points,
        x: minX,
        y: minY,
        strokeColor: stroke === 'none' ? '#000000' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    }
  });

  return shapes;
}

function parsePoints(pointsStr: string): Point[] {
  const points: Point[] = [];
  const coords = pointsStr.trim().split(/[\s,]+/);
  
  for (let i = 0; i < coords.length - 1; i += 2) {
    const x = parseFloat(coords[i]);
    const y = parseFloat(coords[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  
  return points;
}

function parsePathData(d: string): Point[] {
  const points: Point[] = [];
  let currentX = 0;
  let currentY = 0;
  
  // Simple parser - handles M, L, H, V commands (absolute)
  const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
    
    switch (type.toUpperCase()) {
      case 'M': // Move to
        if (coords.length >= 2) {
          currentX = type === 'M' ? coords[0] : currentX + coords[0];
          currentY = type === 'M' ? coords[1] : currentY + coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'L': // Line to
        for (let i = 0; i < coords.length - 1; i += 2) {
          currentX = type === 'L' ? coords[i] : currentX + coords[i];
          currentY = type === 'L' ? coords[i + 1] : currentY + coords[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'H': // Horizontal line
        coords.forEach(x => {
          currentX = type === 'H' ? x : currentX + x;
          points.push({ x: currentX, y: currentY });
        });
        break;
      case 'V': // Vertical line
        coords.forEach(y => {
          currentY = type === 'V' ? y : currentY + y;
          points.push({ x: currentX, y: currentY });
        });
        break;
    }
  });
  
  return points;
}
