import React, { useState, useMemo } from 'react';
import { Shape } from '../types';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Trash2 } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';

interface ShapeEditorProps {
  shape: Shape;
  onUpdate: (id: string, updates: Partial<Shape>) => void;
  onDelete: () => void;
}

export function ShapeEditor({ shape, onUpdate, onDelete }: ShapeEditorProps) {
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');

  // Convert pixels to the selected unit
  const toUnit = (pixels: number): number => {
    const PX_PER_IN = 96;
    const PX_PER_MM = PX_PER_IN / 25.4;
    
    switch (unit) {
      case 'mm':
        return pixels / PX_PER_MM;
      case 'in':
        return pixels / PX_PER_IN;
      default:
        return pixels / PX_PER_MM;
    }
  };

  // Convert the selected unit to pixels
  const toPx = (unitValue: number): number => {
    const PX_PER_IN = 96;
    const PX_PER_MM = PX_PER_IN / 25.4;
    
    switch (unit) {
      case 'mm':
        return unitValue * PX_PER_MM;
      case 'in':
        return unitValue * PX_PER_IN;
      default:
        return unitValue * PX_PER_MM;
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Shape</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete()}
          className="text-red-600 hover:text-red-800 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="unit-select">Units:</Label>
            <Select value={unit} onValueChange={(v: string) => setUnit(v as 'mm' | 'in')}>
              <SelectTrigger size="sm" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">mm</SelectItem>
                <SelectItem value="in">inches</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-gray-700">Type</Label>
          <p className="text-gray-900 capitalize">{shape.type.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stroke-color-editor">Stroke Color</Label>
          <div className="flex gap-2">
            <input
              id="stroke-color-editor"
              type="color"
              value={shape.strokeColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(shape.id, { strokeColor: e.target.value })}
              className="h-10 w-20"
            />
            <input
              type="text"
              value={shape.strokeColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(shape.id, { strokeColor: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fill-color-editor">Fill Color</Label>
          <div className="flex gap-2">
            <input
              id="fill-color-editor"
              type="color"
              value={shape.fillColor === 'transparent' ? '#ffffff' : shape.fillColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(shape.id, { fillColor: e.target.value })}
              className="h-10 w-20"
            />
            <input
              type="text"
              value={shape.fillColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(shape.id, { fillColor: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
              placeholder="transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stroke-width-editor">
            Stroke Width: {shape.strokeWidth}px
          </Label>
          <input
            id="stroke-width-editor"
            type="range"
            min="1"
            max="20"
            value={shape.strokeWidth}
            onChange={(e) => onUpdate(shape.id, { strokeWidth: Number(e.target.value) })}
          />
        </div>

        {shape.x !== undefined && shape.y !== undefined && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x-pos">X Position ({unit})</Label>
              <input
                id="x-pos"
                type="number"
                step={unit === 'mm' ? 0.1 : 0.01}
                value={Number(toUnit(shape.x).toFixed(2))}
                onChange={(e) => onUpdate(shape.id, { x: toPx(Number(e.target.value)) })}
              />
            </div>
            <div>
              <Label htmlFor="y-pos">Y Position ({unit})</Label>
              <input
                id="y-pos"
                type="number"
                step={unit === 'mm' ? 0.1 : 0.01}
                value={Number(toUnit(shape.y).toFixed(2))}
                onChange={(e) => onUpdate(shape.id, { y: toPx(Number(e.target.value)) })}
              />
            </div>
          </div>
        )}

        {shape.width !== undefined && shape.height !== undefined && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width">Width ({unit})</Label>
              <input
                id="width"
                type="number"
                step={unit === 'mm' ? 0.1 : 0.01}
                value={Number(toUnit(shape.width).toFixed(2))}
                onChange={(e) => onUpdate(shape.id, { width: toPx(Number(e.target.value)) })}
              />
            </div>
            <div>
              <Label htmlFor="height">Height ({unit})</Label>
              <input
                id="height"
                type="number"
                step={unit === 'mm' ? 0.1 : 0.01}
                value={Number(toUnit(shape.height).toFixed(2))}
                onChange={(e) => onUpdate(shape.id, { height: toPx(Number(e.target.value)) })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
