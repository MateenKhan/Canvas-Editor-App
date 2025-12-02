import React, { useState, useMemo } from 'react';
import { Shape } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  const PX_PER_IN = 96;
  const PX_PER_MM = PX_PER_IN / 25.4;
  const pxPerUnit = useMemo(() => (unit === 'mm' ? PX_PER_MM : PX_PER_IN), [unit]);
  const toUnit = (px?: number) => (px ?? 0) / pxPerUnit;
  const toPx = (val: number) => val * pxPerUnit;
  return (
    <div className="mt-6 space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Edit Shape</h3>
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
          title="Delete Shape"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Units</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as 'mm' | 'in')}>
              <SelectTrigger size="sm">
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
            <Input
              id="stroke-color-editor"
              type="color"
              value={shape.strokeColor}
              onChange={(e) => onUpdate(shape.id, { strokeColor: e.target.value })}
              className="h-10 w-20"
            />
            <Input
              type="text"
              value={shape.strokeColor}
              onChange={(e) => onUpdate(shape.id, { strokeColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fill-color-editor">Fill Color</Label>
          <div className="flex gap-2">
            <Input
              id="fill-color-editor"
              type="color"
              value={shape.fillColor === 'transparent' ? '#ffffff' : shape.fillColor}
              onChange={(e) => onUpdate(shape.id, { fillColor: e.target.value })}
              className="h-10 w-20"
            />
            <Input
              type="text"
              value={shape.fillColor}
              onChange={(e) => onUpdate(shape.id, { fillColor: e.target.value })}
              className="flex-1"
              placeholder="transparent"
            />
          </div>
        </div>

        {shape.type === 'type' && (
          <div className="space-y-2">
            <Label htmlFor="text-content-editor">Text</Label>
            <Input
              id="text-content-editor"
              type="text"
              value={shape.text ?? ''}
              onChange={(e) => onUpdate(shape.id, { text: e.target.value })}
              className="flex-1"
              placeholder="Enter text"
            />
            <Label htmlFor="font-size-editor">Font Size (px)</Label>
            <Input
              id="font-size-editor"
              type="number"
              min="8"
              max="200"
              value={shape.fontSize ?? 20}
              onChange={(e) => onUpdate(shape.id, { fontSize: Number(e.target.value) })}
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Font Family</Label>
                <Select value={shape.fontFamily ?? 'Arial'} onValueChange={(v) => onUpdate(shape.id, { fontFamily: v })}>
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
              <div>
                <Label>Font Style</Label>
                <Select value={shape.fontStyle ?? 'normal'} onValueChange={(v) => onUpdate(shape.id, { fontStyle: v as any })}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font Weight</Label>
                <Select value={shape.fontWeight ?? 'normal'} onValueChange={(v) => onUpdate(shape.id, { fontWeight: v as any })}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="stroke-width-editor">
            Stroke Width: {shape.strokeWidth}px
          </Label>
          <Input
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
              <Input
                id="x-pos"
                type="number"
                step={unit === 'mm' ? 0.1 : 0.01}
                value={Number(toUnit(shape.x).toFixed(2))}
                onChange={(e) => onUpdate(shape.id, { x: toPx(Number(e.target.value)) })}
              />
            </div>
            <div>
              <Label htmlFor="y-pos">Y Position ({unit})</Label>
              <Input
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
              <Input
                id="width"
                type="number"
                step={unit === 'mm' ? 0.1 : 0.01}
                value={Number(toUnit(shape.width).toFixed(2))}
                onChange={(e) => onUpdate(shape.id, { width: toPx(Number(e.target.value)) })}
              />
            </div>
            <div>
              <Label htmlFor="height">Height ({unit})</Label>
              <Input
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
