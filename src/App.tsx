import React, { useState } from 'react';
import { CanvasEditor } from './components/CanvasEditor';
import { Toolbar } from './components/Toolbar';
import { ShapeEditor } from './components/ShapeEditor';
import { FileControls } from './components/FileControls';
import { Button } from './components/ui/button';
import { Menu, X } from 'lucide-react';
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

  const selectedShape = shapes.find(s => selectedShapeIds.includes(s.id));

  const handleShapesChange = (newShapes: Shape[]) => {
    setShapes(newShapes);
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedShapeIds(ids);
  };

  const handleShapeUpdate = (id: string, updates: Partial<Shape>) => {
    setShapes(shapes.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteSelected = () => {
    if (selectedShapeIds.length > 0) {
      setShapes(shapes.filter(s => !selectedShapeIds.includes(s.id)));
      setSelectedShapeIds([]);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden my-2"
            onClick={() => setLeftOpen((prev) => !prev)}
          >
            <Menu />
          </Button>

          <h1 className="text-gray-900">Airtajal Canvas</h1>

          <Button
            variant="outline"
            size="icon"
            className="sm:hidden my-2"
            onClick={() => setRightOpen((prev) => !prev)}
          >
            <Menu />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${leftOpen ? 'block fixed inset-y-0 left-0 z-50 w-20' : 'hidden'} sm:block sm:static sm:z-auto sm:w-12 border-r bg-white shadow-sm`}
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
          <FileControls 
            shapes={shapes}
            selectedShapeId={selectedShape ? selectedShape.id : null}
            onShapesChange={handleShapesChange}
          />
          
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
