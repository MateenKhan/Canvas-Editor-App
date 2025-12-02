import React from 'react';
import { Tool } from '../types';
import { Button } from './ui/button';
import { Pencil, Minus, Square, Circle, Triangle, Heart, Star, Pentagon, Hexagon, ArrowRight, Type } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';

interface DrawingToolsProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  textFontFamily?: string;
  textFontStyle?: 'normal' | 'italic';
  onTextFontFamilyChange?: (family: string) => void;
  onTextFontStyleChange?: (style: 'normal' | 'italic') => void;
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
  { name: 'type', icon: <Type className="h-5 w-5" stroke="#4b5563" color="#4b5563" />, tooltip: 'Type' },
];

export function DrawingTools({ currentTool, onToolChange, textFontFamily = 'Arial', textFontStyle = 'normal', onTextFontFamilyChange, onTextFontStyleChange }: DrawingToolsProps) {
  return (
    <div className="w-full">
      <div className="flex-wrap items-center gap-1.5 rounded-full bg-gray-50 border px-2 py-1 shadow-sm min-w-0">
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
        {currentTool === 'type' && (
          <div className="ml-2 inline-flex flex-wrap items-center gap-2">
            <div className="min-w-[140px]">
              <Select value={textFontFamily} onValueChange={(v: string) => onTextFontFamilyChange && onTextFontFamilyChange(v)}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[120px]">
              <Select value={textFontStyle} onValueChange={(v: string) => onTextFontStyleChange && onTextFontStyleChange(v as 'normal' | 'italic')}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
