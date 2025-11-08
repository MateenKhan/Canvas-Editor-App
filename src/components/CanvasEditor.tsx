import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Shape, Point, Tool, ViewTransform } from '../types';
import { drawShape, isPointInShape } from '../utils/shapes';

interface CanvasEditorProps {
  tool: Tool;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  selectedShapeId: string | null;
  onShapeSelect: (id: string | null) => void;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export function CanvasEditor({
  tool,
  shapes,
  onShapesChange,
  selectedShapeId,
  onShapeSelect,
  strokeColor,
  fillColor,
  strokeWidth,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [transform, setTransform] = useState<ViewTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    return {
      x: (screenX - transform.translateX) / transform.scale,
      y: (screenY - transform.translateY) / transform.scale,
    };
  }, [transform]);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transform
    ctx.save();
    ctx.translate(transform.translateX, transform.translateY);
    ctx.scale(transform.scale, transform.scale);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1 / transform.scale;
    const gridSize = 50;
    const startX = Math.floor(-transform.translateX / transform.scale / gridSize) * gridSize;
    const startY = Math.floor(-transform.translateY / transform.scale / gridSize) * gridSize;
    const endX = startX + (canvas.width / transform.scale) + gridSize;
    const endY = startY + (canvas.height / transform.scale) + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw all shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape, shape.id === selectedShapeId);
    });

    // Draw current shape being drawn
    if (currentShape) {
      drawShape(ctx, currentShape, false);
    }

    ctx.restore();
  }, [shapes, selectedShapeId, currentShape, transform]);

  // Resize canvas to fit container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redraw]);

  // Redraw when shapes or transform changes
  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const point = screenToCanvas(screenX, screenY);

    // Middle mouse button for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Left mouse button
    if (e.button === 0) {
      if (tool === 'select') {
        // Check if clicking on a shape
        let foundShape = false;
        for (let i = shapes.length - 1; i >= 0; i--) {
          if (isPointInShape(point, shapes[i])) {
            onShapeSelect(shapes[i].id);
            setIsDragging(true);
            const shape = shapes[i];
            const shapeX = shape.x ?? shape.points[0]?.x ?? 0;
            const shapeY = shape.y ?? shape.points[0]?.y ?? 0;
            setDragOffset({
              x: point.x - shapeX,
              y: point.y - shapeY,
            });
            foundShape = true;
            break;
          }
        }
        if (!foundShape) {
          onShapeSelect(null);
        }
      } else {
        // Start drawing
        setIsDrawing(true);
        const newShape: Shape = {
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
        setCurrentShape(newShape);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const point = screenToCanvas(screenX, screenY);

    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + dx,
        translateY: prev.translateY + dy,
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDragging && selectedShapeId && tool === 'select') {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape) {
        const newX = point.x - dragOffset.x;
        const newY = point.y - dragOffset.y;
        
        const updatedShape = { ...selectedShape };
        
        if (updatedShape.type === 'freeLine') {
          const dx = newX - (updatedShape.x ?? 0);
          const dy = newY - (updatedShape.y ?? 0);
          updatedShape.points = updatedShape.points.map(p => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
          updatedShape.x = newX;
          updatedShape.y = newY;
        } else {
          updatedShape.x = newX;
          updatedShape.y = newY;
          if (updatedShape.startPoint) {
            const dx = newX - (selectedShape.x ?? 0);
            const dy = newY - (selectedShape.y ?? 0);
            updatedShape.startPoint = {
              x: (selectedShape.startPoint?.x ?? 0) + dx,
              y: (selectedShape.startPoint?.y ?? 0) + dy,
            };
            if (updatedShape.endPoint) {
              updatedShape.endPoint = {
                x: (selectedShape.endPoint?.x ?? 0) + dx,
                y: (selectedShape.endPoint?.y ?? 0) + dy,
              };
            }
          }
        }
        
        onShapesChange(shapes.map(s => s.id === selectedShapeId ? updatedShape : s));
      }
      return;
    }

    if (isDrawing && currentShape) {
      const updated = { ...currentShape };

      if (tool === 'freeLine') {
        updated.points.push(point);
      } else if (tool === 'straightLine') {
        updated.endPoint = point;
        updated.points = [updated.startPoint!, point];
      } else {
        // For other shapes, calculate width and height from start point
        const width = point.x - (updated.startPoint?.x ?? 0);
        const height = point.y - (updated.startPoint?.y ?? 0);
        updated.width = Math.abs(width);
        updated.height = Math.abs(height);
        updated.x = width < 0 ? point.x : updated.startPoint?.x ?? 0;
        updated.y = height < 0 ? point.y : updated.startPoint?.y ?? 0;
        updated.endPoint = point;
      }

      setCurrentShape(updated);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      setIsPanning(false);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (isDrawing && currentShape) {
      // Only add shape if it has meaningful size (except free line)
      if (currentShape.type === 'freeLine' && currentShape.points.length > 1) {
        onShapesChange([...shapes, currentShape]);
      } else if (currentShape.type !== 'freeLine' && 
                 (currentShape.width ?? 0) > 5 && 
                 (currentShape.height ?? 0) > 5) {
        onShapesChange([...shapes, currentShape]);
      }
      setCurrentShape(null);
      setIsDrawing(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(10, transform.scale * zoom));

    // Zoom towards mouse position
    const scaleChange = newScale / transform.scale;
    const newTranslateX = mouseX - (mouseX - transform.translateX) * scaleChange;
    const newTranslateY = mouseY - (mouseY - transform.translateY) * scaleChange;

    setTransform({
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY,
    });
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  return (
    <div ref={containerRef} className="h-full w-full bg-gray-100">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          setIsDragging(false);
        }}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="cursor-crosshair"
        style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
      />
      <div className="absolute bottom-4 right-4 rounded bg-white px-3 py-2 shadow-md">
        <span className="text-gray-700">Zoom: {Math.round(transform.scale * 100)}%</span>
      </div>
    </div>
  );
}
