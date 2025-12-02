import React, { useState } from 'react';
import { Tool, Shape } from '../types';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { SelectionTools } from './SelectionTools';
import { DrawingTools } from './DrawingTools';

interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedShape?: Shape;
  onUpdateSelectedDimensions: (updates: Partial<Shape>) => void;
}

export function Toolbar({
  currentTool,
  onToolChange,
  strokeColor,
  fillColor,
  strokeWidth,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
  onDeleteSelected,
  selectedCount,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedShape,
  onUpdateSelectedDimensions,
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="flex flex-col items-center gap-1 p-1">
      <SelectionTools
        currentTool={currentTool}
        onToolChange={onToolChange}
        onDeleteSelected={onDeleteSelected}
        selectedCount={selectedCount}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedShape={selectedShape}
        onUpdateSelectedDimensions={onUpdateSelectedDimensions}
      />

      <div className="my-2 h-px w-full bg-gray-200" />
      <DrawingTools currentTool={currentTool} onToolChange={onToolChange} />

      {/* <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            title="Colors & Stroke"
          >
            <div className="flex h-8 w-8 flex-col gap-0.5 overflow-hidden rounded border">
              <div 
                className="h-1/2 w-full" 
                style={{ backgroundColor: strokeColor }}
              />
              <div 
                className="h-1/2 w-full" 
                style={{ backgroundColor: fillColor === 'transparent' ? '#fff' : fillColor }}
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" side="right">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stroke-color">Stroke Color</Label>
              <div className="flex gap-2">
                <Input
                  id="stroke-color"
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fill-color">Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  id="fill-color"
                  type="color"
                  value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                  onChange={(e) => onFillColorChange(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={fillColor}
                  onChange={(e) => onFillColorChange(e.target.value)}
                  className="flex-1"
                  placeholder="transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stroke-width">Stroke Width: {strokeWidth}px</Label>
              <Input
                id="stroke-width"
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover> */}
    </div>
  );
}
