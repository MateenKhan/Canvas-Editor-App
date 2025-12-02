import { useState } from 'react';
import { Shape } from '../types';

type Snapshot = { shapes: Shape[]; selected: string[] };

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);

  const pushState = (shapes: Shape[], selected: string[]) => {
    setUndoStack(prev => [...prev, { shapes, selected }]);
    setRedoStack([]);
  };

  const undo = (
    currentShapes: Shape[],
    currentSelected: string[],
    setShapes: (s: Shape[]) => void,
    setSelected: (ids: string[]) => void,
  ) => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, { shapes: currentShapes, selected: currentSelected }]);
      setShapes(last.shapes);
      setSelected(last.selected);
      return prev.slice(0, -1);
    });
  };

  const redo = (
    currentShapes: Shape[],
    currentSelected: string[],
    setShapes: (s: Shape[]) => void,
    setSelected: (ids: string[]) => void,
  ) => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoStack(u => [...u, { shapes: currentShapes, selected: currentSelected }]);
      setShapes(last.shapes);
      setSelected(last.selected);
      return prev.slice(0, -1);
    });
  };

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return { undoStack, redoStack, pushState, undo, redo, canUndo, canRedo };
}

