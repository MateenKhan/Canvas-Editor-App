export type Tool = 
  | 'select'
  | 'freeLine'
  | 'straightLine'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'heart'
  | 'star'
  | 'pentagon'
  | 'hexagon'
  | 'arrow';

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: Tool;
  points: Point[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  startPoint?: Point;
  endPoint?: Point;
}

export interface ViewTransform {
  scale: number;
  translateX: number;
  translateY: number;
}
