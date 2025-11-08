import React, { useState } from 'react';
import { CanvasEditor } from './components/CanvasEditor';
import { Toolbar } from './components/Toolbar';
import { ShapeEditor } from './components/ShapeEditor';
import { FileControls } from './components/FileControls';
import { Shape, Tool } from './types';

export default function App() {
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  const handleShapesChange = (newShapes: Shape[]) => {
    setShapes(newShapes);
  };

  const handleShapeSelect = (id: string | null) => {
    setSelectedShapeId(id);
  };

  const handleShapeUpdate = (id: string, updates: Partial<Shape>) => {
    setShapes(shapes.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteShape = () => {
    if (selectedShapeId) {
      setShapes(shapes.filter(s => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-gray-900">Airtajal Canvas</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 border-r bg-white shadow-sm">
          <Toolbar 
            currentTool={currentTool} 
            onToolChange={setCurrentTool}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
            onStrokeColorChange={setStrokeColor}
            onFillColorChange={setFillColor}
            onStrokeWidthChange={setStrokeWidth}
          />
        </aside>

        <main className="flex-1 overflow-hidden">
          <CanvasEditor
            tool={currentTool}
            shapes={shapes}
            onShapesChange={handleShapesChange}
            selectedShapeId={selectedShapeId}
            onShapeSelect={handleShapeSelect}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
          />
        </main>

        <aside className="w-80 border-l bg-white p-4 shadow-sm overflow-y-auto">
          <FileControls 
            shapes={shapes}
            selectedShapeId={selectedShapeId}
            onShapesChange={handleShapesChange}
          />
          
          {selectedShape && (
            <ShapeEditor
              shape={selectedShape}
              onUpdate={handleShapeUpdate}
              onDelete={handleDeleteShape}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
