import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Tool } from '../types';
import { Button } from './ui/button';
import { Pencil, Minus, Square, Circle, Triangle, Heart, Star, Pentagon, Hexagon, ArrowRight, Type } from 'lucide-react';

interface DrawingToolsProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  textFontFamily?: string;
  textFontStyle?: 'normal' | 'italic';
  onTextFontFamilyChange?: (family: string) => void;
  onTextFontStyleChange?: (style: 'normal' | 'italic') => void;
  onTextCreate?: (text: string, fontFamily: string, fontStyle: 'normal' | 'italic', fontWeight: 'normal' | 'bold', fontSize: number, x: number, y: number, fontUrl?: string) => void;
  currentUnit?: 'mm' | 'in' | 'ft'; // Add currentUnit prop
}

export interface DrawingToolsRef {
  openTextPopupAt: (x: number, y: number) => void;
}

const toolItems: { name: Tool; icon: React.ReactNode; tooltip: string }[] = [
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
  { name: 'type', icon: <Type className="h-5 w-5" stroke="#4b5563" color="#4b5563" />, tooltip: 'Text' },
];

export const DrawingTools = forwardRef<DrawingToolsRef, DrawingToolsProps>(({
  currentTool,
  onToolChange,
  textFontFamily: propFontFamily = 'Signatra', // Changed default to Signatra
  textFontStyle: propFontStyle = 'normal',
  onTextFontFamilyChange,
  onTextFontStyleChange,
  onTextCreate,
  currentUnit = 'mm' // Add currentUnit prop with default value
}: DrawingToolsProps, ref) => {
  const [textPopupOpen, setTextPopupOpen] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textX, setTextX] = useState(0);
  const [textY, setTextY] = useState(0);
  const [textFontSize, setTextFontSize] = useState(20); // Increased default size for better preview
  const [textFontWeight, setTextFontWeight] = useState<'normal' | 'bold'>('normal');
  // Add local state for fontFamily and fontStyle so we can modify them in the popup
  const [textFontFamily, setTextFontFamily] = useState(propFontFamily);
  const [textFontStyle, setTextFontStyle] = useState(propFontStyle);
  const [textFontUrl, setTextFontUrl] = useState('');
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const textButtonRef = useRef<HTMLButtonElement>(null);

  // Update local state when props change
  useEffect(() => {
    setTextFontFamily(propFontFamily);
  }, [propFontFamily]);

  useEffect(() => {
    setTextFontStyle(propFontStyle);
  }, [propFontStyle]);

  // Expose method to open text popup
  useImperativeHandle(ref, () => ({
    openTextPopupAt: (x: number, y: number) => {
      setTextX(x);
      setTextY(y);
      setTextValue('');
      setTextFontSize(20);
      setTextFontWeight('normal');
      setTextFontFamily(propFontFamily);
      setTextFontStyle(propFontStyle);
      setTextFontUrl('');
      setTextPopupOpen(true);
      onToolChange('type');
    }
  }));

  // Calculate popover position when text dialog opens
  useEffect(() => {
    if (textPopupOpen && textButtonRef.current) {
      const buttonRect = textButtonRef.current.getBoundingClientRect();
      const containerRect = textButtonRef.current.closest('.flex.flex-row')?.getBoundingClientRect();
      
      if (containerRect) {
        setPopoverPosition({
          top: buttonRect.bottom - containerRect.top + 5,
          left: buttonRect.left - containerRect.left
        });
      }
    }
  }, [textPopupOpen]);

  // Handle text creation
  const handleCreateText = () => {
    if (textValue.trim() && onTextCreate) {
      // Special handling for Signatra font - use local file
      if (textFontFamily === 'Signatra') {
        onTextCreate(textValue, textFontFamily, textFontStyle, textFontWeight, textFontSize, textX, textY, '/src/assets/Signatra.ttf');
      } else {
        onTextCreate(textValue, textFontFamily, textFontStyle, textFontWeight, textFontSize, textX, textY, textFontUrl);
      }
    }
    setTextPopupOpen(false);
    setTextValue('');
  };

  // Conversion factors for units
  const PX_PER_IN = 96;
  const PX_PER_MM = PX_PER_IN / 25.4;
  const PX_PER_FT = PX_PER_IN * 12;

  // Convert pixels to the selected unit
  const toUnit = (pixels: number): number => {
    switch (currentUnit) {
      case 'mm': return pixels / PX_PER_MM;
      case 'in': return pixels / PX_PER_IN;
      case 'ft': return pixels / PX_PER_FT;
      default: return pixels / PX_PER_MM;
    }
  };

  // Get unit abbreviation
  const getUnitAbbreviation = (): string => {
    switch (currentUnit) {
      case 'mm': return 'mm';
      case 'in': return 'in';
      case 'ft': return 'ft';
      default: return 'mm';
    }
  };

  // Measure text dimensions
  const measureTextDimensions = (): { width: number; height: number } => {
    if (!textValue) {
      return { width: 0, height: 0 };
    }

    // Create a temporary canvas to measure text
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return { width: 0, height: 0 };

    const fontFamily = textFontFamily === 'Signatra' ? 'Signatra' : textFontFamily;
    const fontStyle = textFontStyle;
    const fontWeight = textFontWeight;
    
    // Set font properties for measurement
    tempCtx.font = `${fontStyle} ${fontWeight} ${textFontSize}px "${fontFamily}"`;
    const metrics = tempCtx.measureText(textValue);
    
    return {
      width: metrics.width,
      height: textFontSize,
    };
  };

  // Get text dimensions in the selected unit
  const getTextDimensionsInUnit = () => {
    const dimensions = measureTextDimensions();
    return {
      width: toUnit(dimensions.width),
      height: toUnit(dimensions.height),
    };
  };

  // Get text position in the selected unit
  const getTextPositionInUnit = () => {
    return {
      x: toUnit(textX),
      y: toUnit(textY),
    };
  };

  return (
    <div className="w-full">
      <div className="flex-wrap items-center gap-1.5 rounded-full bg-gray-50 border px-2 py-1 shadow-sm min-w-0">
        {toolItems.map(tool => (
          <Button
            key={tool.name}
            variant="ghost"
            size="icon"
            onClick={() => {
              onToolChange(tool.name);
              // Open popup when text tool is clicked
              if (tool.name === 'type') {
                setTextPopupOpen(true);
              }
            }}
            title={tool.tooltip}
            className={`${currentTool === tool.name ? 'bg-blue-500 text-white ring-2 ring-blue-500 scale-110' : ''} h-10 w-10 rounded-full inline-flex items-center justify-center transition-all duration-200 ease-in-out`}
            ref={tool.name === 'type' ? textButtonRef : undefined}
          >
            {tool.icon}
          </Button>
        ))}
        {currentTool === 'type' && !textPopupOpen && (
          <div className="ml-2 inline-flex flex-wrap items-center gap-2">
            <div className="min-w-[140px]">
              <select 
                value={textFontFamily} 
                onChange={(e) => {
                  setTextFontFamily(e.target.value);
                  if (onTextFontFamilyChange) {
                    onTextFontFamilyChange(e.target.value);
                  }
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="Signatra">Signatra</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Custom popover for text dialog */}
      {textPopupOpen && (
        <div 
          className="absolute z-50 bg-white border rounded-lg shadow-lg p-4"
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
            width: '600px', // Increased width to accommodate side-by-side layout
          }}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Add Text</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setTextPopupOpen(false)}
                className="h-6 w-6 p-0 text-gray-900"
              >
                ×
              </Button>
            </div>
            <p className="text-sm text-gray-700">
              Enter text and configure font settings
            </p>
            
            {/* Main content area with form on left and preview on right */}
            <div className="flex gap-4">
              {/* Form controls on the left */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Text Content</label>
                  <input 
                    type="text" 
                    value={textValue} 
                    onChange={(e) => setTextValue(e.target.value)} 
                    placeholder="Enter text"
                    className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Position X</label>
                    <input 
                      type="number" 
                      value={Math.round(textX)} 
                      onChange={(e) => setTextX(Number(e.target.value))} 
                      className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Position Y</label>
                    <input 
                      type="number" 
                      value={Math.round(textY)} 
                      onChange={(e) => setTextY(Number(e.target.value))} 
                      className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Font Family</label>
                    <select 
                      value={textFontFamily} 
                      onChange={(e) => setTextFontFamily(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                    >
                      <option value="Signatra">Signatra</option>
                      <option value="Arial">Arial</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Font Size</label>
                    <input 
                      type="number" 
                      value={textFontSize} 
                      onChange={(e) => setTextFontSize(Number(e.target.value))} 
                      min="8"
                      max="100"
                      className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Font Style</label>
                    <select 
                      value={textFontStyle} 
                      onChange={(e) => setTextFontStyle(e.target.value as 'normal' | 'italic')}
                      className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Font Weight</label>
                    <select 
                      value={textFontWeight} 
                      onChange={(e) => setTextFontWeight(e.target.value as 'normal' | 'bold')}
                      className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Font URL (Optional)</label>
                  <input 
                    type="text" 
                    value={textFontUrl} 
                    onChange={(e) => setTextFontUrl(e.target.value)} 
                    placeholder="https://example.com/font.woff"
                    className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Enter URL to external font file (WOFF, WOFF2, TTF)
                  </p>
                </div>
                <Button
                  variant="default"
                  onClick={handleCreateText}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Text to Canvas
                </Button>
              </div>
              
              {/* Font Preview on the right */}
              <div className="w-1/3 flex flex-col">
                <div className="text-xs font-medium text-gray-500 mb-1">Font Preview</div>
                <div className="relative flex-1 border rounded p-3 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <div 
                    className="relative"
                    style={{
                      fontFamily: textFontFamily === 'Signatra' ? 'Signatra, sans-serif' : `"${textFontFamily}", sans-serif`,
                      fontSize: `${textFontSize}px`,
                      fontStyle: textFontStyle,
                      fontWeight: textFontWeight,
                      color: '#000000' // Dark color as per specification
                    }}
                  >
                    {textValue || 'Preview Text'}
                  </div>
                </div>
                {/* Add position and font size information */}
                <div className="mt-2 text-xs text-gray-600">
                  <div>Preview Height: {toUnit(textFontSize).toFixed(currentUnit === 'mm' ? 1 : 2)}{getUnitAbbreviation()}</div>
                  <div>Preview Width: {getTextDimensionsInUnit().width.toFixed(currentUnit === 'mm' ? 1 : 2)}{getUnitAbbreviation()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {textPopupOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setTextPopupOpen(false)}
        />
      )}
    </div>
  );
});