import React, { useState, useRef } from 'react';
import { CanvasEditor } from './components/CanvasEditor';
// import { Toolbar } from './components/Toolbar';
import { ShapeEditor } from './components/ShapeEditor';
import { FileControls } from './components/FileControls';
import { GCodeViewer } from './components/GCodeViewer';
import { X, MousePointer2, List } from 'lucide-react';
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
  const [textFontFamily, setTextFontFamily] = useState<string>('Signatra');
  const [textFontStyle, setTextFontStyle] = useState<'normal' | 'italic'>('normal');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showGCode, setShowGCode] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [gcodeData, setGcodeData] = useState<{ gcode: string; margin: number } | null>(null);
  const [activeMenu, setActiveMenu] = useState<'tools' | 'basic'>('basic');
  const [theme, setTheme] = useState('galaxy');
  const [currentUnit, setCurrentUnit] = useState<'mm' | 'in' | 'ft'>('mm'); // Add unit state
  const [textToCreate, setTextToCreate] = useState<{ text: string; fontFamily: string; fontStyle: 'normal' | 'italic'; fontWeight: 'normal' | 'bold'; fontSize: number; x: number; y: number; fontUrl?: string } | null>(null);
  const textPopupFunctionRef = useRef<{ openTextPopupAt: (x: number, y: number) => void }>(null);

  const handleTextCreate = (text: string, fontFamily: string, fontStyle: 'normal' | 'italic', fontWeight: 'normal' | 'bold', fontSize: number, x: number, y: number, fontUrl?: string) => {
    setTextToCreate({ text, fontFamily, fontStyle, fontWeight, fontSize, x, y, fontUrl });
  };

  React.useEffect(() => {
    if (shapes.length === 0) {
      // Use mm as default unit instead of inches
      const pxPerMm = 96 / 25.4; // pixels per millimeter
      const sampleRect: Shape = {
        id: `sample-${Date.now()}`,
        type: 'rectangle',
        points: [],
        strokeColor: '#111827',
        fillColor: 'transparent',
        strokeWidth: 2,
        x: pxPerMm * 10,  // 10mm from left
        y: pxPerMm * 10,  // 10mm from top
        width: pxPerMm * 100,  // 100mm wide
        height: pxPerMm * 50,  // 50mm tall
      };
      setShapes([sampleRect]);
    }
  }, []);

  // Clear textToCreate after it's processed
  React.useEffect(() => {
    if (textToCreate) {
      // Don't clear it immediately, let CanvasEditor handle it
      // setTextToCreate(null);
    }
  }, [textToCreate]);

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

  const handleSimulateFromCanvas = () => {
    const shapesToExport = selectedShapeIds.length > 0
      ? shapes.filter(s => selectedShapeIds.includes(s.id))
      : shapes;
    const margin = gcodeData ? gcodeData.margin : 5;
    const gcode = generateGCode(shapesToExport, margin);
    setGcodeData({ gcode, margin });
    setShowGCode(true);
    setRightOpen(false);
  };

  // Handle unit change from controls
  const handleUnitChange = (newUnit: 'mm' | 'in' | 'ft') => {
    setCurrentUnit(newUnit);
  };

  return (
    <div id="app-root" className={`theme-${theme} flex h-screen flex-col bg-background text-foreground`}>
      <Header onToggleRight={() => setRightOpen((prev) => !prev)} isRightOpen={rightOpen} theme={theme} onThemeChange={setTheme} />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${leftOpen ? 'block fixed inset-y-0 left-0 z-50 w-64' : 'hidden'} sm:block sm:static sm:z-auto sm:w-64 border-r border-border bg-background p-3 shadow-sm overflow-y-auto`}
        >
          {(() => {
            const selected = shapes.filter(s => selectedShapeIds.includes(s.id));
            const typeName = (t: Tool | Shape['type']) => {
              switch (t) {
                case 'rectangle':
                  return 'square';
                case 'straightLine':
                  return 'line';
                case 'freeLine':
                  return 'free-line';
                case 'circle':
                  return 'circle';
                case 'triangle':
                  return 'triangle';
                case 'heart':
                  return 'heart';
                case 'star':
                  return 'star';
                case 'pentagon':
                  return 'pentagon';
                case 'hexagon':
                  return 'hexagon';
                case 'arrow':
                  return 'arrow';
                case 'type':
                  return 'text';
                default:
                  return String(t);
              }
            };
            const itemsFor = (list: Shape[]) => {
              const counts: Record<string, number> = {};
              return list.map(s => {
                const base = typeName(s.type as any);
                const n = (counts[base] ?? 0) + 1;
                counts[base] = n;
                return { id: s.id, name: `${base}-${n}` };
              });
            };
            const selectedItems = itemsFor(selected);
            const allItems = itemsFor(shapes);
            return (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">All Shapes</div>
                  <ul className="space-y-1">
                    {allItems.length === 0 ? (
                      <li className="text-muted-foreground text-sm">None</li>
                    ) : (
                      allItems.map((item) => (
                        <li
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.id);
                          }}
                          className="text-sm rounded border border-border bg-card px-2 py-1 cursor-grab"
                        >
                          {item.name}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Selected Shapes</div>
                  <ul
                    className="space-y-1"
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData('text/plain');
                      if (!id) return;
                      if (selectedShapeIds.includes(id)) return;
                      setSelectedShapeIds([...selectedShapeIds, id]);
                    }}
                  >
                    {selectedItems.length === 0 ? (
                      <li className="text-muted-foreground text-sm">None</li>
                    ) : (
                      selectedItems.map((item) => (
                        <li key={item.id} className="text-sm rounded border border-border bg-card px-2 py-1 flex items-center justify-between">
                          <span>{item.name}</span>
                          <button
                            type="button"
                            className="ml-2 inline-flex items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground size-6"
                            onClick={() => setSelectedShapeIds(selectedShapeIds.filter(id => id !== item.id))}
                            title="Unselect"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            );
          })()}
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center bg-background border-b border-border">
            <button
              onClick={() => { setShowGCode(false); setShowSimulation(false); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                !showGCode && !showSimulation
                    ? 'border-blue-500 text-blue-600 bg-background'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Canvas
              </button>
            <button
              onClick={() => {
                if (!gcodeData) {
                  const gcode = getCanvasGcode();
                  setGcodeData({ gcode, margin: 5 });
                }
                setShowSimulation(false);
                setShowGCode(true);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                showGCode && !showSimulation
                  ? 'border-blue-500 text-blue-600 bg-background'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              G-code
            </button>
            <button
              onClick={() => { setShowGCode(false); setShowSimulation(true); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                showSimulation
                  ? 'border-blue-500 text-blue-600 bg-background'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Simulation
            </button>
            {(showGCode || showSimulation) && (
              <button
                onClick={() => {
                  setGcodeData(null);
                  setShowGCode(false);
                  setShowSimulation(false);
                }}
                className="px-2 py-2 text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showSimulation && (
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b px-2 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs font-medium cursor-pointer flex items-center gap-1.5 bg-gray-100 text-gray-700 border-gray-300"
                  onClick={() => handleToolChange('select')}
                  title="Select"
                >
                  <MousePointer2 className="h-4 w-4 ml-1 rounded-full" />
                </button>
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs font-medium cursor-pointer flex items-center gap-1.5 bg-gray-100 text-gray-700 border-gray-300"
                  onClick={() => setLeftOpen(prev => !prev)}
                  title="Toggle selected shapes list"
                >
                  <List className="h-4 w-4 ml-1 rounded-full" />
                </button>
              </div>
            </div>
          )}

          {!showGCode && !showSimulation && (
          <ControlsPanel
              controlsVisible={true}
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
              onSimulate={handleSimulateFromCanvas}
              shapes={shapes}
              onShapesChange={handleShapesChange}
              onUnitChange={handleUnitChange}
              textFontFamily={textFontFamily}
              textFontStyle={textFontStyle}
              onTextFontFamilyChange={setTextFontFamily}
              onTextFontStyleChange={setTextFontStyle}
              onTextCreate={handleTextCreate}
              currentUnit={currentUnit} // Pass currentUnit to ControlsPanel
              onToggleSelectedList={() => setLeftOpen(prev => !prev)}
            />
          )}
          {showGCode && (
            <></>
          )}

          <div className={`flex-1 ${(showGCode || showSimulation) ? 'overflow-auto' : 'overflow-hidden'}`}>
            {(!showGCode && !showSimulation) ? (
          <CanvasEditor
            tool={currentTool}
            shapes={shapes}
            onShapesChange={handleShapesChange}
            selectedShapeIds={selectedShapeIds}
            onSelectionChange={handleSelectionChange}
            onSelectionCommit={handleSelectionCommit}
            onToolChange={handleToolChange}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
            currentUnit={currentUnit}
            textFontFamily={textFontFamily}
            textFontStyle={textFontStyle}
            textToCreate={textToCreate}
            onTextCreate={handleTextCreate}
            onRequestTextPopup={(x: number, y: number) => {
              if (textPopupFunctionRef.current) {
                textPopupFunctionRef.current.openTextPopupAt(x, y);
              }
            }}
          />
            ) : showGCode ? (
              gcodeData ? (
                <GCodeViewer gcode={gcodeData.gcode} margin={gcodeData.margin} onLoadFromCanvas={getCanvasGcode} showSimulationControls={false} showGcodeEditor={true} showLoadFromGcodeButton={true} />
              ) : null
            ) : showSimulation ? (
              gcodeData ? (
                <GCodeViewer gcode={gcodeData.gcode} margin={gcodeData.margin} onLoadFromCanvas={getCanvasGcode} showSimulationControls={true} showSimulationHeader={false} showGcodeEditor={false} showLoadFromGcodeButton={false} showDownload={false} />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Click Simulate to load G-code from canvas</div>
              )
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