import React, { useState } from 'react';
import { CanvasEditor } from './components/CanvasEditor';
import { Toolbar } from './components/Toolbar';
import { ShapeEditor } from './components/ShapeEditor';
import { FileControls } from './components/FileControls';
import { Button } from './components/ui/button';
import { X } from 'lucide-react';
import { Header } from './components/Header';
import { ExportTools } from './components/ExportTools';
import { Shape, Tool } from './types';

export default function App() {
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<Shape[][]>([]);
  const [redoStack, setRedoStack] = useState<Shape[][]>([]);

  const selectedShape = shapes.find(s => selectedShapeIds.includes(s.id));

  const handleShapesChange = (newShapes: Shape[]) => {
    setUndoStack(prev => [...prev, shapes]);
    setShapes(newShapes);
    setRedoStack([]);
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedShapeIds(ids);
  };

  const handleShapeUpdate = (id: string, updates: Partial<Shape>) => {
    setShapes(shapes.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleUpdateSelectedDimensions = (updates: Partial<Shape>) => {
    if (selectedShapeIds.length === 0) return;
    const next = shapes.map(s => selectedShapeIds.includes(s.id) ? { ...s, ...updates } : s);
    setUndoStack(prev => [...prev, shapes]);
    setShapes(next);
    setRedoStack([]);
  };

  const handleDeleteSelected = () => {
    if (selectedShapeIds.length > 0) {
      const next = shapes.filter(s => !selectedShapeIds.includes(s.id));
      setUndoStack(prev => [...prev, shapes]);
      setShapes(next);
      setSelectedShapeIds([]);
      setRedoStack([]);
    }
  };

  const handleUndo = () => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, shapes]);
      setShapes(last);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoStack(u => [...u, shapes]);
      setShapes(last);
      return prev.slice(0, -1);
    });
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header onToggleLeft={() => setLeftOpen((prev) => !prev)} onToggleRight={() => setRightOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${leftOpen ? 'block fixed inset-y-0 left-0 z-50 w-20' : 'hidden'} sm:block sm:static sm:z-auto sm:w-12 border-r bg-white shadow-sm h-full overflow-y-auto`}
        >
          <Toolbar 
            currentTool={currentTool} 
            onToolChange={setCurrentTool}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
            onStrokeColorChange={setStrokeColor}
            onFillColorChange={setFillColor}
            onStrokeWidthChange={setStrokeWidth}
            onDeleteSelected={handleDeleteSelected}
            selectedCount={selectedShapeIds.length}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            selectedShape={selectedShape}
            onUpdateSelectedDimensions={handleUpdateSelectedDimensions}
          />
        </aside>

        <main className="flex-1 overflow-hidden">
          <CanvasEditor
            tool={currentTool}
            shapes={shapes}
            onShapesChange={handleShapesChange}
            selectedShapeIds={selectedShapeIds}
            onSelectionChange={handleSelectionChange}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
          />
        </main>

        <aside
          className={`${rightOpen ? 'block fixed inset-y-0 right-0 z-50 w-80' : 'hidden'} sm:block sm:static sm:z-auto sm:w-80 border-l bg-white p-4 shadow-sm overflow-y-auto`}
        >
          <div className="sm:hidden flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => setRightOpen(false)}>
              <X />
            </Button>
          </div>
          <ExportTools shapes={shapes} selectedShapeId={selectedShape ? selectedShape.id : null} onShapesChange={handleShapesChange} />
          
          {selectedShape && (
            <ShapeEditor
              shape={selectedShape}
              onUpdate={handleShapeUpdate}
              onDelete={handleDeleteSelected}
            />
          )}
        </aside>
      </div>

      {(leftOpen || rightOpen) && (
        <div
          className="fixed inset-0 bg-black/50 sm:hidden"
          onClick={() => { setLeftOpen(false); setRightOpen(false); }}
        />
      )}
    </div>
  );
}
