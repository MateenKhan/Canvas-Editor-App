import { Shape, Point } from '../types';

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean) {
  ctx.strokeStyle = shape.strokeColor;
  ctx.fillStyle = shape.fillColor;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (shape.type) {
    case 'freeLine':
      drawFreeLine(ctx, shape);
      break;
    case 'straightLine':
      drawStraightLine(ctx, shape);
      break;
    case 'rectangle':
      drawRectangle(ctx, shape);
      break;
    case 'circle':
      drawCircle(ctx, shape);
      break;
    case 'ellipse':
      drawEllipse(ctx, shape);
      break;
    case 'triangle':
      drawTriangle(ctx, shape);
      break;
    case 'heart':
      drawHeart(ctx, shape);
      break;
    case 'star':
      drawStar(ctx, shape);
      break;
    case 'pentagon':
      drawPolygon(ctx, shape, 5);
      break;
    case 'hexagon':
      drawPolygon(ctx, shape, 6);
      break;
    case 'arrow':
      drawArrow(ctx, shape);
      break;
  }

  // Draw selection outline
  if (isSelected) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const bounds = getShapeBounds(shape);
    ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
    
    ctx.setLineDash([]);
  }
}

function drawFreeLine(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.points.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(shape.points[0].x, shape.points[0].y);
  
  for (let i = 1; i < shape.points.length; i++) {
    ctx.lineTo(shape.points[i].x, shape.points[i].y);
  }
  
  ctx.stroke();
}

function drawStraightLine(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (!shape.startPoint || !shape.endPoint) return;
  
  ctx.beginPath();
  ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
  ctx.lineTo(shape.endPoint.x, shape.endPoint.y);
  ctx.stroke();
}

function drawRectangle(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.x === undefined || shape.y === undefined || !shape.width || !shape.height) return;
  
  ctx.beginPath();
  ctx.rect(shape.x, shape.y, shape.width, shape.height);
  
  if (shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawCircle(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.x === undefined || shape.y === undefined || !shape.width || !shape.height) return;
  
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const radius = Math.min(shape.width, shape.height) / 2;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  
  if (shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawEllipse(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.x === undefined || shape.y === undefined || !shape.width || !shape.height) return;
  
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const radiusX = shape.width / 2;
  const radiusY = shape.height / 2;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  
  if (shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawTriangle(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.x === undefined || shape.y === undefined || !shape.width || !shape.height) return;
  
  ctx.beginPath();
  ctx.moveTo(shape.x + shape.width / 2, shape.y);
  ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
  ctx.lineTo(shape.x, shape.y + shape.height);
  ctx.closePath();
  
  if (shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawHeart(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.x === undefined || shape.y === undefined || !shape.width || !shape.height) return;
  
  const x = shape.x;
  const y = shape.y;
  const w = shape.width;
  const h = shape.height;
  
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h / 4);
  ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + h / 4);
  ctx.bezierCurveTo(x, y + h / 2, x + w / 2, y + 3 * h / 4, x + w / 2, y + h);
  ctx.bezierCurveTo(x + w / 2, y + 3 * h / 4, x + w, y + h / 2, x + w, y + h / 4);
  ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + h / 4);
  ctx.closePath();
  
  if (shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawStar(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.x === undefined || shape.y === undefined || !shape.width || !shape.height) return;
  
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const outerRadius = Math.min(shape.width, shape.height) / 2;
  const innerRadius = outerRadius * 0.4;
  const points = 5;
  
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  
  if (shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawPolygon(ctx: CanvasRenderingContext2D, shape: Shape, sides: number) {
  if (shape.x === undefined || shape.y === undefined || !shape.width || !shape.height) return;
  
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const radius = Math.min(shape.width, shape.height) / 2;
  
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  
  if (shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (!shape.startPoint || !shape.endPoint) return;
  
  const { x: x1, y: y1 } = shape.startPoint;
  const { x: x2, y: y2 } = shape.endPoint;
  
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 20;
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

export function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  if (shape.type === 'freeLine') {
    const xs = shape.points.map(p => p.x);
    const ys = shape.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else if (shape.type === 'straightLine' || shape.type === 'arrow') {
    if (!shape.startPoint || !shape.endPoint) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const minX = Math.min(shape.startPoint.x, shape.endPoint.x);
    const maxX = Math.max(shape.startPoint.x, shape.endPoint.x);
    const minY = Math.min(shape.startPoint.y, shape.endPoint.y);
    const maxY = Math.max(shape.startPoint.y, shape.endPoint.y);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else {
    return {
      x: shape.x ?? 0,
      y: shape.y ?? 0,
      width: shape.width ?? 0,
      height: shape.height ?? 0,
    };
  }
}

export function isPointInShape(point: Point, shape: Shape): boolean {
  const bounds = getShapeBounds(shape);
  const tolerance = 10;
  
  return (
    point.x >= bounds.x - tolerance &&
    point.x <= bounds.x + bounds.width + tolerance &&
    point.y >= bounds.y - tolerance &&
    point.y <= bounds.y + bounds.height + tolerance
  );
}
