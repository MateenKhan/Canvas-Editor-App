import { useMemo, useState } from 'react';
import { Shape } from '../types';

export function useShapes(pushState: (shapes: Shape[], selected: string[]) => void) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);

  const selectedShape = useMemo(
    () => shapes.find(s => selectedShapeIds.includes(s.id)),
    [shapes, selectedShapeIds]
  );

  const handleShapesChange = (newShapes: Shape[]) => {
    pushState(shapes, selectedShapeIds);
    setShapes(newShapes);
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedShapeIds(ids);
  };

  const handleSelectionCommit = (ids: string[]) => {
    pushState(shapes, selectedShapeIds);
    setSelectedShapeIds(ids);
  };

  const handleShapeUpdate = (id: string, updates: Partial<Shape>) => {
    pushState(shapes, selectedShapeIds);
    setShapes(shapes.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleUpdateSelectedDimensions = (updates: Partial<Shape>) => {
    if (selectedShapeIds.length === 0) return;
    const next = shapes.map(s => (selectedShapeIds.includes(s.id) ? { ...s, ...updates } : s));
    pushState(shapes, selectedShapeIds);
    setShapes(next);
  };

  const handleClearSelection = () => {
    if (selectedShapeIds.length === 0) return;
    pushState(shapes, selectedShapeIds);
    setSelectedShapeIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedShapeIds.length === 0) return;
    const next = shapes.filter(s => !selectedShapeIds.includes(s.id));
    pushState(shapes, selectedShapeIds);
    setShapes(next);
    setSelectedShapeIds([]);
  };

  return {
    shapes,
    setShapes,
    selectedShapeIds,
    setSelectedShapeIds,
    selectedShape,
    handleShapesChange,
    handleSelectionChange,
    handleSelectionCommit,
    handleShapeUpdate,
    handleUpdateSelectedDimensions,
    handleClearSelection,
    handleDeleteSelected,
  };
}

