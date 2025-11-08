# Canvas Editor with G-code Generator - Complete Instructions

## Overview
A feature-rich canvas editor built with Next.js that allows you to draw shapes, import SVG files, and generate G-code for CNC machines and laser cutters.

## Features
- ✏️ Draw multiple shapes: free line, straight line, rectangle, circle, triangle, heart, star, pentagon, hexagon, and arrow
- 🔍 Pan and zoom canvas using middle mouse button and mouse wheel
- 📂 Open and import SVG files
- 🎯 Select and edit shapes (position, size, colors, stroke width)
- ⚙️ Generate G-code with customizable margins in millimeters
- 📦 Export project data as JSON
- 🗑️ Delete individual shapes
- 📊 Grid background for precise drawing
- 💾 Download complete project source code as ZIP

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

   This will install all required packages:
   - React & Next.js
   - Tailwind CSS v4
   - Lucide React (icons)
   - Shadcn UI components
   - JSZip (for project export)

2. **Verify Installation**
   ```bash
   npm list
   ```

## Running the Application

### Development Mode
Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

### Production Build
Build the optimized production version:

```bash
npm run build
```

### Start Production Server
After building, start the production server:

```bash
npm start
```

## Usage Guide

### 1. Drawing Shapes

**Step-by-step:**
1. Select a shape tool from the left toolbar (Select, Free Line, Straight Line, Rectangle, Circle, Triangle, Heart, Star, Pentagon, Hexagon, or Arrow)
2. Click the color/stroke button (checkerboard icon) to customize:
   - Stroke Color
   - Fill Color
   - Stroke Width (1-20px)
3. Click and drag on the canvas to draw
4. For free line tool: click and drag to draw freehand paths

**Available Shapes:**
- **Select** (🖱️): Select and move existing shapes
- **Free Line** (✏️): Draw freehand
- **Straight Line** (—): Draw straight lines
- **Rectangle** (□): Draw rectangles and squares
- **Circle** (○): Draw circles
- **Triangle** (△): Draw triangles
- **Heart** (♥): Draw heart shapes
- **Star** (★): Draw 5-pointed stars
- **Pentagon**: Draw 5-sided polygons
- **Hexagon**: Draw 6-sided polygons
- **Arrow** (→): Draw arrows with arrowheads

### 2. Pan and Zoom

**Pan the Canvas:**
- Press and hold the **middle mouse button** (scroll wheel)
- Drag to pan the canvas in any direction
- Useful for navigating large drawings

**Zoom:**
- Use **mouse wheel** to zoom in/out
- Zoom centers on mouse cursor position
- Zoom range: 10% to 1000%
- Current zoom level displayed in bottom-right corner

### 3. Selecting and Moving Shapes

1. Click the **Select tool** (pointer icon) in the toolbar
2. Click on any shape to select it
3. Selected shapes show a blue dashed outline
4. Click and drag selected shapes to move them
5. Click on empty space to deselect

### 4. Editing Shape Properties

When a shape is selected, the right panel displays editing options:

**Editable Properties:**
- **Stroke Color**: Change the outline color (color picker + hex input)
- **Fill Color**: Change the fill color (use "transparent" for no fill)
- **Stroke Width**: Adjust line thickness (1-20px slider)
- **X/Y Position**: Set exact position coordinates
- **Width/Height**: Adjust shape dimensions (for bounded shapes)

**Delete Shape:**
- Click the red trash icon in the shape editor panel
- Or select the shape and press Delete key

### 5. Importing SVG Files

**Supported SVG Elements:**
- Rectangles (`<rect>`)
- Circles (`<circle>`)
- Ellipses (`<ellipse>`)
- Lines (`<line>`)
- Polylines (`<polyline>`)
- Polygons (`<polygon>`)
- Paths (`<path>` - simplified support for M, L, H, V commands)

**Import Steps:**
1. Click **"Open SVG"** button in the right panel
2. Select an SVG file from your computer
3. Shapes will be imported and added to the canvas
4. Imported shapes preserve colors, stroke widths, and positions
5. You can select and edit imported shapes like any other shape

### 6. Generating G-code

G-code is used for CNC machines, laser cutters, and plotters.

**Steps:**
1. (Optional) Select specific shape(s) to export, or leave unselected to export all shapes
2. In the right panel, find the **"G-code Export"** section
3. Set the **Margin** value in millimeters (default: 5mm)
   - This adds a margin around your design
4. Click **"Generate G-code"** button
5. A file named `output.gcode` will be downloaded

**G-code Format:**
- Units: Millimeters (G21)
- Positioning: Absolute (G90)
- Coordinate conversion: Assumes 96 DPI (1 pixel ≈ 0.265mm)
- Tool commands: M3 (spindle/laser on), M5 (off)
- Safe Z-height: 5mm (raised), 0mm (working)

**G-code Structure:**
```gcode
G21 ; Millimeters
G90 ; Absolute positioning
G0 Z5 ; Lift tool
M3 S1000 ; Start spindle/laser
G0 X10.5 Y10.5 ; Move to start
G1 Z0 F300 ; Lower tool
G1 X20.5 Y20.5 F1000 ; Cut/draw
G0 Z5 ; Lift tool
M5 ; Stop spindle/laser
M30 ; End program
```

### 7. Exporting Project Data

**Export as JSON:**
- Click **"Export JSON"** to save all shape data
- Contains complete shape definitions with coordinates, colors, etc.
- Can be used for backup or data processing

**Download Project ZIP:**
- Click **"Download Project ZIP"** button
- Downloads complete source code including:
  - All React components
  - Utility functions
  - Type definitions
  - package.json
  - README.md
- Extract and run `npm install` to set up the project elsewhere

## Keyboard Shortcuts

- **Delete**: Delete selected shape
- **Escape**: Deselect current shape (future enhancement)

## Project Structure

```
/
├── App.tsx                      # Main application component
├── types.ts                     # TypeScript type definitions
├── INSTRUCTIONS.md              # This file
│
├── components/
│   ├── CanvasEditor.tsx         # Main canvas with drawing logic
│   ├── Toolbar.tsx              # Tool selection and style controls
│   ├── ShapeEditor.tsx          # Shape property editor panel
│   ├── FileControls.tsx         # File import/export controls
│   │
│   └── ui/                      # Shadcn UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       └── ... (other UI components)
│
├── utils/
│   ├── shapes.ts                # Shape drawing and bounds calculations
│   ├── svg.ts                   # SVG file parsing
│   └── gcode.ts                 # G-code generation
│
└── styles/
    └── globals.css              # Global styles and Tailwind config
```

## Technical Details

### Technologies Used
- **Next.js 14**: React framework
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling
- **Canvas API**: Native HTML5 canvas for drawing
- **Lucide React**: Icon library
- **Shadcn UI**: Accessible component library
- **JSZip**: ZIP file generation

### Canvas Rendering
- Direct Canvas API usage (no external canvas libraries)
- Real-time rendering with requestAnimationFrame
- Transform matrix for pan/zoom operations
- Grid background for alignment

### Coordinate Systems
- **Canvas coordinates**: Pixel-based (0,0 at top-left)
- **View transform**: Scale + translation for pan/zoom
- **G-code coordinates**: Millimeters, origin at (0,0)
- **Conversion**: 96 DPI standard (1 inch = 25.4mm)

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
PORT=3001 npm run dev
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Canvas Not Rendering
- Check browser console for errors
- Ensure JavaScript is enabled
- Try a different browser (Chrome, Firefox, Edge recommended)

### SVG Import Not Working
- Ensure SVG file is valid XML
- Check that SVG contains supported elements
- Try simplifying complex SVGs in an editor first

### G-code Scale Issues
- Default assumes 96 DPI
- Adjust scale in gcode.ts `pixelsToMM` function if needed
- Test with small designs first

## Development Tips

### Adding New Shape Types
1. Add shape type to `Tool` type in `types.ts`
2. Add icon to toolbar in `Toolbar.tsx`
3. Implement drawing logic in `utils/shapes.ts`
4. Add G-code path generation in `utils/gcode.ts`

### Customizing G-code Output
Edit `utils/gcode.ts`:
- Change feed rates (F values)
- Adjust Z-heights
- Modify spindle speed (S values)
- Add custom header/footer commands

### Styling Changes
- Global styles: `styles/globals.css`
- Component styles: Use Tailwind classes
- Tailwind tokens: Defined in globals.css with `@theme`

## Browser Compatibility

**Fully Supported:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Required Browser Features:**
- HTML5 Canvas API
- ES6+ JavaScript
- CSS Grid and Flexbox
- File API
- Blob/Download API

## Performance Notes

- Optimal for up to 1000 shapes
- Large SVG imports may take time to parse
- Pan/zoom optimized with transform matrix
- Redraw on every frame when animating

## License

MIT License - Feel free to use and modify

## Support

For issues or questions:
1. Check this documentation
2. Review code comments
3. Inspect browser console for errors
4. Test with simple shapes first

## Version History

**v1.0.0** (Current)
- Initial release
- All core features implemented
- Full G-code generation support
- SVG import capability
- Project export as ZIP

---

**Happy Drawing! 🎨**
