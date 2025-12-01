import React from 'react';
import { Tool } from '../types';
import { MousePointer2, Trash2, Undo2, Redo2 } from 'lucide-react';
import { Button } from './ui/button';

interface SelectionToolsProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function SelectionTools({ currentTool, onToolChange, onDeleteSelected, selectedCount, onUndo, onRedo, canUndo, canRedo }: SelectionToolsProps) {
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
