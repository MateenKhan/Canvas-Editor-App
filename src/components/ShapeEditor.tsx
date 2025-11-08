import React from 'react';
import { Shape } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2 } from 'lucide-react';

interface ShapeEditorProps {
  shape: Shape;
  onUpdate: (id: string, updates: Partial<Shape>) => void;
  onDelete: () => void;
}

export function ShapeEditor({ shape, onUpdate, onDelete }: ShapeEditorProps) {
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
              <Label htmlFor="x-pos">X Position</Label>
              <Input
                id="x-pos"
                type="number"
                value={Math.round(shape.x)}
                onChange={(e) => onUpdate(shape.id, { x: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="y-pos">Y Position</Label>
              <Input
                id="y-pos"
                type="number"
                value={Math.round(shape.y)}
                onChange={(e) => onUpdate(shape.id, { y: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {shape.width !== undefined && shape.height !== undefined && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={Math.round(shape.width)}
                onChange={(e) => onUpdate(shape.id, { width: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={Math.round(shape.height)}
                onChange={(e) => onUpdate(shape.id, { height: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
