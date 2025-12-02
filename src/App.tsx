import React, { useState } from 'react';
import { CanvasEditor } from './components/CanvasEditor';
// import { Toolbar } from './components/Toolbar';
import { ShapeEditor } from './components/ShapeEditor';
import { FileControls } from './components/FileControls';
import { GCodeViewer } from './components/GCodeViewer';
import { Button } from './components/ui/button';
import { X, MousePointer2, Pencil, Minus, Square, Circle as CircleIcon, Triangle, Heart, Star, Pentagon, Hexagon, ArrowRight, Type as TypeIcon } from 'lucide-react';
import { Header } from './components/Header';
import { SelectionTools } from './components/SelectionTools';
import { DrawingTools } from './components/DrawingTools';
// import { ExportTools } from './components/ExportTools';
import { Shape, Tool } from './types';

export default function App() {
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [lastNonSelectTool, setLastNonSelectTool] = useState<Tool | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  // const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<{ shapes: Shape[]; selected: string[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ shapes: Shape[]; selected: string[] }[]>([]);
  const [showGCode, setShowGCode] = useState(false);
  const [gcodeData, setGcodeData] = useState<{ gcode: string; margin: number } | null>(null);
  const [activeMenu, setActiveMenu] = useState<'tools' | 'basic'>('tools');
  const [controlsVisible, setControlsVisible] = useState(false);
  React.useEffect(() => {
    setControlsVisible(false);
  }, []);
  

  const selectedShape = shapes.find(s => selectedShapeIds.includes(s.id));

  const handleShapesChange = (newShapes: Shape[]) => {
    setUndoStack(prev => [...prev, { shapes, selected: selectedShapeIds }]);
    setShapes(newShapes);
    setRedoStack([]);
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedShapeIds(ids);
  };

  const handleSelectionCommit = (ids: string[]) => {
    setUndoStack(prev => [...prev, { shapes, selected: selectedShapeIds }]);
    setSelectedShapeIds(ids);
    setRedoStack([]);
  };

  const handleShapeUpdate = (id: string, updates: Partial<Shape>) => {
    setUndoStack(prev => [...prev, { shapes, selected: selectedShapeIds }]);
    setShapes(shapes.map(s => s.id === id ? { ...s, ...updates } : s));
    setRedoStack([]);
  };

  const handleUpdateSelectedDimensions = (updates: Partial<Shape>) => {
    if (selectedShapeIds.length === 0) return;
    const next = shapes.map(s => selectedShapeIds.includes(s.id) ? { ...s, ...updates } : s);
    setUndoStack(prev => [...prev, { shapes, selected: selectedShapeIds }]);
    setShapes(next);
    setRedoStack([]);
  };

  const handleClearSelection = () => {
    if (selectedShapeIds.length === 0) return;
    setUndoStack(prev => [...prev, { shapes, selected: selectedShapeIds }]);
    setSelectedShapeIds([]);
    setRedoStack([]);
  };

  const handleDeleteSelected = () => {
    if (selectedShapeIds.length > 0) {
      const next = shapes.filter(s => !selectedShapeIds.includes(s.id));
      setUndoStack(prev => [...prev, { shapes, selected: selectedShapeIds }]);
      setShapes(next);
      setSelectedShapeIds([]);
      setRedoStack([]);
    }
  };

  const handleUndo = () => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, { shapes, selected: selectedShapeIds }]);
      setShapes(last.shapes);
      setSelectedShapeIds(last.selected);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoStack(u => [...u, { shapes, selected: selectedShapeIds }]);
      setShapes(last.shapes);
      setSelectedShapeIds(last.selected);
      return prev.slice(0, -1);
    });
  };

  const handleToolChange = (tool: Tool) => {
    if (tool !== 'select') setLastNonSelectTool(tool);
    setCurrentTool(tool);
  };

  const getToolIcon = (tool: Tool) => {
    switch (tool) {
      case 'select':
        return <MousePointer2 className="h-4 w-4" stroke="#2563eb" color="#2563eb" />;
      case 'freeLine':
        return <Pencil className="h-4 w-4" stroke="#0284c7" color="#0284c7" />;
      case 'straightLine':
        return <Minus className="h-4 w-4" stroke="#4f46e5" color="#4f46e5" />;
      case 'rectangle':
        return <Square className="h-4 w-4" stroke="#059669" color="#059669" />;
      case 'circle':
        return <CircleIcon className="h-4 w-4" stroke="#0891b2" color="#0891b2" />;
      case 'triangle':
        return <Triangle className="h-4 w-4" stroke="#ca8a04" color="#ca8a04" />;
      case 'heart':
        return <Heart className="h-4 w-4" stroke="#db2777" color="#db2777" />;
      case 'star':
        return <Star className="h-4 w-4" stroke="#d97706" color="#d97706" />;
      case 'pentagon':
        return <Pentagon className="h-4 w-4" stroke="#9333ea" color="#9333ea" />;
      case 'hexagon':
        return <Hexagon className="h-4 w-4" stroke="#7c3aed" color="#7c3aed" />;
      case 'arrow':
        return <ArrowRight className="h-4 w-4" stroke="#475569" color="#475569" />;
      case 'type':
        return <TypeIcon className="h-4 w-4" stroke="#4b5563" color="#4b5563" />;
      default:
        return null;
    }
  };

  const handleToggleSelectTool = () => {
    if (currentTool === 'select' && lastNonSelectTool) {
      setCurrentTool(lastNonSelectTool);
    } else {
      setCurrentTool('select');
    }
  };

  const handleViewGCode = (gcode: string, margin: number) => {
    setGcodeData({ gcode, margin });
    setShowGCode(true);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header onToggleRight={() => setRightOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar removed */}

        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center bg-gray-100 border-b">
            <button
              onClick={() => setShowGCode(false)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                !showGCode
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Canvas
            </button>
            {gcodeData && (
              <>
                <button
                  onClick={() => setShowGCode(true)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    showGCode
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  G-code Preview
                </button>
                <button
                  onClick={() => {
                    setGcodeData(null);
                    setShowGCode(false);
                  }}
                  className="px-2 py-2 text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              aria-pressed={controlsVisible}
              aria-expanded={controlsVisible}
              aria-controls="controls-panel"
              onClick={() => setControlsVisible(prev => !prev)}
              className="ml-auto rounded-full border px-3 py-1 text-xs font-medium cursor-pointer bg-gray-100 border-gray-300 text-gray-700"
            >
              {controlsVisible ? 'Hide Controls' : 'Show Controls'}
            </button>
          </div>

          {!showGCode && (
            <div
              className={`sticky top-0 z-20 bg-white/95 backdrop-blur border-b px-2 py-2 ${controlsVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              {controlsVisible && (
                <div id="controls-panel">
                  <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={activeMenu === 'tools'}
                    className={`rounded-full border px-3 py-1 text-xs font-medium cursor-pointer flex items-center gap-1.5 bg-gray-100 text-gray-700 ${activeMenu === 'tools' ? 'border-blue-500' : 'border-gray-300'}`}
                    onClick={() => { setActiveMenu('tools'); }}
                  >
                    {activeMenu === 'tools' && getToolIcon(currentTool)}
                    <span>Tools</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={activeMenu === 'basic'}
                    className={`rounded-full border px-3 py-1 text-xs font-medium cursor-pointer flex items-center gap-1.5 bg-gray-100 text-gray-700 ${activeMenu === 'basic' ? 'border-blue-500' : 'border-gray-300'}`}
                    onClick={() => { setActiveMenu('basic'); }}
                  >
                    {activeMenu === 'basic' && getToolIcon(currentTool)}
                    <span>Basic</span>
                  </button>
                </div>
                <div className="flex justify-end gap-2">
                  {activeMenu === 'tools' ? (
                    <SelectionTools
                      currentTool={currentTool}
                      onToolChange={handleToolChange}
                      onToggleSelect={handleToggleSelectTool}
                      onDeleteSelected={handleDeleteSelected}
                      selectedCount={selectedShapeIds.length}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      canUndo={undoStack.length > 0}
                      canRedo={redoStack.length > 0}
                      selectedShape={selectedShape}
                      onUpdateSelectedDimensions={handleUpdateSelectedDimensions}
                      onClearSelection={handleClearSelection}
                    />
                  ) : (
                    <DrawingTools
                      currentTool={currentTool}
                      onToolChange={handleToolChange}
                    />
                  )}
                </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {!showGCode ? (
          <CanvasEditor
            tool={currentTool}
            shapes={shapes}
            onShapesChange={handleShapesChange}
            selectedShapeIds={selectedShapeIds}
            onSelectionChange={handleSelectionChange}
            onSelectionCommit={handleSelectionCommit}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
          />
            ) : gcodeData ? (
              <GCodeViewer gcode={gcodeData.gcode} margin={gcodeData.margin} />
            ) : null}
          </div>
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
            onViewGCode={handleViewGCode}
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

      {rightOpen && (
        <div
          className="fixed inset-0 bg-black/50 sm:hidden"
          onClick={() => { setRightOpen(false); }}
        />
      )}
    </div>
  );
}
