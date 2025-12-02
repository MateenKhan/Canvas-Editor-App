import { Shape, Point, Tool } from '../types';

// Define conversion constants
const PX_PER_INCH = 96;
const PX_PER_MM = PX_PER_INCH / 25.4;

export function createShape(
  tool: Tool,
  point: Point,
  strokeColor: string,
  fillColor: string,
  strokeWidth: number,
  extras?: Partial<Shape>
): Shape {
  if (tool === 'type') {
    return {
      id: Date.now().toString(),
      type: tool,
      points: [],
      strokeColor,
      fillColor,
      strokeWidth,
      startPoint: point,
      x: point.x,
      y: point.y,
      text: 'Text',
      fontSize: 20,
      fontFamily: 'Arial',
      fontStyle: 'normal',
      fontWeight: 'normal',
      ...(extras || {}),
    } as Shape;
  }
  return {
    id: Date.now().toString(),
    type: tool,
    points: [point],
    strokeColor,
    fillColor,
    strokeWidth,
    x: point.x,
    y: point.y,
    startPoint: point,
  } as Shape;
}

export function updateShape(tool: Tool, shape: Shape, point: Point): Shape {
  const updated = { ...shape } as Shape;
  if (tool === 'type') {
    return updated;
  } else if (tool === 'freeLine') {
    updated.points = [...(updated.points || []), point];
  } else if (tool === 'straightLine') {
    updated.endPoint = point;
    updated.points = [updated.startPoint!, point];
  } else {
    const width = point.x - (updated.startPoint?.x ?? 0);
    const height = point.y - (updated.startPoint?.y ?? 0);
    updated.width = Math.abs(width);
    updated.height = Math.abs(height);
    updated.x = width < 0 ? point.x : updated.startPoint?.x ?? 0;
    updated.y = height < 0 ? point.y : updated.startPoint?.y ?? 0;
    updated.endPoint = point;
  }
  return updated;
}