import React, { useRef, useState } from 'react';
import { Shape } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Download, FileCode, Info } from 'lucide-react';
import { parseSVG } from '../utils/svg';
import { generateGCode } from '../utils/gcode';

interface FileControlsProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onShapesChange: (shapes: Shape[]) => void;
}

export function FileControls({ shapes, selectedShapeId, onShapesChange }: FileControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [margin, setMargin] = useState(5);

  const handleOpenSVG = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const svgShapes = parseSVG(text);
    onShapesChange([...shapes, ...svgShapes]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateGCode = () => {
    const shapesToExport = selectedShapeId 
      ? shapes.filter(s => s.id === selectedShapeId)
      : shapes;
    
    const gcode = generateGCode(shapesToExport, margin);
    
    const blob = new Blob([gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.gcode';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(shapes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shapes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadInstructions = () => {
    const instructions = `# Canvas Editor - Setup Instructions

## Quick Start

This project is already running! To get the source code:

### Option 1: Using Git (Recommended)
If this project is in a Git repository, clone it:
\`\`\`bash
git clone <repository-url>
cd canvas-editor
npm install
npm run dev
\`\`\`

### Option 2: Manual Setup

1. Create a new Next.js project:
\`\`\`bash
npx create-next-app@latest canvas-editor --typescript --tailwind --app
cd canvas-editor
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install lucide-react jszip
npm install @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
\`\`\`

3. Copy the following files from the running application:
   - /App.tsx
   - /types.ts
   - /components/CanvasEditor.tsx
   - /components/Toolbar.tsx
   - /components/ShapeEditor.tsx
   - /components/FileControls.tsx
   - /utils/shapes.ts
   - /utils/svg.ts
   - /utils/gcode.ts
   - All Shadcn UI components from /components/ui/

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

## Features
- Draw shapes (free line, straight line, rectangle, circle, triangle, heart, star, pentagon, hexagon, arrow)
- Pan with middle mouse button
- Zoom with mouse wheel
- Open SVG files
- Select and edit shapes
- Generate G-code with margins
- Export project data

## Building for Production
\`\`\`bash
npm run build
npm start
\`\`\`

## G-code Generation
- Select shapes (or leave unselected for all)
- Set margin in millimeters
- Click "Generate G-code"
- Download output.gcode file

## Support
- Check browser console for errors
- Ensure JavaScript is enabled
- Use Chrome, Firefox, or Edge for best compatibility

For detailed instructions, see INSTRUCTIONS.md file.
`;

    const blob = new Blob([instructions], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SETUP_INSTRUCTIONS.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-gray-900">File Controls</h2>
      
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          onChange={handleOpenSVG}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Open SVG
        </Button>

        <Button
          onClick={handleExportJSON}
          variant="outline"
          className="w-full"
          disabled={shapes.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-3 text-gray-900">G-code Export</h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="margin">Margin (mm)</Label>
            <Input
              id="margin"
              type="number"
              min="0"
              step="0.1"
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
            />
          </div>

          <Button
            onClick={handleGenerateGCode}
            className="w-full"
            disabled={shapes.length === 0}
          >
            <FileCode className="mr-2 h-4 w-4" />
            Generate G-code
          </Button>

          {selectedShapeId && (
            <p className="text-gray-600">
              Note: Only selected shape will be exported
            </p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <Button
          onClick={handleDownloadInstructions}
          variant="secondary"
          className="w-full"
        >
          <Info className="mr-2 h-4 w-4" />
          Download Setup Guide
        </Button>
        <p className="mt-2 text-gray-600">
          Get instructions to set up this project
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-2 text-gray-900">Stats</h3>
        <p className="text-gray-600">Total shapes: {shapes.length}</p>
      </div>
    </div>
  );
}