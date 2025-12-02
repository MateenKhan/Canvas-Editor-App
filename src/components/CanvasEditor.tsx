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
import { Input } from './ui/input';

interface CanvasEditorProps {
  tool: Tool;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  selectedShapeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSelectionCommit: (ids: string[]) => void;
  onToolChange: (tool: Tool) => void; // Add onToolChange prop
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  textFontFamily?: string;
  textFontStyle?: 'normal' | 'italic';
  textFontWeight?: 'normal' | 'bold';
  currentUnit?: 'mm' | 'in' | 'ft'; // Add currentUnit prop
}

export function CanvasEditor({
  tool,
  shapes,
  onShapesChange,
  selectedShapeIds,
  onSelectionChange,
  onSelectionCommit,
  onToolChange, // Add onToolChange to destructuring
  strokeColor,
  fillColor,
  strokeWidth,
  textFontFamily,
  textFontStyle,
  textFontWeight,
  currentUnit = 'mm'
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
  const [editingText, setEditingText] = useState<{ id: string; value: string } | null>(null);

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
        // Start drawing
        setIsDrawing(true);
        const newShape = createShape(
          tool,
          point,
          strokeColor,
          fillColor,
          strokeWidth,
          tool === 'type' ? { fontFamily: textFontFamily, fontStyle: textFontStyle, fontWeight: textFontWeight } : undefined
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
        strokeWidth,
        tool === 'type' ? { fontFamily: textFontFamily, fontStyle: textFontStyle, fontWeight: textFontWeight } : undefined
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

    if (isResizing && resizeTargetId && resizeHandle && resizeStartPoint) {
      const idx = shapes.findIndex(s => s.id === resizeTargetId);
      if (idx !== -1) {
        const base = { ...(originalShape || shapes[idx]) } as Shape;
        const dxTotal = point.x - resizeStartPoint.x;
        const dyTotal = point.y - resizeStartPoint.y;
        const target = { ...base } as Shape;
        if (target.type === 'straightLine' || target.type === 'arrow') {
          if (resizeHandle === 'start' && base.startPoint) {
            target.startPoint = { x: (base.startPoint.x ?? 0) + dxTotal, y: (base.startPoint.y ?? 0) + dyTotal };
            if (target.type === 'straightLine') target.points = [target.startPoint!, base.endPoint!];
          } else if (resizeHandle === 'end' && base.endPoint) {
            target.endPoint = { x: (base.endPoint.x ?? 0) + dxTotal, y: (base.endPoint.y ?? 0) + dyTotal };
            if (target.type === 'straightLine') target.points = [base.startPoint!, target.endPoint!];
          }
        } else {
          const x = base.x ?? 0;
          const y = base.y ?? 0;
          const w = base.width ?? 0;
          const h = base.height ?? 0;
          let nx = x;
          let ny = y;
          let nw = w;
          let nh = h;
          if (resizeHandle.includes('e')) { nw = Math.max(1, w + dxTotal); }
          if (resizeHandle.includes('s')) { nh = Math.max(1, h + dyTotal); }
          if (resizeHandle.includes('w')) { nx = x + dxTotal; nw = Math.max(1, w - dxTotal); }
          if (resizeHandle.includes('n')) { ny = y + dyTotal; nh = Math.max(1, h - dyTotal); }
          target.x = nx;
          target.y = ny;
          target.width = nw;
          target.height = nh;
        }
        const updated = shapes.map(s => (s.id === resizeTargetId ? target : s));
        onShapesChange(updated);
      }
      return;
    }

    if (isSelecting && selectStart && tool === 'select') {
      const x0 = selectStart.x;
      const y0 = selectStart.y;
      const x1 = point.x;
      const y1 = point.y;
      const rect = {
        x: Math.min(x0, x1),
        y: Math.min(y0, y1),
        width: Math.abs(x1 - x0),
        height: Math.abs(y1 - y0),
      };
      const isRTL = x1 < x0;
      const mode: 'contains' | 'intersects' = isRTL ? 'intersects' : 'contains';
      setSelectionMode(mode);
      const regionIds = shapes
        .filter(s => (mode === 'contains' ? containsRect(rect, getShapeBounds(s)) : intersectsRect(rect, getShapeBounds(s))))
        .map(s => s.id);
      const minW = 3 / transform.scale;
      const minH = 3 / transform.scale;
      if (regionIds.length > 0 && (rect.width >= minW || rect.height >= minH)) {
        setSelectionRect(rect);
      } else {
        setSelectionRect(null);
      }
      const combined = mergeSelection(selectedShapeIds, regionIds, e.shiftKey, e.ctrlKey || e.metaKey);
      onSelectionChange(combined);
      return;
    }

    if (isDrawing && currentShape) {
      const updated = updateShape(tool, currentShape, point);
      setCurrentShape(updated);
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

    if (isSelecting && selectStart && tool === 'select') {
      const x0 = selectStart.x;
      const y0 = selectStart.y;
      const x1 = point.x;
      const y1 = point.y;
      const rectSel = {
        x: Math.min(x0, x1),
        y: Math.min(y0, y1),
        width: Math.abs(x1 - x0),
        height: Math.abs(y1 - y0),
      };
      const isRTL = x1 < x0;
      const mode: 'contains' | 'intersects' = isRTL ? 'intersects' : 'contains';
      setSelectionMode(mode);
      const regionIds = shapes
        .filter(s => (mode === 'contains' ? containsRect(rectSel, getShapeBounds(s)) : intersectsRect(rectSel, getShapeBounds(s))))
        .map(s => s.id);
      const minW = 3 / transform.scale;
      const minH = 3 / transform.scale;
      if (regionIds.length > 0 && (rectSel.width >= minW || rectSel.height >= minH)) {
        setSelectionRect(rectSel);
      } else {
        setSelectionRect(null);
      }
      onSelectionChange(regionIds);
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

    // Handle resizing on touch devices
    if (isResizing && resizeTargetId && resizeHandle && resizeStartPoint) {
      const idx = shapes.findIndex(s => s.id === resizeTargetId);
      if (idx !== -1) {
        const base = { ...(originalShape || shapes[idx]) } as Shape;
        const dxTotal = point.x - resizeStartPoint.x;
        const dyTotal = point.y - resizeStartPoint.y;
        const target = { ...base } as Shape;
        if (target.type === 'straightLine' || target.type === 'arrow') {
          if (resizeHandle === 'start' && base.startPoint) {
            target.startPoint = { x: (base.startPoint.x ?? 0) + dxTotal, y: (base.startPoint.y ?? 0) + dyTotal };
            if (target.type === 'straightLine') target.points = [target.startPoint!, base.endPoint!];
          } else if (resizeHandle === 'end' && base.endPoint) {
            target.endPoint = { x: (base.endPoint.x ?? 0) + dxTotal, y: (base.endPoint.y ?? 0) + dyTotal };
            if (target.type === 'straightLine') target.points = [base.startPoint!, target.endPoint!];
          }
        } else {
          const x = base.x ?? 0;
          const y = base.y ?? 0;
          const w = base.width ?? 0;
          const h = base.height ?? 0;
          let nx = x;
          let ny = y;
          let nw = w;
          let nh = h;
          if (resizeHandle.includes('e')) { nw = Math.max(1, w + dxTotal); }
          if (resizeHandle.includes('s')) { nh = Math.max(1, h + dyTotal); }
          if (resizeHandle.includes('w')) { nx = x + dxTotal; nw = Math.max(1, w - dxTotal); }
          if (resizeHandle.includes('n')) { ny = y + dyTotal; nh = Math.max(1, h - dyTotal); }
          target.x = nx;
          target.y = ny;
          target.width = nw;
          target.height = nh;
        }
        const updated = shapes.map(s => (s.id === resizeTargetId ? target : s));
        onShapesChange(updated);
      }
      return;
    }

    if (isDrawing && currentShape) {
      const updated = updateShape(tool, currentShape, point);
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

    if (isResizing) {
      setIsResizing(false);
      setResizeTargetId(null);
      setResizeHandle(null);
      setOriginalShape(null);
      setResizeStartPoint(null);
      return;
    }

    if (isSelecting) {
      onSelectionCommit(selectedShapeIds);
      setIsSelecting(false);
      setSelectStart(null);
      setSelectionRect(null);
      return;
    }

    if (isDrawing && currentShape) {
      let newShapeId: string | null = null;
      
      if (currentShape.type === 'type') {
        onShapesChange([...shapes, currentShape]);
        newShapeId = currentShape.id;
        setEditingText({ id: currentShape.id, value: currentShape.text ?? '' });
      } else if (currentShape.type === 'freeLine' && currentShape.points.length > 1) {
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
      if (ct && ct.length === 1) {
        const screenX = ct[0].clientX - rect.left;
        const screenY = ct[0].clientY - rect.top;
        const point = screenToCanvas(screenX, screenY);
        const now = Date.now();
        const isDouble = lastTapTime !== null && now - lastTapTime < 350 && lastTapPoint !== null && Math.hypot(point.x - lastTapPoint.x, point.y - lastTapPoint.y) < 10 / transform.scale;
        setLastTapTime(now);
        setLastTapPoint(point);
        if (isDouble) {
          let hitId: string | null = null;
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(point, shapes[i])) { hitId = shapes[i].id; break; }
          }
          if (!hitId) {
            onSelectionChange([]);
            onSelectionCommit([]);
            setIsSelecting(false);
            setSelectStart(null);
            setSelectionRect(null);
            return;
          }
        }
      }
    }
    
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    if (isSelecting) {
      onSelectionCommit(selectedShapeIds);
      setIsSelecting(false);
      setSelectStart(null);
      setSelectionRect(null);
      return;
    }
    // Handle resize end on touch devices
    if (isResizing) {
      setIsResizing(false);
      setResizeTargetId(null);
      setResizeHandle(null);
      setOriginalShape(null);
      setResizeStartPoint(null);
      return;
    }
    if (isDrawing && currentShape) {
      let newShapeId: string | null = null;
      
      if (currentShape.type === 'type') {
        onShapesChange([...shapes, currentShape]);
        newShapeId = currentShape.id;
        setEditingText({ id: currentShape.id, value: currentShape.text ?? '' });
      } else if (currentShape.type === 'freeLine' && currentShape.points.length > 1) {
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
      onSelectionChange([]);
      onSelectionCommit([]);
      setIsSelecting(false);
      setSelectStart(null);
      setSelectionRect(null);
    } else {
      const s = shapes.find(x => x.id === foundId);
      if (s && s.type === 'type') {
        setEditingText({ id: s.id, value: s.text ?? '' });
      }
    }
  };

  const commitTextEdit = () => {
    if (!editingText) return;
    const updated = shapes.map(s => (s.id === editingText.id ? { ...s, text: editingText.value } : s));
    onShapesChange(updated);
    setEditingText(null);
  };

  const cancelTextEdit = () => {
    setEditingText(null);
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
      {editingText && (() => {
        const s = shapes.find(x => x.id === editingText.id);
        if (!s) return null as any;
        const x = (s.startPoint?.x ?? s.x ?? 0) * transform.scale + transform.translateX;
        const y = (s.startPoint?.y ?? s.y ?? 0) * transform.scale + transform.translateY;
        const fs = (s.fontSize ?? 20) * transform.scale;
        const w = Math.max(50, Math.round((editingText.value.length || 1) * fs * 0.6));
        return (
          <Input
            autoFocus
            value={editingText.value}
            onChange={(e) => setEditingText({ id: editingText.id, value: e.target.value })}
            onBlur={commitTextEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTextEdit();
              if (e.key === 'Escape') cancelTextEdit();
            }}
            style={{ position: 'absolute', left: x, top: y, fontSize: fs, width: w, color: s.strokeColor || '#000', backgroundColor: 'rgba(255,255,255,0.95)', fontFamily: s.fontFamily || 'Arial', fontStyle: s.fontStyle || 'normal', fontWeight: s.fontWeight || 'normal' }}
          />
        );
      })()}
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
