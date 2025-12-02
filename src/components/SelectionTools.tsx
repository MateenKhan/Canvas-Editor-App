import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Tool, Shape } from '../types';
import { MousePointer2, Trash2, Undo2, Redo2, Ruler, XCircle, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';

interface SelectionToolsProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onToggleSelect: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedShape?: { id: string; x?: number; y?: number; width?: number; height?: number } | undefined;
  onUpdateSelectedDimensions: (updates: Partial<{ x: number; y: number; width: number; height: number }>) => void;
  onClearSelection: () => void;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  onUnitChange: (unit: 'mm' | 'in' | 'ft') => void; // Add onUnitChange prop
}

export function SelectionTools({ 
  currentTool, 
  onToolChange, 
  onToggleSelect, 
  onDeleteSelected, 
  selectedCount, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  selectedShape, 
  onUpdateSelectedDimensions, 
  onClearSelection,
  shapes,
  onShapesChange,
  onUnitChange // Add onUnitChange prop
}: SelectionToolsProps) {
  const [measureOpen, setMeasureOpen] = useState(false);
  const [unit, setUnit] = useState<'mm' | 'in' | 'ft'>('mm');
  const [prevUnit, setPrevUnit] = useState<'mm' | 'in' | 'ft'>('mm'); // Track previous unit
  const measureButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  
  // Update the PX_PER constants to support all units
  const PX_PER_IN = 96;
  const PX_PER_MM = PX_PER_IN / 25.4;
  const PX_PER_FT = PX_PER_IN * 12;
  
  const pxPerUnit = useMemo(() => {
    switch (unit) {
      case 'mm': return PX_PER_MM;
      case 'in': return PX_PER_IN;
      case 'ft': return PX_PER_FT;
      default: return PX_PER_MM;
    }
  }, [unit]);
  
  const prevPxPerUnit = useMemo(() => {
    switch (prevUnit) {
      case 'mm': return PX_PER_MM;
      case 'in': return PX_PER_IN;
      case 'ft': return PX_PER_FT;
      default: return PX_PER_MM;
    }
  }, [prevUnit]);

  const toUnit = (px?: number) => (px ?? 0) / pxPerUnit;
  const toPx = (val: number) => val * pxPerUnit;
  
  // State for dimension values
  const [wVal, setWVal] = useState<string>('');
  const [hVal, setHVal] = useState<string>('');
  const [xVal, setXVal] = useState<string>('');
  const [yVal, setYVal] = useState<string>('');
  
  // Handle unit change and update all shapes
  const handleUnitChange = (newUnit: string) => {
    const typedNewUnit = newUnit as 'mm' | 'in' | 'ft';
    
    // Update all shapes to convert dimensions to the new unit
    const updatedShapes = shapes.map(shape => {
      // Only update shapes with dimension properties
      if (shape.type === 'freeLine' || shape.type === 'type') {
        // These shapes don't have standard width/height/x/y properties
        return shape;
      }
      
      const updates: any = {};
      
      // Convert width if it exists
      if (shape.width !== undefined) {
        // Convert from previous unit to pixels, then to new unit
        const pixels = shape.width * prevPxPerUnit;
        updates.width = pixels / (typedNewUnit === 'mm' ? PX_PER_MM : typedNewUnit === 'in' ? PX_PER_IN : PX_PER_FT);
      }
      
      // Convert height if it exists
      if (shape.height !== undefined) {
        // Convert from previous unit to pixels, then to new unit
        const pixels = shape.height * prevPxPerUnit;
        updates.height = pixels / (typedNewUnit === 'mm' ? PX_PER_MM : typedNewUnit === 'in' ? PX_PER_IN : PX_PER_FT);
      }
      
      // Convert x if it exists
      if (shape.x !== undefined) {
        // Convert from previous unit to pixels, then to new unit
        const pixels = (shape.x || 0) * prevPxPerUnit;
        updates.x = pixels / (typedNewUnit === 'mm' ? PX_PER_MM : typedNewUnit === 'in' ? PX_PER_IN : PX_PER_FT);
      }
      
      // Convert y if it exists
      if (shape.y !== undefined) {
        // Convert from previous unit to pixels, then to new unit
        const pixels = (shape.y || 0) * prevPxPerUnit;
        updates.y = pixels / (typedNewUnit === 'mm' ? PX_PER_MM : typedNewUnit === 'in' ? PX_PER_IN : PX_PER_FT);
      }
      
      return { ...shape, ...updates };
    });
    
    // Update shapes in the canvas
    onShapesChange(updatedShapes);
    
    // Update unit states
    setPrevUnit(unit);
    setUnit(typedNewUnit);
    
    // Notify parent component of unit change
    onUnitChange(typedNewUnit);
    
    // Close the measure dialog
    setMeasureOpen(false);
  };

  // Update dimension values when selected shape or unit changes
  useEffect(() => {
    if (selectedShape) {
      setWVal(selectedShape.width !== undefined ? toUnit(selectedShape.width).toFixed(unit === 'mm' ? 1 : 2) : '');
      setHVal(selectedShape.height !== undefined ? toUnit(selectedShape.height).toFixed(unit === 'mm' ? 1 : 2) : '');
      setXVal(selectedShape.x !== undefined ? toUnit(selectedShape.x).toFixed(unit === 'mm' ? 1 : 2) : '');
      setYVal(selectedShape.y !== undefined ? toUnit(selectedShape.y).toFixed(unit === 'mm' ? 1 : 2) : '');
    } else {
      setWVal('');
      setHVal('');
      setXVal('');
      setYVal('');
    }
  }, [selectedShape, unit, pxPerUnit]); // Added unit and pxPerUnit to dependencies

  // Calculate popover position when measure dialog opens
  useEffect(() => {
    if (measureOpen && measureButtonRef.current) {
      const buttonRect = measureButtonRef.current.getBoundingClientRect();
      const containerRect = measureButtonRef.current.closest('.flex.flex-row')?.getBoundingClientRect();
      
      if (containerRect) {
        setPopoverPosition({
          top: buttonRect.bottom - containerRect.top + 5,
          left: buttonRect.left - containerRect.left
        });
      }
    }
  }, [measureOpen]);

  return (
    <div className="w-full">
      <div className="flex-wrap items-center gap-1.5 rounded-full bg-gray-50 border px-2 py-1 shadow-sm min-w-0">
        <Button
          variant={currentTool === 'select' ? 'default' : 'ghost'}
          size="icon"
          onClick={onToggleSelect}
          title="Select"
          className={`${currentTool === 'select' ? 'bg-blue-500 text-white ring-2 ring-blue-500 scale-110' : ''} h-10 w-10 rounded-full inline-flex items-center justify-center transition-all duration-200 ease-in-out`}
        >
          <MousePointer2 className="h-5 w-5" stroke="#2563eb" color="#2563eb" />
        </Button>
        
        <div className="inline-flex items-center">
          <Button
            ref={measureButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => setMeasureOpen(true)}
            title={selectedShape ? "Measure" : "Select a shape to measure"}
            className="h-10 w-10 rounded-full inline-flex items-center justify-center"
            disabled={!selectedShape}
          >
            <Ruler className="h-5 w-5" stroke={selectedShape ? "#334155" : "#94a3b8"} color={selectedShape ? "#334155" : "#94a3b8"} />
          </Button>
          
          {/* Units dropdown beside the measure icon */}
          <div className="relative">
            <Select value={unit} onValueChange={handleUnitChange}>
              <SelectTrigger className="h-6 w-auto px-2 py-0 text-xs border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">mm</SelectItem>
                <SelectItem value="in">in</SelectItem>
                <SelectItem value="ft">ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          title="Unselect All"
          className="h-10 w-10 rounded-full inline-flex items-center justify-center"
        >
          <XCircle className="h-5 w-5" stroke="#64748b" color="#64748b" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="h-10 w-10 rounded-full inline-flex items-center justify-center"
        >
          <Undo2 className="h-5 w-5" stroke="#d97706" color="#d97706" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className="h-10 w-10 rounded-full inline-flex items-center justify-center"
        >
          <Redo2 className="h-5 w-5" stroke="#059669" color="#059669" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteSelected}
          title={selectedCount > 0 ? `Delete ${selectedCount} selected` : 'No selection'}
          disabled={selectedCount === 0}
          className="h-10 w-10 rounded-full inline-flex items-center justify-center"
        >
          <Trash2 className="h-5 w-5" stroke="#dc2626" color="#dc2626" />
        </Button>
      </div>

      {/* Custom popover for measure dialog */}
      {measureOpen && (
        <div 
          className="absolute z-50 bg-white border rounded-lg shadow-lg p-4 w-80"
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
          }}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Dimensions</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMeasureOpen(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the selected shape
            </p>
            <div>
              <Label>Units</Label>
              <Select value={unit} onValueChange={handleUnitChange}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="in">inches</SelectItem>
                  <SelectItem value="ft">feet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Width ({unit})</Label>
                <Input 
                  type="number" 
                  step={unit === 'mm' ? 0.1 : (unit === 'in' ? 0.01 : 0.01)} 
                  value={wVal} 
                  onChange={(e) => setWVal(e.target.value)} 
                />
              </div>
              <div>
                <Label>Height ({unit})</Label>
                <Input 
                  type="number" 
                  step={unit === 'mm' ? 0.1 : (unit === 'in' ? 0.01 : 0.01)} 
                  value={hVal} 
                  onChange={(e) => setHVal(e.target.value)} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>X ({unit})</Label>
                <Input 
                  type="number" 
                  step={unit === 'mm' ? 0.1 : (unit === 'in' ? 0.01 : 0.01)} 
                  value={xVal} 
                  onChange={(e) => setXVal(e.target.value)} 
                />
              </div>
              <div>
                <Label>Y ({unit})</Label>
                <Input 
                  type="number" 
                  step={unit === 'mm' ? 0.1 : (unit === 'in' ? 0.01 : 0.01)} 
                  value={yVal} 
                  onChange={(e) => setYVal(e.target.value)} 
                />
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => {
                const updates: any = {};
                if (wVal !== '') updates.width = toPx(parseFloat(wVal));
                if (hVal !== '') updates.height = toPx(parseFloat(hVal));
                if (xVal !== '') updates.x = toPx(parseFloat(xVal));
                if (yVal !== '') updates.y = toPx(parseFloat(yVal));
                onUpdateSelectedDimensions(updates);
                setMeasureOpen(false);
              }}
              disabled={!selectedShape}
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {measureOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setMeasureOpen(false)}
        />
      )}
    </div>
  );
}