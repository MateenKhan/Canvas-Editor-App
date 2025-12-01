import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react@0.487.0';
import { Shape, Point, Tool, ViewTransform } from '../types';
import { drawShape, isPointInShape } from '../utils/shapes';

interface CanvasEditorProps {
  tool: Tool;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  selectedShapeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export function CanvasEditor({
  tool,
  shapes,
  onShapesChange,
  selectedShapeIds,
  onSelectionChange,
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
  const [lastPinchDist, setLastPinchDist] = useState<number | null>(null);
  const [lastDragPoint, setLastDragPoint] = useState<Point>({ x: 0, y: 0 });

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
      drawShape(ctx, shape, selectedShapeIds.includes(shape.id));
    });

    // Draw current shape being drawn
    if (currentShape) {
      drawShape(ctx, currentShape, false);
    }

    ctx.restore();
  }, [shapes, selectedShapeIds, currentShape, transform]);

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
        let foundId: string | null = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
          if (isPointInShape(point, shapes[i])) {
            foundId = shapes[i].id;
            break;
          }
        }
        if (foundId) {
          const next = selectedShapeIds.includes(foundId)
            ? selectedShapeIds
            : [...selectedShapeIds, foundId];
          onSelectionChange(next);
          setIsDragging(true);
          setLastDragPoint(point);
        } else {
          onSelectionChange([]);
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

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    if (touches.length > 1) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const midX = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
      const midY = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;
      setLastPinchDist(dist);
      setIsPanning(true);
      setLastPanPoint({ x: midX, y: midY });
      return;
    }

    const screenX = touches[0].clientX - rect.left;
    const screenY = touches[0].clientY - rect.top;
    const point = screenToCanvas(screenX, screenY);

    if (tool === 'select') {
      let foundId: string | null = null;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(point, shapes[i])) {
          foundId = shapes[i].id;
          break;
        }
      }
      if (foundId) {
        const next = selectedShapeIds.includes(foundId)
          ? selectedShapeIds
          : [...selectedShapeIds, foundId];
        onSelectionChange(next);
        setIsDragging(true);
        setLastDragPoint(point);
      } else {
        onSelectionChange([]);
      }
    } else {
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

    if (isDragging && selectedShapeIds.length > 0 && tool === 'select') {
      const dx = point.x - lastDragPoint.x;
      const dy = point.y - lastDragPoint.y;
      if (dx !== 0 || dy !== 0) {
        const moved = shapes.map(s => {
          if (!selectedShapeIds.includes(s.id)) return s;
          const updated = { ...s } as Shape;
          if (updated.type === 'freeLine') {
            updated.points = updated.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          }
          updated.x = (updated.x ?? (updated.points[0]?.x ?? 0)) + dx;
          updated.y = (updated.y ?? (updated.points[0]?.y ?? 0)) + dy;
          if (updated.startPoint) {
            updated.startPoint = { x: (updated.startPoint.x ?? 0) + dx, y: (updated.startPoint.y ?? 0) + dy };
          }
          if (updated.endPoint) {
            updated.endPoint = { x: (updated.endPoint.x ?? 0) + dx, y: (updated.endPoint.y ?? 0) + dy };
          }
          return updated;
        });
        onShapesChange(moved);
        setLastDragPoint(point);
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

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    if (touches.length > 1 && lastPinchDist !== null) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const midX = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
      const midY = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;

      const rawNewScale = transform.scale * (dist / lastPinchDist);
      const newScale = Math.max(0.1, Math.min(10, rawNewScale));
      const scaleChange = newScale / transform.scale;

      const newTranslateX = midX - (midX - transform.translateX) * scaleChange;
      const newTranslateY = midY - (midY - transform.translateY) * scaleChange;

      const dxMid = midX - lastPanPoint.x;
      const dyMid = midY - lastPanPoint.y;

      setTransform({
        scale: newScale,
        translateX: newTranslateX + dxMid,
        translateY: newTranslateY + dyMid,
      });
      setLastPinchDist(dist);
      setLastPanPoint({ x: midX, y: midY });
      return;
    }

    const screenX = touches[0].clientX - rect.left;
    const screenY = touches[0].clientY - rect.top;
    const point = screenToCanvas(screenX, screenY);

    if (isDragging && selectedShapeIds.length > 0 && tool === 'select') {
      const dx = point.x - lastDragPoint.x;
      const dy = point.y - lastDragPoint.y;
      if (dx !== 0 || dy !== 0) {
        const moved = shapes.map(s => {
          if (!selectedShapeIds.includes(s.id)) return s;
          const updated = { ...s } as Shape;
          if (updated.type === 'freeLine') {
            updated.points = updated.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          }
          updated.x = (updated.x ?? (updated.points[0]?.x ?? 0)) + dx;
          updated.y = (updated.y ?? (updated.points[0]?.y ?? 0)) + dy;
          if (updated.startPoint) {
            updated.startPoint = { x: (updated.startPoint.x ?? 0) + dx, y: (updated.startPoint.y ?? 0) + dy };
          }
          if (updated.endPoint) {
            updated.endPoint = { x: (updated.endPoint.x ?? 0) + dx, y: (updated.endPoint.y ?? 0) + dy };
          }
          return updated;
        });
        onShapesChange(moved);
        setLastDragPoint(point);
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

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsPanning(false);
    setLastPinchDist(null);
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    if (isDrawing && currentShape) {
      if (currentShape.type === 'freeLine' && currentShape.points.length > 1) {
        onShapesChange([...shapes, currentShape]);
      } else if (currentShape.type !== 'freeLine' && (currentShape.width ?? 0) > 5 && (currentShape.height ?? 0) > 5) {
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={() => {
          setIsPanning(false);
          setIsDragging(false);
        }}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="cursor-crosshair"
        style={{ cursor: tool === 'select' ? 'default' : 'crosshair', touchAction: 'none' }}
      />
      <div className="absolute bottom-16 right-4 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const anchorX = rect.width / 2;
            const anchorY = rect.height / 2;
            const newScale = Math.min(10, transform.scale * 1.1);
            const scaleChange = newScale / transform.scale;
            const newTranslateX = anchorX - (anchorX - transform.translateX) * scaleChange;
            const newTranslateY = anchorY - (anchorY - transform.translateY) * scaleChange;
            setTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
          }}
          title="Zoom In"
        >
          <ZoomIn />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const anchorX = rect.width / 2;
            const anchorY = rect.height / 2;
            const newScale = Math.max(0.1, transform.scale * 0.9);
            const scaleChange = newScale / transform.scale;
            const newTranslateX = anchorX - (anchorX - transform.translateX) * scaleChange;
            const newTranslateY = anchorY - (anchorY - transform.translateY) * scaleChange;
            setTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
          }}
          title="Zoom Out"
        >
          <ZoomOut />
        </Button>
      </div>
      <div className="absolute bottom-4 right-4 rounded bg-white px-3 py-2 shadow-md">
        <span className="text-gray-700">Zoom: {Math.round(transform.scale * 100)}%</span>
      </div>
    </div>
  );
}
