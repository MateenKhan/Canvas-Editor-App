# Canvas Editor with G-code Generator

A feature-rich canvas editor built with Next.js that supports drawing shapes, importing SVG files, and generating G-code for CNC machines and laser cutters.

![Canvas Editor](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## ✨ Features

- **🎨 Multiple Drawing Tools**
  - Free line drawing
  - Straight lines
  - Basic shapes: Rectangle, Circle, Triangle
  - Special shapes: Heart, Star, Pentagon, Hexagon, Arrow

- **🖱️ Advanced Canvas Controls**
  - Pan with middle mouse button
  - Zoom with mouse wheel (10% - 1000%)
  - Grid background for alignment
  - Real-time zoom indicator

- **📐 Shape Manipulation**
  - Select and move shapes
  - Edit colors (stroke & fill)
  - Adjust stroke width (1-20px)
  - Modify position and dimensions
  - Delete shapes

- **📂 File Operations**
  - Import SVG files (supports rect, circle, ellipse, line, polyline, polygon, path)
  - Export project as JSON
  - Generate G-code for CNC/laser cutting
  - Customizable margins in millimeters

- **⚙️ G-code Generation**
  - Optimized toolpaths
  - Configurable margins
  - Export selected shapes or entire canvas
  - Standard G-code format (millimeters, absolute positioning)

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📖 Documentation

- **[BUILD_AND_RUN.md](BUILD_AND_RUN.md)** - Complete build and deployment instructions
- **[INSTRUCTIONS.md](INSTRUCTIONS.md)** - Detailed user guide and feature documentation

## 🎯 Usage

### Drawing Shapes

1. Select a tool from the left toolbar
2. Customize colors and stroke width (click the color button)
3. Click and drag on canvas to draw

### Pan & Zoom

- **Pan**: Middle-click + drag
- **Zoom**: Mouse wheel (scroll up/down)

### Editing Shapes

1. Click the Select tool (pointer icon)
2. Click a shape to select it
3. Edit properties in the right panel
4. Drag to move selected shapes

### Importing SVG

1. Click "Open SVG" button
2. Select an SVG file
3. Shapes will be added to canvas

### Generating G-code

1. (Optional) Select specific shapes to export
2. Set margin in millimeters
3. Click "Generate G-code"
4. Download `output.gcode` file

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **Canvas**: HTML5 Canvas API
- **File Handling**: JSZip

## 📁 Project Structure

```
/
├── App.tsx                  # Main application
├── types.ts                 # TypeScript definitions
├── components/
│   ├── CanvasEditor.tsx     # Canvas with drawing logic
│   ├── Toolbar.tsx          # Tool selection
│   ├── ShapeEditor.tsx      # Property editor
│   ├── FileControls.tsx     # File operations
│   └── ui/                  # Shadcn components
├── utils/
│   ├── shapes.ts            # Shape rendering
│   ├── svg.ts               # SVG parsing
│   └── gcode.ts             # G-code generation
└── styles/
    └── globals.css          # Global styles
```

## 🎨 Available Shapes

| Shape | Description |
|-------|-------------|
| Free Line | Freehand drawing |
| Straight Line | Click and drag for straight lines |
| Rectangle | Rectangles and squares |
| Circle | Perfect circles |
| Triangle | Equilateral triangles |
| Heart | Heart shapes |
| Star | 5-pointed stars |
| Pentagon | 5-sided polygons |
| Hexagon | 6-sided polygons |
| Arrow | Arrows with arrowheads |

## 🔧 Customization

### Adding New Shapes

1. Add shape type to `types.ts`
2. Add tool button in `Toolbar.tsx`
3. Implement drawing in `utils/shapes.ts`
4. Add G-code generation in `utils/gcode.ts`

### Customizing G-code

Edit `utils/gcode.ts` to modify:
- Feed rates (F values)
- Z-heights
- Spindle speeds (S values)
- Coordinate scaling

### Styling

- Global styles: `styles/globals.css`
- Component styles: Tailwind classes
- Tokens: Defined in `globals.css`

## 🌐 Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 90+     |
| Firefox | 88+     |
| Edge    | 90+     |
| Safari  | 14+     |

## 📊 Performance

- Optimized for up to 1000 shapes
- Transform-based pan/zoom (no re-rendering)
- Efficient canvas redraw
- Responsive at 60 FPS

## 🐛 Troubleshooting

### Port 3000 in use
```bash
PORT=3001 npm run dev
```

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Canvas not rendering
- Check browser console (F12)
- Ensure JavaScript is enabled
- Try Chrome or Firefox

## 📝 G-code Format

Generated G-code follows standard format:

```gcode
G21          ; Millimeters
G90          ; Absolute positioning
G0 Z5        ; Lift tool
M3 S1000     ; Start spindle/laser
G0 X10 Y10   ; Move to position
G1 Z0 F300   ; Lower tool
G1 X20 Y20   ; Cut/draw
G0 Z5        ; Lift tool
M5           ; Stop spindle/laser
M30          ; End program
```

## 📦 Dependencies

```json
{
  "react": "^18",
  "next": "14.2.5",
  "typescript": "^5",
  "tailwindcss": "^4.0.0",
  "lucide-react": "latest",
  "jszip": "^3.10.1"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify

## 🙋 Support

- Review documentation files
- Check browser console for errors
- Verify Node.js version compatibility
- Test with simple shapes first

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [G-code Reference](https://linuxcnc.org/docs/html/gcode.html)

## 🚀 Getting Started

Ready to start? Follow these steps:

1. **Install**: `npm install`
2. **Run**: `npm run dev`
3. **Open**: http://localhost:3000
4. **Draw**: Select a tool and start creating!

For detailed instructions, see [BUILD_AND_RUN.md](BUILD_AND_RUN.md)

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
