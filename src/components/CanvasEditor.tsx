import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Shape, Point, Tool, ViewTransform } from '../types';
import { drawShape, isPointInShape, getShapeBounds } from '../utils/shapes';
import { intersectsRect, containsRect } from '../utils/geometry';
import { ZoomControls } from './ZoomControls';
import { ZoomIndicator } from './ZoomIndicator';
import { useViewTransform } from '../hooks/useViewTransform';
import { getResizeHandleHit } from '../utils/resize';
import { mergeSelection } from '../utils/selection';
import { createShape, updateShape } from '../utils/drawLifecycle';

interface CanvasEditorProps {
  tool: Tool;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  selectedShapeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSelectionCommit: (ids: string[]) => void;
  onToolChange: (tool: Tool) => void;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  currentUnit?: 'mm' | 'in' | 'ft';
}

export function CanvasEditor({
  tool,
  shapes,
  onShapesChange,
  selectedShapeIds,
  onSelectionChange,
  onSelectionCommit,
  onToolChange,
  strokeColor,
  fillColor,
  strokeWidth,
  currentUnit = 'mm',
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const { transform, setTransform, zoomToAnchor } = useViewTransform({ scale: 1, translateX: 0, translateY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [lastPinchDist, setLastPinchDist] = useState<number | null>(null);
  const [lastDragPoint, setLastDragPoint] = useState<Point>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTargetId, setResizeTargetId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [originalShape, setOriginalShape] = useState<Shape | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState<Point | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionMode, setSelectionMode] = useState<'contains' | 'intersects'>('intersects');
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [lastTapPoint, setLastTapPoint] = useState<Point | null>(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    return {
      x: (screenX - transform.translateX) / transform.scale,
      y: (screenY - transform.translateY) / transform.scale,
    };
  }, [transform]);

  // Set up touch event listeners to prevent passive event listener issues
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set touch action to none to allow preventDefault for touch events
    canvas.style.touchAction = 'none';
    
    // Set up wheel event listener with passive: false to allow preventDefault
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoom = e.deltaY < 0 ? 1.1 : 0.9;
      zoomToAnchor(mouseX, mouseY, zoom);
    };
    
    canvas.addEventListener('wheel', handleWheelEvent, { passive: false });

    // Cleanup function
    return () => {
      canvas.style.touchAction = '';
      canvas.removeEventListener('wheel', handleWheelEvent);
    };
  }, [zoomToAnchor]);

  // Handle shape creation from drawing (removed text tool related code)
  useEffect(() => {
    if (currentShape && !isDrawing) {
      // Only create shapes for valid tools (text tool removed)
      if (currentShape.type !== 'select') { // Changed condition since 'type' is no longer a valid tool
        if (currentShape.type === 'freeLine' && currentShape.points.length > 1) {
          onShapesChange([...shapes, currentShape]);
        } else if (currentShape.type !== 'freeLine' && (currentShape.width ?? 0) > 5 && (currentShape.height ?? 0) > 5) {
          onShapesChange([...shapes, currentShape]);
        }
      }
      
      // Automatically select the newly created shape and switch to select tool
      if (currentShape.id) {
        onSelectionChange([currentShape.id]);
        onSelectionCommit([currentShape.id]);
        // Switch to select tool after drawing
        onToolChange('select');
      }
    }
  }, [currentShape, isDrawing, shapes, onShapesChange, onSelectionChange, onSelectionCommit, onToolChange]);

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

    // Draw axis lines (x and y axes)
    ctx.strokeStyle = '#ff0000'; // Red color for visibility
    ctx.lineWidth = 2 / transform.scale;
    ctx.setLineDash([]); // Solid line
    
    // Draw Y-axis (vertical line through origin)
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    ctx.stroke();
    
    // Draw X-axis (horizontal line through origin)
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0);
    ctx.stroke();
    
    // Draw origin point
    ctx.fillStyle = '#ff0000'; // Red color for origin point
    ctx.beginPath();
    ctx.arc(0, 0, 4 / transform.scale, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw axis labels and signs
    ctx.fillStyle = '#ff0000'; // Red color for labels
    ctx.font = `${14 / transform.scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // X-axis labels
    ctx.fillText('X', endX - 20 / transform.scale, -10 / transform.scale); // X label
    ctx.fillText('+', endX - 40 / transform.scale, -10 / transform.scale); // Positive X
    ctx.fillText('-', startX + 40 / transform.scale, -10 / transform.scale); // Negative X
    
    // Y-axis labels
    ctx.fillText('Y', 10 / transform.scale, endY - 20 / transform.scale); // Y label
    ctx.fillText('+', 10 / transform.scale, endY - 40 / transform.scale); // Positive Y
    ctx.fillText('-', 10 / transform.scale, startY + 40 / transform.scale); // Negative Y
    
    // Origin label
    ctx.fillText('0', -15 / transform.scale, -15 / transform.scale); // Origin label

    // Draw all shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape, selectedShapeIds.includes(shape.id));
    });

    // Draw dimensions for all shapes
    shapes.forEach(shape => {
      drawShapeDimensions(ctx, shape, transform.scale, currentUnit);
    });

    // Draw current shape being drawn
    if (currentShape) {
      drawShape(ctx, currentShape, false);
    }

    // Draw resize handles for selected shapes
    selectedShapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;
      const bounds = getShapeBounds(shape);
      const handleSize = 8 / transform.scale;
      const half = handleSize / 2;
      const positions: Point[] = [];
      if (shape.type === 'straightLine' || shape.type === 'arrow') {
        if (shape.startPoint) positions.push(shape.startPoint);
        if (shape.endPoint) positions.push(shape.endPoint);
      } else {
        positions.push(
          { x: bounds.x, y: bounds.y },
          { x: bounds.x + bounds.width / 2, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
          { x: bounds.x, y: bounds.y + bounds.height },
          { x: bounds.x, y: bounds.y + bounds.height / 2 },
        );
      }
      ctx.fillStyle = '#3b82f6';
      positions.forEach(p => {
        ctx.fillRect(p.x - half, p.y - half, handleSize, handleSize);
      });
    });

    // Draw selection rectangle if active
    if (isSelecting && selectionRect) {
      ctx.strokeStyle = selectionMode === 'contains' ? '#3b82f6' : '#10b981';
      ctx.fillStyle = selectionMode === 'contains' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)';
      ctx.lineWidth = 1 / transform.scale;
      ctx.setLineDash([6 / transform.scale, 4 / transform.scale]);
      ctx.beginPath();
      ctx.rect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [shapes, selectedShapeIds, currentShape, transform, isSelecting, selectionRect, selectionMode, currentUnit]);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (tool !== 'select') return;
      if (selectedShapeIds.length === 0) return;
      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      if (dx === 0 && dy === 0) return;
      e.preventDefault();
      const moved = shapes.map(s => {
        if (!selectedShapeIds.includes(s.id)) return s;
        const updated = { ...s } as Shape;
        if (updated.type === 'freeLine') {
          updated.points = updated.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        } else {
          // For other shapes (text shape handling removed since text tool is removed)
          updated.x = (updated.x ?? (updated.points[0]?.x ?? 0)) + dx;
          updated.y = (updated.y ?? (updated.points[0]?.y ?? 0)) + dy;
          if (updated.startPoint) {
            updated.startPoint = { x: (updated.startPoint.x ?? 0) + dx, y: (updated.startPoint.y ?? 0) + dy };
          }
          if (updated.endPoint) {
            updated.endPoint = { x: (updated.endPoint.x ?? 0) + dx, y: (updated.endPoint.y ?? 0) + dy };
          }
        }
        return updated;
      });
      onShapesChange(moved);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tool, shapes, selectedShapeIds, onShapesChange]);

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
        // Check resize handle hit on selected shapes
        for (let i = shapes.length - 1; i >= 0; i--) {
          const s = shapes[i];
          if (!selectedShapeIds.includes(s.id)) continue;
          const hit = getResizeHandleHit(point, s, transform.scale);
          if (hit) {
            setResizeTargetId(s.id);
            setResizeHandle(hit);
            setOriginalShape({ ...s });
            setIsResizing(true);
            setResizeStartPoint(point);
            return;
          }
        }
        let foundId: string | null = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
          if (isPointInShape(point, shapes[i])) {
            foundId = shapes[i].id;
            break;
          }
        }
        if (foundId) {
          if (selectedShapeIds.includes(foundId)) {
            setIsDragging(true);
            setLastDragPoint(point);
          } else {
            const next = [...selectedShapeIds, foundId];
            onSelectionChange(next);
            onSelectionCommit(next);
            setIsDragging(true);
            setLastDragPoint(point);
          }
        } else {
          setIsSelecting(true);
          setSelectStart(point);
          setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 });
        }
      } else {
        // Start drawing (no special handling needed for text tool since it's removed)
        setIsDrawing(true);
        const newShape = createShape(
          tool,
          point,
          strokeColor,
          fillColor,
          strokeWidth
        );
        setCurrentShape(newShape);
      }
    }
  };


  

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Note: We can't call preventDefault on passive event listeners
    // The touchAction style is set to 'none' in the useEffect to allow this
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
      // Check resize handle hit on selected shapes (for touch devices)
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (!selectedShapeIds.includes(s.id)) continue;
        const hit = getResizeHandleHit(point, s, transform.scale);
        if (hit) {
          setResizeTargetId(s.id);
          setResizeHandle(hit);
          setOriginalShape({ ...s });
          setIsResizing(true);
          setResizeStartPoint(point);
          return;
        }
      }
      
      let foundId: string | null = null;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(point, shapes[i])) {
          foundId = shapes[i].id;
          break;
        }
      }
      if (foundId) {
        if (selectedShapeIds.includes(foundId)) {
          setIsDragging(true);
          setLastDragPoint(point);
        } else {
          const next = [...selectedShapeIds, foundId];
          onSelectionChange(next);
          onSelectionCommit(next);
          setIsDragging(true);
          setLastDragPoint(point);
        }
      } else {
        setIsSelecting(true);
        setSelectStart(point);
        setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 });
      }
    } else {
      setIsDrawing(true);
      const newShape = createShape(
        tool,
        point,
        strokeColor,
        fillColor,
        strokeWidth
      );
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
          } else {
            // For other shapes (text shape handling removed since text tool is removed)
            updated.x = (updated.x ?? (updated.points[0]?.x ?? 0)) + dx;
            updated.y = (updated.y ?? (updated.points[0]?.y ?? 0)) + dy;
            if (updated.startPoint) {
              updated.startPoint = { x: (updated.startPoint.x ?? 0) + dx, y: (updated.startPoint.y ?? 0) + dy };
            }
            if (updated.endPoint) {
              updated.endPoint = { x: (updated.endPoint.x ?? 0) + dx, y: (updated.endPoint.y ?? 0) + dy };
            }
          }
          return updated;
        });
        onShapesChange(moved);
        setLastDragPoint(point);
      }
      return;
    }

    if (isResizing && resizeTargetId && resizeHandle && resizeStartPoint) {
      const dx = point.x - resizeStartPoint.x;
      const dy = point.y - resizeStartPoint.y;
      if (dx !== 0 || dy !== 0) {
        const resized = shapes.map(s => {
          if (s.id !== resizeTargetId) return s;
          if (!originalShape) return s;
          const updated = { ...s } as Shape;
          if (updated.type === 'freeLine') {
            // FreeLine shapes cannot be resized
            return updated;
          } else if (updated.type === 'straightLine' || updated.type === 'arrow') {
            // Resize line shapes
            if (resizeHandle === 'start') {
              updated.startPoint = {
                x: (originalShape.startPoint?.x ?? 0) + dx,
                y: (originalShape.startPoint?.y ?? 0) + dy
              };
            } else if (resizeHandle === 'end') {
              updated.endPoint = {
                x: (originalShape.endPoint?.x ?? 0) + dx,
                y: (originalShape.endPoint?.y ?? 0) + dy
              };
            }
            updated.points = [updated.startPoint!, updated.endPoint!];
          } else {
            // Resize other shapes
            const origBounds = getShapeBounds(originalShape);
            let newWidth = origBounds.width;
            let newHeight = origBounds.height;
            let newX = origBounds.x;
            let newY = origBounds.y;

            if (resizeHandle.includes('e')) {
              newWidth = Math.max(1, origBounds.width + dx);
            } else if (resizeHandle.includes('w')) {
              newWidth = Math.max(1, origBounds.width - dx);
              newX = origBounds.x + dx;
            }

            if (resizeHandle.includes('s')) {
              newHeight = Math.max(1, origBounds.height + dy);
            } else if (resizeHandle.includes('n')) {
              newHeight = Math.max(1, origBounds.height - dy);
              newY = origBounds.y + dy;
            }

            updated.x = newX;
            updated.y = newY;
            updated.width = newWidth;
            updated.height = newHeight;
            
            // Update start/end points if they exist
            if (updated.startPoint) {
              updated.startPoint = { x: newX, y: newY };
            }
            if (updated.endPoint) {
              updated.endPoint = { x: newX + newWidth, y: newY + newHeight };
            }
          }
          return updated;
        });
        onShapesChange(resized);
      }
      return;
    }

    if (isDrawing && currentShape) {
      const updatedShape = updateShape(tool, currentShape, point);
      setCurrentShape(updatedShape);
    }

    if (isSelecting && selectStart) {
      const width = point.x - selectStart.x;
      const height = point.y - selectStart.y;
      const rect = {
        x: width < 0 ? point.x : selectStart.x,
        y: height < 0 ? point.y : selectStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      };
      setSelectionRect(rect);
      
      // Find shapes that intersect with the selection rectangle
      const selectedIds: string[] = [];
      shapes.forEach(shape => {
        const bounds = getShapeBounds(shape);
        const shapeRect = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        };
        
        if (selectionMode === 'contains') {
          if (containsRect(rect, shapeRect)) {
            selectedIds.push(shape.id);
          }
        } else {
          if (intersectsRect(rect, shapeRect)) {
            selectedIds.push(shape.id);
          }
        }
      });
      
      onSelectionChange(selectedIds);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Note: We can't call preventDefault on passive event listeners
    // The touchAction style is set to 'none' in the useEffect to allow this
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
      
      const zoomFactor = dist / lastPinchDist;
      zoomToAnchor(midX, midY, zoomFactor);
      setLastPinchDist(dist);
      return;
    }

    const screenX = touches[0].clientX - rect.left;
    const screenY = touches[0].clientY - rect.top;
    const point = screenToCanvas(screenX, screenY);

    if (isSelecting && selectStart && tool === 'select') {
      const width = point.x - selectStart.x;
      const height = point.y - selectStart.y;
      const rect = {
        x: width < 0 ? point.x : selectStart.x,
        y: height < 0 ? point.y : selectStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      };
      setSelectionRect(rect);
      
      // Find shapes that intersect with the selection rectangle
      const selectedIds: string[] = [];
      shapes.forEach(shape => {
        const bounds = getShapeBounds(shape);
        const shapeRect = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        };
        
        if (selectionMode === 'contains') {
          if (containsRect(rect, shapeRect)) {
            selectedIds.push(shape.id);
          }
        } else {
          if (intersectsRect(rect, shapeRect)) {
            selectedIds.push(shape.id);
          }
        }
      });
      
      onSelectionChange(selectedIds);
      return;
    }

    // Handle dragging on touch devices
    if (isDragging && selectedShapeIds.length > 0 && tool === 'select') {
      const dx = point.x - lastDragPoint.x;
      const dy = point.y - lastDragPoint.y;
      if (dx !== 0 || dy !== 0) {
        const moved = shapes.map(s => {
          if (!selectedShapeIds.includes(s.id)) return s;
          const updated = { ...s } as Shape;
          if (updated.type === 'freeLine') {
            updated.points = updated.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          } else {
            // For other shapes (text shape handling removed since text tool is removed)
            updated.x = (updated.x ?? (updated.points[0]?.x ?? 0)) + dx;
            updated.y = (updated.y ?? (updated.points[0]?.y ?? 0)) + dy;
            if (updated.startPoint) {
              updated.startPoint = { x: (updated.startPoint.x ?? 0) + dx, y: (updated.startPoint.y ?? 0) + dy };
            }
            if (updated.endPoint) {
              updated.endPoint = { x: (updated.endPoint.x ?? 0) + dx, y: (updated.endPoint.y ?? 0) + dy };
            }
          }
          return updated;
        });
        onShapesChange(moved);
        setLastDragPoint(point);
      }
      return;
    }

    // Handle resizing on touch devices
    if (isResizing && resizeTargetId && resizeHandle && resizeStartPoint) {
      const dx = point.x - resizeStartPoint.x;
      const dy = point.y - resizeStartPoint.y;
      if (dx !== 0 || dy !== 0) {
        const resized = shapes.map(s => {
          if (s.id !== resizeTargetId) return s;
          if (!originalShape) return s;
          const updated = { ...s } as Shape;
          if (updated.type === 'freeLine') {
            // FreeLine shapes cannot be resized
            return updated;
          } else if (updated.type === 'straightLine' || updated.type === 'arrow') {
            // Resize line shapes
            if (resizeHandle === 'start') {
              updated.startPoint = {
                x: (originalShape.startPoint?.x ?? 0) + dx,
                y: (originalShape.startPoint?.y ?? 0) + dy
              };
            } else if (resizeHandle === 'end') {
              updated.endPoint = {
                x: (originalShape.endPoint?.x ?? 0) + dx,
                y: (originalShape.endPoint?.y ?? 0) + dy
              };
            }
            updated.points = [updated.startPoint!, updated.endPoint!];
          } else {
            // Resize other shapes
            const origBounds = getShapeBounds(originalShape);
            let newWidth = origBounds.width;
            let newHeight = origBounds.height;
            let newX = origBounds.x;
            let newY = origBounds.y;

            if (resizeHandle.includes('e')) {
              newWidth = Math.max(1, origBounds.width + dx);
            } else if (resizeHandle.includes('w')) {
              newWidth = Math.max(1, origBounds.width - dx);
              newX = origBounds.x + dx;
            }

            if (resizeHandle.includes('s')) {
              newHeight = Math.max(1, origBounds.height + dy);
            } else if (resizeHandle.includes('n')) {
              newHeight = Math.max(1, origBounds.height - dy);
              newY = origBounds.y + dy;
            }

            updated.x = newX;
            updated.y = newY;
            updated.width = newWidth;
            updated.height = newHeight;
            
            // Update start/end points if they exist
            if (updated.startPoint) {
              updated.startPoint = { x: newX, y: newY };
            }
            if (updated.endPoint) {
              updated.endPoint = { x: newX + newWidth, y: newY + newHeight };
            }
          }
          return updated;
        });
        onShapesChange(resized);
      }
      return;
    }

    if (isDrawing && currentShape) {
      const updatedShape = updateShape(tool, currentShape, point);
      setCurrentShape(updatedShape);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(false);
    setLastPanPoint({ x: 0, y: 0 });
    
    if (isSelecting) {
      setIsSelecting(false);
      setSelectStart(null);
      setSelectionRect(null);
      onSelectionCommit(selectedShapeIds);
      return;
    }
    
    if (isResizing) {
      setIsResizing(false);
      setResizeTargetId(null);
      setResizeHandle(null);
      setOriginalShape(null);
      setResizeStartPoint(null);
      onSelectionCommit(selectedShapeIds);
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      setLastDragPoint({ x: 0, y: 0 });
      onSelectionCommit(selectedShapeIds);
      return;
    }
    
    if (isDrawing && currentShape) {
      let newShapeId: string | null = null;
      
      // Only create shapes for valid tools (text tool removed)
      if (currentShape.type !== 'select') { // Changed condition since 'type' is no longer a valid tool
        if (currentShape.type === 'freeLine' && currentShape.points.length > 1) {
          onShapesChange([...shapes, currentShape]);
          newShapeId = currentShape.id;
        } else if (currentShape.type !== 'freeLine' && (currentShape.width ?? 0) > 5 && (currentShape.height ?? 0) > 5) {
          onShapesChange([...shapes, currentShape]);
          newShapeId = currentShape.id;
        }
        
        // Automatically select the newly created shape and switch to select tool
        if (newShapeId) {
          onSelectionChange([newShapeId]);
          onSelectionCommit([newShapeId]);
          // Switch to select tool after drawing
          onToolChange('select');
        }
      }
      
      setCurrentShape(null);
      setIsDrawing(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Note: We can't call preventDefault on passive event listeners
    // The touchAction style is set to 'none' in the useEffect to allow this
    setIsPanning(false);
    setLastPinchDist(null);
    const canvas = canvasRef.current;
    
    // Handle tool selection on double tap
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ct = e.changedTouches;
      if (ct.length > 0) {
        const now = Date.now();
        const screenX = ct[0].clientX - rect.left;
        const screenY = ct[0].clientY - rect.top;
        const point = screenToCanvas(screenX, screenY);
        
        if (lastTapTime && lastTapPoint && now - lastTapTime < 300) {
          const distance = Math.sqrt(
            Math.pow(point.x - lastTapPoint.x, 2) + 
            Math.pow(point.y - lastTapPoint.y, 2)
          );
          
          if (distance < 20) {
            // Double tap detected
            if (tool === 'select') {
              let foundId: string | null = null;
              for (let i = shapes.length - 1; i >= 0; i--) {
                if (isPointInShape(point, shapes[i])) {
                  foundId = shapes[i].id;
                  break;
                }
              }
              
              if (foundId) {
                // Just select the shape
                onSelectionChange([foundId]);
                onSelectionCommit([foundId]);
              } else {
                // No shape found, just clear selection
                onSelectionChange([]);
                onSelectionCommit([]);
              }
            } else {
              // Switch to select tool
              onToolChange('select');
            }
          }
        }
        
        setLastTapTime(now);
        setLastTapPoint(point);
      }
    }
    
    if (isSelecting) {
      setIsSelecting(false);
      setSelectStart(null);
      setSelectionRect(null);
      onSelectionCommit(selectedShapeIds);
      return;
    }
    
    // Handle resize end on touch devices
    if (isResizing) {
      setIsResizing(false);
      setResizeTargetId(null);
      setResizeHandle(null);
      setOriginalShape(null);
      setResizeStartPoint(null);
      onSelectionCommit(selectedShapeIds);
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      setLastDragPoint({ x: 0, y: 0 });
      onSelectionCommit(selectedShapeIds);
      return;
    }
    
    if (isDrawing && currentShape) {
      let newShapeId: string | null = null;
      
      // Only create shapes for valid tools (text tool removed)
      if (currentShape.type !== 'select') { // Changed condition since 'type' is no longer a valid tool
        if (currentShape.type === 'freeLine' && currentShape.points.length > 1) {
          onShapesChange([...shapes, currentShape]);
          newShapeId = currentShape.id;
        } else if (currentShape.type !== 'freeLine' && (currentShape.width ?? 0) > 5 && (currentShape.height ?? 0) > 5) {
          onShapesChange([...shapes, currentShape]);
          newShapeId = currentShape.id;
        }
        
        // Automatically select the newly created shape and switch to select tool
        if (newShapeId) {
          onSelectionChange([newShapeId]);
          onSelectionCommit([newShapeId]);
          // Switch to select tool after drawing
          onToolChange('select');
        }
      }
      
      setCurrentShape(null);
      setIsDrawing(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Note: We can't call preventDefault on passive event listeners
    // The passive option is set to false in the canvas element props
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    zoomToAnchor(mouseX, mouseY, zoom);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'select') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const point = screenToCanvas(screenX, screenY);
    let foundId: string | null = null;
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (isPointInShape(point, shapes[i])) {
        foundId = shapes[i].id;
        break;
      }
    }
    if (!foundId) {
      // No shape found, just clear selection
      onSelectionChange([]);
      onSelectionCommit([]);
      setIsSelecting(false);
      setSelectStart(null);
      setSelectionRect(null);
    } else {
      // Just select the shape
      onSelectionChange([foundId]);
      onSelectionCommit([foundId]);
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full bg-gray-100">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={() => {
          setIsPanning(false);
          setIsDragging(false);
          setIsSelecting(false);
          setSelectStart(null);
          setSelectionRect(null);
        }}
        onContextMenu={handleContextMenu}
        className="cursor-crosshair"
        style={{ cursor: tool === 'select' ? 'default' : 'crosshair', touchAction: 'none' }}
      />
      <ZoomControls
        transform={transform}
        setTransform={setTransform}
        getCanvasRect={() => canvasRef.current ? canvasRef.current.getBoundingClientRect() : null}
      />
      <ZoomIndicator scale={transform.scale} />
    </div>
  );
}

// Add this new function to draw shape dimensions
function drawShapeDimensions(ctx: CanvasRenderingContext2D, shape: Shape, scale: number, unit: 'mm' | 'in' | 'ft') {
  const bounds = getShapeBounds(shape);
  
  // Only draw dimensions for shapes with valid dimensions
  if (bounds.width <= 0 || bounds.height <= 0) return;
  
  // Conversion factors
  const PX_PER_IN = 96;
  const PX_PER_MM = PX_PER_IN / 25.4;
  const PX_PER_FT = PX_PER_IN * 12;
  
  // Convert dimensions based on the selected unit
  let widthInUnit, heightInUnit;
  switch (unit) {
    case 'mm':
      widthInUnit = bounds.width / PX_PER_MM;
      heightInUnit = bounds.height / PX_PER_MM;
      break;
    case 'in':
      widthInUnit = bounds.width / PX_PER_IN;
      heightInUnit = bounds.height / PX_PER_IN;
      break;
    case 'ft':
      widthInUnit = bounds.width / PX_PER_FT;
      heightInUnit = bounds.height / PX_PER_FT;
      break;
    default:
      widthInUnit = bounds.width / PX_PER_MM;
      heightInUnit = bounds.height / PX_PER_MM;
  }
  
  // Save context to restore later
  ctx.save();
  
  // Set up dimension text styling
  ctx.font = `${12 / scale}px Arial`;
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw width dimension line
  const widthMidX = bounds.x + bounds.width / 2;
  const widthLineY = bounds.y + bounds.height + 20 / scale;
  
  // Draw dimension line
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1 / scale;
  ctx.beginPath();
  ctx.moveTo(bounds.x, widthLineY);
  ctx.lineTo(bounds.x + bounds.width, widthLineY);
  ctx.stroke();
  
  // Draw dimension line end caps
  const capLength = 5 / scale;
  ctx.beginPath();
  ctx.moveTo(bounds.x, widthLineY - capLength);
  ctx.lineTo(bounds.x, widthLineY + capLength);
  ctx.moveTo(bounds.x + bounds.width, widthLineY - capLength);
  ctx.lineTo(bounds.x + bounds.width, widthLineY + capLength);
  ctx.stroke();
  
  // Draw width text in the selected unit
  const widthText = `${widthInUnit.toFixed(unit === 'mm' ? 1 : 2)}${unit}`;
  ctx.fillText(widthText, widthMidX, widthLineY - 8 / scale);
  
  // Draw height dimension line
  const heightMidY = bounds.y + bounds.height / 2;
  const heightLineX = bounds.x + bounds.width + 20 / scale;
  
  // Draw dimension line
  ctx.beginPath();
  ctx.moveTo(heightLineX, bounds.y);
  ctx.lineTo(heightLineX, bounds.y + bounds.height);
  ctx.stroke();
  
  // Draw dimension line end caps
  ctx.beginPath();
  ctx.moveTo(heightLineX - capLength, bounds.y);
  ctx.lineTo(heightLineX + capLength, bounds.y);
  ctx.moveTo(heightLineX - capLength, bounds.y + bounds.height);
  ctx.lineTo(heightLineX + capLength, bounds.y + bounds.height);
  ctx.stroke();
  
  // Draw height text in the selected unit
  const heightText = `${heightInUnit.toFixed(unit === 'mm' ? 1 : 2)}${unit}`;
  ctx.save();
  ctx.translate(heightLineX + 8 / scale, heightMidY);
  ctx.rotate(Math.PI / 2);
  ctx.fillText(heightText, 0, 0);
  ctx.restore();
  
  // Restore context
  ctx.restore();
}
