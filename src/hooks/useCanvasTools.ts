import { useState } from 'react';
import { Tool } from '../types';

export function useCanvasTools() {
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [lastNonSelectTool, setLastNonSelectTool] = useState<Tool | null>(null);

  const handleToolChange = (tool: Tool) => {
    if (tool !== 'select') setLastNonSelectTool(tool);
    setCurrentTool(tool);
  };

  const handleToggleSelectTool = () => {
    if (currentTool === 'select' && lastNonSelectTool) {
      setCurrentTool(lastNonSelectTool);
    } else {
      setCurrentTool('select');
    }
  };

  return { currentTool, handleToolChange, handleToggleSelectTool };
}

