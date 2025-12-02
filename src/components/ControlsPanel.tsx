import React, { useState, useRef, useEffect } from 'react';
import { Tool, Shape } from '../types';
import { Button } from './ui/button';
import { MousePointer2, Pencil, Minus, Square, Circle as CircleIcon, Triangle, Heart, Star, Pentagon, Hexagon, ArrowRight } from 'lucide-react';
import { SelectionTools } from './SelectionTools';
import { DrawingTools, DrawingToolsRef } from './DrawingTools';

type ControlsMenu = 'tools' | 'basic';

interface ControlsPanelProps {
  controlsVisible: boolean;
  activeMenu: 'tools' | 'basic';
  setActiveMenu: (menu: 'tools' | 'basic') => void;
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onToggleSelect: () => void;
  onDeleteSelected: () => void;
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedShape?: Shape;
  onUpdateSelectedDimensions: (updates: Partial<Shape>) => void;
  onClearSelection: () => void;
  onSimulate: () => void;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  onUnitChange: (unit: 'mm' | 'in' | 'ft') => void;
}

function getToolIcon(tool: Tool) {
  switch (tool) {
    case 'select':
      return <MousePointer2 className="h-4 w-4" stroke="#2563eb" color="#2563eb" />;
    case 'freeLine':
      return <Pencil className="h-4 w-4" stroke="#0284c7" color="#0284c7" />;
    case 'straightLine':
      return <Minus className="h-4 w-4" stroke="#4f46e5" color="#4f46e5" />;
    case 'rectangle':
      return <Square className="h-4 w-4" stroke="#059669" color="#059669" />;
    case 'circle':
      return <CircleIcon className="h-4 w-4" stroke="#0891b2" color="#0891b2" />;
    case 'triangle':
      return <Triangle className="h-4 w-4" stroke="#ca8a04" color="#ca8a04" />;
    case 'heart':
      return <Heart className="h-4 w-4" stroke="#db2777" color="#db2777" />;
    case 'star':
      return <Star className="h-4 w-4" stroke="#d97706" color="#d97706" />;
    case 'pentagon':
      return <Pentagon className="h-4 w-4" stroke="#9333ea" color="#9333ea" />;
    case 'hexagon':
      return <Hexagon className="h-4 w-4" stroke="#7c3aed" color="#7c3aed" />;
    case 'arrow':
      return <ArrowRight className="h-4 w-4" stroke="#475569" color="#475569" />;
    default:
      return null;
  }
}

export function ControlsPanel({
  controlsVisible,
  activeMenu,
  setActiveMenu,
  currentTool,
  onToolChange,
  onToggleSelect,
  onDeleteSelected,
  selectedCount,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedShape,
  onUpdateSelectedDimensions,
  onClearSelection,
  onSimulate,
  shapes,
  onShapesChange,
  onUnitChange,
}: ControlsPanelProps) {

  return (
    <div className={`sticky top-0 z-20 bg-white/95 backdrop-blur border-b px-2 py-2 ${controlsVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {controlsVisible && (
        <div id="controls-panel">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={activeMenu === 'tools'}
                className={`rounded-full border px-3 py-1 text-xs font-medium cursor-pointer flex items-center gap-1.5 bg-gray-100 text-gray-700 ${activeMenu === 'tools' ? 'border-blue-500' : 'border-gray-300'}`}
                onClick={() => { 
                  setActiveMenu('tools'); 
                  onToolChange('select'); // Change tool to select when main select tool is clicked
                }}
              >
                <MousePointer2 className="h-4 w-4 ml-1 rounded-full" stroke="#2563eb" color="#2563eb" />
              </button>
              <button
                type="button"
                aria-pressed={activeMenu === 'basic'}
                className={`rounded-full border px-3 py-1 text-xs font-medium cursor-pointer flex items-center gap-1.5 bg-gray-100 text-gray-700 ${activeMenu === 'basic' ? 'border-blue-500' : 'border-gray-300'}`}
                onClick={() => { 
                  setActiveMenu('basic'); 
                  onToolChange('rectangle'); // Change tool to rectangle when basic shapes menu is clicked
                }}
              >
                <Square className="h-4 w-4 ml-1 rounded-full" stroke="#059669" color="#059669" />
              </button>
              <Button
                className="ml-auto"
                size="sm"
                variant="default"
                onClick={() => onSimulate && onSimulate()}
                title="Simulate"
              >
                Simulate
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 w-full">
              {activeMenu === 'tools' ? (
                <SelectionTools
                  currentTool={currentTool}
                  onToolChange={onToolChange}
                  onToggleSelect={onToggleSelect}
                  onDeleteSelected={onDeleteSelected}
                  selectedCount={selectedCount}
                  onUndo={onUndo}
                  onRedo={onRedo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  selectedShape={selectedShape}
                  onUpdateSelectedDimensions={onUpdateSelectedDimensions}
                  onClearSelection={onClearSelection}
                  shapes={shapes}
                  onShapesChange={onShapesChange}
                  onUnitChange={onUnitChange} // Pass onUnitChange to SelectionTools
                />
              ) : (
                <DrawingTools
                  currentTool={currentTool}
                  onToolChange={onToolChange}
                />
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}