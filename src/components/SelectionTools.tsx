import React, { useMemo, useState } from 'react';
import { Tool } from '../types';
import { MousePointer2, Trash2, Undo2, Redo2, Ruler } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';

interface SelectionToolsProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedShape?: { id: string; x?: number; y?: number; width?: number; height?: number } | undefined;
  onUpdateSelectedDimensions: (updates: Partial<{ x: number; y: number; width: number; height: number }>) => void;
}

export function SelectionTools({ currentTool, onToolChange, onDeleteSelected, selectedCount, onUndo, onRedo, canUndo, canRedo, selectedShape, onUpdateSelectedDimensions }: SelectionToolsProps) {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const PX_PER_IN = 96;
  const PX_PER_MM = PX_PER_IN / 25.4;
  const pxPerUnit = useMemo(() => (unit === 'mm' ? PX_PER_MM : PX_PER_IN), [unit]);
  const toUnit = (px?: number) => (px ?? 0) / pxPerUnit;
  const toPx = (val: number) => val * pxPerUnit;
  const [wVal, setWVal] = useState<string>('');
  const [hVal, setHVal] = useState<string>('');
  const [xVal, setXVal] = useState<string>('');
  const [yVal, setYVal] = useState<string>('');

  React.useEffect(() => {
    if (selectedShape) {
      setWVal(selectedShape.width !== undefined ? toUnit(selectedShape.width).toFixed(2) : '');
      setHVal(selectedShape.height !== undefined ? toUnit(selectedShape.height).toFixed(2) : '');
      setXVal(selectedShape.x !== undefined ? toUnit(selectedShape.x).toFixed(2) : '');
      setYVal(selectedShape.y !== undefined ? toUnit(selectedShape.y).toFixed(2) : '');
    } else {
      setWVal('');
      setHVal('');
      setXVal('');
      setYVal('');
    }
  }, [selectedShape, pxPerUnit]);
  return (
    <div className="flex flex-col items-center space-y-1.5">
      <Button
        variant={currentTool === 'select' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onToolChange('select')}
        title="Select"
        className="h-12 w-12"
      >
        <MousePointer2 className="h-5 w-5" stroke="#2563eb" color="#2563eb" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Dimensions"
            className="h-12 w-12"
          >
            <Ruler className="h-5 w-5" stroke="#334155" color="#334155" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60" side="right">
          <div className="space-y-3">
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Width ({unit})</Label>
                <Input type="number" step={unit === 'mm' ? 0.1 : 0.01} value={wVal} onChange={(e) => setWVal(e.target.value)} />
              </div>
              <div>
                <Label>Height ({unit})</Label>
                <Input type="number" step={unit === 'mm' ? 0.1 : 0.01} value={hVal} onChange={(e) => setHVal(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>X ({unit})</Label>
                <Input type="number" step={unit === 'mm' ? 0.1 : 0.01} value={xVal} onChange={(e) => setXVal(e.target.value)} />
              </div>
              <div>
                <Label>Y ({unit})</Label>
                <Input type="number" step={unit === 'mm' ? 0.1 : 0.01} value={yVal} onChange={(e) => setYVal(e.target.value)} />
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => {
                const updates: any = {};
                if (wVal !== '') updates.width = toPx(Number(wVal));
                if (hVal !== '') updates.height = toPx(Number(hVal));
                if (xVal !== '') updates.x = toPx(Number(xVal));
                if (yVal !== '') updates.y = toPx(Number(yVal));
                onUpdateSelectedDimensions(updates);
                setOpen(false);
              }}
              disabled={!selectedShape}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        className="h-12 w-12"
      >
        <Undo2 className="h-5 w-5" stroke="#d97706" color="#d97706" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
        className="h-12 w-12"
      >
        <Redo2 className="h-5 w-5" stroke="#059669" color="#059669" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onDeleteSelected}
        title={selectedCount > 0 ? `Delete ${selectedCount} selected` : 'No selection'}
        disabled={selectedCount === 0}
        className="h-12 w-12"
      >
        <Trash2 className="h-5 w-5" stroke="#dc2626" color="#dc2626" />
      </Button>
    </div>
  );
}
