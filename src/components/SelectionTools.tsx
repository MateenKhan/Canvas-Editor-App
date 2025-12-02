import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Tool, Shape } from '../types';
import { MousePointer2, Trash2, Undo2, Redo2, Ruler, X, RotateCcw, RotateCw, ChevronDown, Pencil, Minus, Square, Circle, Triangle, Heart, Star, Pentagon, Hexagon, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
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
  selectedShape?: Shape; // Changed type to Shape instead of partial object
  onUpdateSelectedDimensions: (updates: Partial<Shape>) => void;
  onClearSelection: () => void;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  onUnitChange: (unit: 'mm' | 'in' | 'ft') => void; // Add onUnitChange prop
}

const toolItems: { name: Tool; icon: React.ReactNode; tooltip: string }[] = [
  { name: 'select', icon: <MousePointer2 className="h-5 w-5" stroke="#2563eb" color="#2563eb" />, tooltip: 'Select' },
  { name: 'freeLine', icon: <Pencil className="h-5 w-5" stroke="#0284c7" color="#0284c7" />, tooltip: 'Free Line' },
  { name: 'straightLine', icon: <Minus className="h-5 w-5" stroke="#4f46e5" color="#4f46e5" />, tooltip: 'Straight Line' },
  { name: 'rectangle', icon: <Square className="h-5 w-5" stroke="#059669" color="#059669" />, tooltip: 'Rectangle' },
  { name: 'circle', icon: <Circle className="h-5 w-5" stroke="#0891b2" color="#0891b2" />, tooltip: 'Circle' },
  { name: 'triangle', icon: <Triangle className="h-5 w-5" stroke="#ca8a04" color="#ca8a04" />, tooltip: 'Triangle' },
  { name: 'heart', icon: <Heart className="h-5 w-5" stroke="#db2777" color="#db2777" />, tooltip: 'Heart' },
  { name: 'star', icon: <Star className="h-5 w-5" stroke="#d97706" color="#d97706" />, tooltip: 'Star' },
  { name: 'pentagon', icon: <Pentagon className="h-5 w-5" stroke="#9333ea" color="#9333ea" />, tooltip: 'Pentagon' },
  { name: 'hexagon', icon: <Hexagon className="h-5 w-5" stroke="#7c3aed" color="#7c3aed" />, tooltip: 'Hexagon' },
  { name: 'arrow', icon: <ArrowRight className="h-5 w-5" stroke="#475569" color="#475569" />, tooltip: 'Arrow' },
];

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
      if (shape.type === 'freeLine') {
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
    <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-gray-50 border px-2 py-1 shadow-sm min-w-0">
      {toolItems.map(tool => (
        <Button
          key={tool.name}
          variant="ghost"
          size="icon"
          onClick={() => onToolChange(tool.name)}
          title={tool.tooltip}
          className={`${currentTool === tool.name ? 'bg-blue-500 text-white ring-2 ring-blue-500 scale-110' : ''} h-10 w-10 rounded-full inline-flex items-center justify-center transition-all duration-200 ease-in-out`}
        >
          {tool.icon}
        </Button>
      ))}

      {currentTool === 'select' && (
        <div className="ml-2 inline-flex flex-wrap items-center gap-2">
          <Button
            variant={selectedCount > 0 ? "default" : "secondary"}
            size="sm"
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
            className="h-8 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClearSelection}
            disabled={selectedCount === 0}
            className="h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-8 px-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-8 px-2"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedShape && currentTool === 'select' && (
        <div className="ml-2 inline-flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 border">
            <span>{selectedShape.type.replace(/([A-Z])/g, ' $1').trim()}</span>
            {selectedShape.type === 'freeLine' && selectedShape.points && (
              <span className="text-gray-500">({selectedShape.points.length} pts)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );

}
