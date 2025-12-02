import React, { useMemo, useState } from 'react';
import { Tool } from '../types';
import { MousePointer2, Trash2, Undo2, Redo2, Ruler, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';

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
}

export function SelectionTools({ currentTool, onToolChange, onToggleSelect, onDeleteSelected, selectedCount, onUndo, onRedo, canUndo, canRedo, selectedShape, onUpdateSelectedDimensions, onClearSelection }: SelectionToolsProps) {
  const [measureOpen, setMeasureOpen] = useState(false);
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
    <div className="w-full">
      <div className="flex flex-row flex-wrap items-center gap-1.5 rounded-full bg-gray-50 border px-2 py-1 shadow-sm">
              <Button
                variant={currentTool === 'select' ? 'default' : 'ghost'}
                size="icon"
                onClick={onToggleSelect}
                title="Select"
                className={`${currentTool === 'select' ? 'ring-2 ring-blue-500' : ''} h-10 w-10 rounded-full`}
              >
                <MousePointer2 className="h-5 w-5" stroke="#2563eb" color="#2563eb" />
              </Button>
              <Popover open={measureOpen} onOpenChange={setMeasureOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Measure"
                    className="h-10 w-10 rounded-full"
                  >
                    <Ruler className="h-5 w-5" stroke="#334155" color="#334155" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="w-80">
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
                        setMeasureOpen(false);
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
                onClick={onClearSelection}
                title="Unselect All"
                className="h-10 w-10 rounded-full"
              >
                <XCircle className="h-5 w-5" stroke="#64748b" color="#64748b" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo"
                className="h-10 w-10 rounded-full"
              >
                <Undo2 className="h-5 w-5" stroke="#d97706" color="#d97706" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo"
                className="h-10 w-10 rounded-full"
              >
                <Redo2 className="h-5 w-5" stroke="#059669" color="#059669" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDeleteSelected}
                title={selectedCount > 0 ? `Delete ${selectedCount} selected` : 'No selection'}
                disabled={selectedCount === 0}
                className="h-10 w-10 rounded-full"
              >
                <Trash2 className="h-5 w-5" stroke="#dc2626" color="#dc2626" />
              </Button>
      </div>
      
    </div>
  );
}
