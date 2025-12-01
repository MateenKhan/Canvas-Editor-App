import React from 'react';
import { Shape } from '../types';
import { FileControls } from './FileControls';

interface ExportToolsProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onShapesChange: (shapes: Shape[]) => void;
}

export function ExportTools({ shapes, selectedShapeId, onShapesChange }: ExportToolsProps) {
  return (
    <FileControls shapes={shapes} selectedShapeId={selectedShapeId} onShapesChange={onShapesChange} />
  );
}
