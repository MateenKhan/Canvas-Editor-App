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
  const baseShape: Shape = {
    id: Date.now().toString(),
    type: tool,
    points: [point],
    strokeColor,
    fillColor,
    strokeWidth,
    x: point.x,
    y: point.y,
    startPoint: point,
  };

  // Merge extras if provided
  if (extras) {
    Object.assign(baseShape, extras);
  }

  return baseShape;
}

export function updateShape(tool: Tool, shape: Shape, point: Point): Shape {
  const updated = { ...shape } as Shape;
  if (tool === 'freeLine') {
    updated.points = [...(updated.points || []), point];
  } else if (tool === 'straightLine') {
    updated.endPoint = point;
    updated.points = [updated.startPoint!, point];
  } else if (tool === 'type') {
    // For text tool, we don't update the shape during drawing
    // Text shapes are created through the text popup
    return updated;
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