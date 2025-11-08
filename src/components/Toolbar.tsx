import React, { useState } from 'react';
import { Tool } from '../types';
import { 
  MousePointer2, 
  Pencil, 
  Minus, 
  Square, 
  Circle, 
  Triangle, 
  Heart, 
  Star,
  Pentagon,
  Hexagon,
  ArrowRight,
  Type
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
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
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools: { name: Tool; icon: React.ReactNode; tooltip: string }[] = [
    { name: 'select', icon: <MousePointer2 className="h-5 w-5" />, tooltip: 'Select' },
    { name: 'freeLine', icon: <Pencil className="h-5 w-5" />, tooltip: 'Free Line' },
    { name: 'straightLine', icon: <Minus className="h-5 w-5" />, tooltip: 'Straight Line' },
    { name: 'rectangle', icon: <Square className="h-5 w-5" />, tooltip: 'Rectangle' },
    { name: 'circle', icon: <Circle className="h-5 w-5" />, tooltip: 'Circle' },
    { name: 'triangle', icon: <Triangle className="h-5 w-5" />, tooltip: 'Triangle' },
    { name: 'heart', icon: <Heart className="h-5 w-5" />, tooltip: 'Heart' },
    { name: 'star', icon: <Star className="h-5 w-5" />, tooltip: 'Star' },
    { name: 'pentagon', icon: <Pentagon className="h-5 w-5" />, tooltip: 'Pentagon' },
    { name: 'hexagon', icon: <Hexagon className="h-5 w-5" />, tooltip: 'Hexagon' },
    { name: 'arrow', icon: <ArrowRight className="h-5 w-5" />, tooltip: 'Arrow' },
    { name: 'type', icon: <Type className="h-5 w-5" />, tooltip: 'Type' },
  ];

  return (
    <div className="flex flex-col items-center gap-1 p-1">
      {tools.map(tool => (
        <Button
          key={tool.name}
          variant={currentTool === tool.name ? 'default' : 'ghost'}
          size="icon"
          onClick={() => onToolChange(tool.name)}
          title={tool.tooltip}
          className="h-12 w-12"
        >
          {tool.icon}
        </Button>
      ))}

      <div className="my-2 h-px w-full bg-gray-200" />

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
