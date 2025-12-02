import { Shape, Point } from '../types';
import { getShapeBounds } from './shapes';

export function getResizeHandleHit(p: Point, shape: Shape, scale: number): string | null {
  const size = 8 / scale;
  const half = size / 2;
  if (shape.type === 'straightLine' || shape.type === 'arrow') {
    if (shape.startPoint && Math.abs(p.x - shape.startPoint.x) <= half && Math.abs(p.y - shape.startPoint.y) <= half) {
      return 'start';
    }
    if (shape.endPoint && Math.abs(p.x - shape.endPoint.x) <= half && Math.abs(p.y - shape.endPoint.y) <= half) {
      return 'end';
    }
    return null;
  }
  const b = getShapeBounds(shape);
  const positions: { pos: Point; key: string }[] = [
    { pos: { x: b.x, y: b.y }, key: 'nw' },
    { pos: { x: b.x + b.width / 2, y: b.y }, key: 'n' },
    { pos: { x: b.x + b.width, y: b.y }, key: 'ne' },
    { pos: { x: b.x + b.width, y: b.y + b.height / 2 }, key: 'e' },
    { pos: { x: b.x + b.width, y: b.y + b.height }, key: 'se' },
    { pos: { x: b.x + b.width / 2, y: b.y + b.height }, key: 's' },
    { pos: { x: b.x, y: b.y + b.height }, key: 'sw' },
    { pos: { x: b.x, y: b.y + b.height / 2 }, key: 'w' },
  ];
  for (const h of positions) {
    if (
      p.x >= h.pos.x - half &&
      p.x <= h.pos.x + half &&
      p.y >= h.pos.y - half &&
      p.y <= h.pos.y + half
    ) {
      return h.key;
    }
  }
  return null;
}

