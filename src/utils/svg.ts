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
    const m = getCumulativeTransform(rect);
    const rotated = Math.abs(m[1]) > 1e-6 || Math.abs(m[2]) > 1e-6;
    if (rotated) {
      const p1 = transformPoint({ x, y }, m);
      const p2 = transformPoint({ x: x + width, y }, m);
      const p3 = transformPoint({ x: x + width, y: y + height }, m);
      const p4 = transformPoint({ x, y: y + height }, m);
      shapes.push({
        id: `svg-rect-${Date.now()}-${index}`,
        type: 'freeLine',
        points: [p1, p2, p3, p4, p1],
        x: Math.min(p1.x, p2.x, p3.x, p4.x),
        y: Math.min(p1.y, p2.y, p3.y, p4.y),
        strokeColor: stroke === 'none' ? 'transparent' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    } else {
      const p = transformPoint({ x, y }, m);
      const sx = m[0];
      const sy = m[3];
      shapes.push({
        id: `svg-rect-${Date.now()}-${index}`,
        type: 'rectangle',
        points: [],
        x: p.x,
        y: p.y,
        width: width * sx,
        height: height * sy,
        strokeColor: stroke === 'none' ? 'transparent' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    }
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
    const m = getCumulativeTransform(circle);
    const rotated = Math.abs(m[1]) > 1e-6 || Math.abs(m[2]) > 1e-6 || Math.abs(m[0] - m[3]) > 1e-6;
    if (rotated) {
      const points = sampleEllipse(transformPoint({ x: cx, y: cy }, m), r * m[0], r * m[3], 0);
      shapes.push({
        id: `svg-circle-${Date.now()}-${index}`,
        type: 'freeLine',
        points: [...points, points[0]],
        x: Math.min(...points.map(p => p.x)),
        y: Math.min(...points.map(p => p.y)),
        strokeColor: stroke === 'none' ? 'transparent' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    } else {
      const center = transformPoint({ x: cx, y: cy }, m);
      const sx = m[0];
      const sy = m[3];
      const radius = Math.max(r * sx, r * sy);
      shapes.push({
        id: `svg-circle-${Date.now()}-${index}`,
        type: 'circle',
        points: [],
        x: center.x - radius,
        y: center.y - radius,
        width: radius * 2,
        height: radius * 2,
        strokeColor: stroke === 'none' ? 'transparent' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    }
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
    const m = getCumulativeTransform(ellipse);
    const rotated = Math.abs(m[1]) > 1e-6 || Math.abs(m[2]) > 1e-6;
    if (rotated) {
      const points = sampleEllipse(transformPoint({ x: cx, y: cy }, m), rx * m[0], ry * m[3], 0);
      shapes.push({
        id: `svg-ellipse-${Date.now()}-${index}`,
        type: 'freeLine',
        points: [...points, points[0]],
        x: Math.min(...points.map(p => p.x)),
        y: Math.min(...points.map(p => p.y)),
        strokeColor: stroke === 'none' ? 'transparent' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    } else {
      const center = transformPoint({ x: cx, y: cy }, m);
      const sx = m[0];
      const sy = m[3];
      shapes.push({
        id: `svg-ellipse-${Date.now()}-${index}`,
        type: 'ellipse',
        points: [],
        x: center.x - rx * sx,
        y: center.y - ry * sy,
        width: rx * 2 * sx,
        height: ry * 2 * sy,
        strokeColor: stroke === 'none' ? 'transparent' : stroke,
        fillColor: fill === 'none' ? 'transparent' : fill,
        strokeWidth,
      });
    }
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
    const m = getCumulativeTransform(line);
    const p1 = transformPoint({ x: x1, y: y1 }, m);
    const p2 = transformPoint({ x: x2, y: y2 }, m);
    shapes.push({
      id: `svg-line-${Date.now()}-${index}`,
      type: 'straightLine',
      points: [p1, p2],
      startPoint: p1,
      endPoint: p2,
      strokeColor: stroke === 'none' ? '#000000' : stroke,
      fillColor: 'transparent',
      strokeWidth,
    });
  });

  // Parse polylines
  const polylines = doc.querySelectorAll('polyline');
  polylines.forEach((polyline, index) => {
    const pointsAttr = polyline.getAttribute('points') || '';
    const pointsRaw = parsePoints(pointsAttr);
    const stroke = polyline.getAttribute('stroke') || '#000000';
    const fill = polyline.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(polyline.getAttribute('stroke-width') || '2');
    const m = getCumulativeTransform(polyline);
    const points = pointsRaw.map(p => transformPoint(p, m));

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
    const pointsRaw = parsePoints(pointsAttr);
    const stroke = polygon.getAttribute('stroke') || '#000000';
    const fill = polygon.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(polygon.getAttribute('stroke-width') || '2');
    const m = getCumulativeTransform(polygon);
    const points = pointsRaw.map(p => transformPoint(p, m));

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
    const pointsRaw = parsePathData(d);
    const stroke = path.getAttribute('stroke') || '#000000';
    const fill = path.getAttribute('fill') || 'transparent';
    const strokeWidth = parseFloat(path.getAttribute('stroke-width') || '2');
    const m = getCumulativeTransform(path);
    const points = pointsRaw.map(p => transformPoint(p, m));

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
  let startX = 0;
  let startY = 0;
  const commands = d.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];
  commands.forEach(cmd => {
    const type = cmd[0];
    const isRel = type >= 'a' && type <= 'z';
    const t = type.toUpperCase();
    const vals = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
    if (t === 'M') {
      if (vals.length >= 2) {
        currentX = isRel ? currentX + vals[0] : vals[0];
        currentY = isRel ? currentY + vals[1] : vals[1];
        startX = currentX;
        startY = currentY;
        points.push({ x: currentX, y: currentY });
        for (let i = 2; i < vals.length; i += 2) {
          currentX = isRel ? currentX + vals[i] : vals[i];
          currentY = isRel ? currentY + vals[i + 1] : vals[i + 1];
          points.push({ x: currentX, y: currentY });
        }
      }
    } else if (t === 'L') {
      for (let i = 0; i < vals.length; i += 2) {
        currentX = isRel ? currentX + vals[i] : vals[i];
        currentY = isRel ? currentY + vals[i + 1] : vals[i + 1];
        points.push({ x: currentX, y: currentY });
      }
    } else if (t === 'H') {
      vals.forEach(x => {
        currentX = isRel ? currentX + x : x;
        points.push({ x: currentX, y: currentY });
      });
    } else if (t === 'V') {
      vals.forEach(y => {
        currentY = isRel ? currentY + y : y;
        points.push({ x: currentX, y: currentY });
      });
    } else if (t === 'Q') {
      for (let i = 0; i < vals.length; i += 4) {
        const cx = isRel ? currentX + vals[i] : vals[i];
        const cy = isRel ? currentY + vals[i + 1] : vals[i + 1];
        const x = isRel ? currentX + vals[i + 2] : vals[i + 2];
        const y = isRel ? currentY + vals[i + 3] : vals[i + 3];
        for (let t = 0; t <= 1; t += 0.05) {
          const xt = (1 - t) * (1 - t) * currentX + 2 * (1 - t) * t * cx + t * t * x;
          const yt = (1 - t) * (1 - t) * currentY + 2 * (1 - t) * t * cy + t * t * y;
          points.push({ x: xt, y: yt });
        }
        currentX = x;
        currentY = y;
      }
    } else if (t === 'C') {
      for (let i = 0; i < vals.length; i += 6) {
        const cx1 = isRel ? currentX + vals[i] : vals[i];
        const cy1 = isRel ? currentY + vals[i + 1] : vals[i + 1];
        const cx2 = isRel ? currentX + vals[i + 2] : vals[i + 2];
        const cy2 = isRel ? currentY + vals[i + 3] : vals[i + 3];
        const x = isRel ? currentX + vals[i + 4] : vals[i + 4];
        const y = isRel ? currentY + vals[i + 5] : vals[i + 5];
        for (let t = 0; t <= 1; t += 0.05) {
          const xt =
            Math.pow(1 - t, 3) * currentX +
            3 * Math.pow(1 - t, 2) * t * cx1 +
            3 * (1 - t) * t * t * cx2 +
            Math.pow(t, 3) * x;
          const yt =
            Math.pow(1 - t, 3) * currentY +
            3 * Math.pow(1 - t, 2) * t * cy1 +
            3 * (1 - t) * t * t * cy2 +
            Math.pow(t, 3) * y;
          points.push({ x: xt, y: yt });
        }
        currentX = x;
        currentY = y;
      }
    } else if (t === 'Z') {
      points.push({ x: startX, y: startY });
      currentX = startX;
      currentY = startY;
    }
  });
  return points;
}

function getCumulativeTransform(el: Element): number[] {
  let m = [1, 0, 0, 1, 0, 0];
  let node: Element | null = el;
  while (node && node instanceof Element) {
    const tr = node.getAttribute('transform');
    if (tr) {
      const mm = parseTransform(tr);
      m = multiplyMatrices(mm, m);
    }
    node = node.parentElement;
  }
  return m;
}

function parseTransform(tr: string): number[] {
  let m = [1, 0, 0, 1, 0, 0];
  const re = /(matrix|translate|scale|rotate)\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tr)) !== null) {
    const type = match[1];
    const nums = match[2].split(/[\s,]+/).map(parseFloat);
    let mm = [1, 0, 0, 1, 0, 0];
    if (type === 'matrix' && nums.length === 6) {
      mm = [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]];
    } else if (type === 'translate') {
      const tx = nums[0] || 0;
      const ty = nums[1] || 0;
      mm = [1, 0, 0, 1, tx, ty];
    } else if (type === 'scale') {
      const sx = nums[0] ?? 1;
      const sy = nums[1] ?? sx;
      mm = [sx, 0, 0, sy, 0, 0];
    } else if (type === 'rotate') {
      const angle = (nums[0] || 0) * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      if (nums.length >= 3) {
        const cx = nums[1];
        const cy = nums[2];
        const t1 = [1, 0, 0, 1, cx, cy];
        const r = [cos, sin, -sin, cos, 0, 0];
        const t2 = [1, 0, 0, 1, -cx, -cy];
        mm = multiplyMatrices(t1, multiplyMatrices(r, t2));
      } else {
        mm = [cos, sin, -sin, cos, 0, 0];
      }
    }
    m = multiplyMatrices(m, mm);
  }
  return m;
}

function multiplyMatrices(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function transformPoint(p: Point, m: number[]): Point {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}

function sampleEllipse(center: Point, rx: number, ry: number, rotation: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < 32; i++) {
    const theta = (i / 32) * Math.PI * 2 + rotation;
    const x = center.x + Math.cos(theta) * rx;
    const y = center.y + Math.sin(theta) * ry;
    pts.push({ x, y });
  }
  return pts;
}
