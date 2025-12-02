import React, { useState } from 'react';
import { CanvasEditor } from './components/CanvasEditor';
// import { Toolbar } from './components/Toolbar';
import { ShapeEditor } from './components/ShapeEditor';
import { FileControls } from './components/FileControls';
import { GCodeViewer } from './components/GCodeViewer';
import { Button } from './components/ui/button';
import { X } from 'lucide-react';
import { Header } from './components/Header';
import { ControlsPanel } from './components/ControlsPanel';
import { SelectionTools } from './components/SelectionTools';
import { DrawingTools } from './components/DrawingTools';
// import { ExportTools } from './components/ExportTools';
import { Shape, Tool } from './types';
import { generateGCode } from './utils/gcode';
import { useCanvasTools } from './hooks/useCanvasTools';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useShapes } from './hooks/useShapes';

export default function App() {
  const { currentTool, handleToolChange, handleToggleSelectTool } = useCanvasTools();
  const { undoStack, redoStack, pushState, undo, redo, canUndo, canRedo } = useUndoRedo();
  const {
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
  } = useShapes(pushState);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  // const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showGCode, setShowGCode] = useState(false);
  const [gcodeData, setGcodeData] = useState<{ gcode: string; margin: number } | null>(null);
  const [activeMenu, setActiveMenu] = useState<'tools' | 'basic'>('basic');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [theme, setTheme] = useState('galaxy');

  React.useEffect(() => {
    if (shapes.length === 0) {
      const inch = 96;
      const pxPerMm = inch / 25.4;
      const sampleRect: Shape = {
        id: `sample-${Date.now()}`,
        type: 'rectangle',
        points: [],
        strokeColor: '#111827',
        fillColor: 'transparent',
        strokeWidth: 2,
        x: pxPerMm * 10,
        y: pxPerMm * 10,
        width: inch * 3,
        height: inch * 2,
      };
      setShapes([sampleRect]);
    }
  }, []);
  


  

  const handleUndo = () => {
    undo(shapes, selectedShapeIds, setShapes, setSelectedShapeIds);
  };

  const handleRedo = () => {
    redo(shapes, selectedShapeIds, setShapes, setSelectedShapeIds);
  };

  

  const handleViewGCode = (gcode: string, margin: number) => {
    setGcodeData({ gcode, margin });
    setShowGCode(true);
    setRightOpen(false);
  };

  const getCanvasGcode = () => {
    const shapesToExport = selectedShapeIds.length > 0
      ? shapes.filter(s => selectedShapeIds.includes(s.id))
      : shapes;
    const m = gcodeData ? gcodeData.margin : 5;
    return generateGCode(shapesToExport, m);
  };

  return (
    <div id="app-root" className={`theme-${theme} flex h-screen flex-col bg-background text-foreground`}>
      <Header onToggleRight={() => setRightOpen((prev) => !prev)} isRightOpen={rightOpen} theme={theme} onThemeChange={setTheme} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar removed */}

        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center bg-background border-b border-border">
            <button
              onClick={() => setShowGCode(false)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                !showGCode
                    ? 'border-blue-500 text-blue-600 bg-background'
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
                      ? 'border-blue-500 text-blue-600 bg-background'
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
            {!showGCode && (
              <button
                type="button"
                aria-pressed={controlsVisible}
                aria-expanded={controlsVisible}
                aria-controls="controls-panel"
                onClick={() => setControlsVisible(prev => !prev)}
                className="ml-auto rounded-full border px-3 py-1 text-xs font-medium cursor-pointer bg-background border-border text-foreground"
              >
                {controlsVisible ? 'Hide Controls' : 'Show Controls'}
              </button>
            )}
          </div>

          {!showGCode && (
            <ControlsPanel
              controlsVisible={controlsVisible}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              currentTool={currentTool}
              onToolChange={handleToolChange}
              onToggleSelect={handleToggleSelectTool}
              onDeleteSelected={handleDeleteSelected}
              selectedCount={selectedShapeIds.length}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              selectedShape={selectedShape}
              onUpdateSelectedDimensions={handleUpdateSelectedDimensions}
              onClearSelection={handleClearSelection}
            />
          )}

          <div className={`flex-1 ${showGCode ? 'overflow-auto' : 'overflow-hidden'}`}>
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
              <GCodeViewer gcode={gcodeData.gcode} margin={gcodeData.margin} onLoadFromCanvas={getCanvasGcode} />
            ) : null}
          </div>
        </main>

        <aside
          id="right-sidebar"
          className={`${rightOpen ? 'block fixed inset-y-0 right-0 z-50 w-80' : 'hidden'} sm:block sm:static sm:z-auto sm:w-80 border-l border-border bg-background p-4 shadow-sm overflow-y-auto`}
        >
          
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
