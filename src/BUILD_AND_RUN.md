# Build and Run Instructions - Canvas Editor

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
  - Check version: `node --version`
  - Download from: https://nodejs.org/

- **npm**: Version 9.x or higher (comes with Node.js)
  - Check version: `npm --version`

## Installation Steps

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages:
- react & react-dom
- next (Next.js framework)
- typescript
- tailwindcss
- lucide-react (icons)
- jszip (for file operations)
- @radix-ui packages (UI primitives)
- And other dependencies

**Expected output:**
```
added XXX packages in XXs
```

### 2. Verify Installation

Check that all packages are installed correctly:

```bash
npm list --depth=0
```

You should see all the packages listed without errors.

## Running the Application

### Development Mode (Recommended for testing)

Start the development server with hot-reload:

```bash
npm run dev
```

**Expected output:**
```
> dev
> next dev

   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Ready in XXXms
```

Open your browser and navigate to:
**http://localhost:3000**

The application will automatically reload when you make changes to the code.

### Using a Different Port

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
```

Or on Windows:
```bash
set PORT=3001 && npm run dev
```

## Building for Production

### 1. Create Production Build

```bash
npm run build
```

This command:
- Compiles TypeScript
- Optimizes React components
- Bundles and minifies JavaScript/CSS
- Generates static assets

**Expected output:**
```
Creating an optimized production build...
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Build completed successfully
```

### 2. Start Production Server

After building, start the production server:

```bash
npm start
```

**Expected output:**
```
> start
> next start

   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Ready in XXXms
```

The production build is optimized for performance and should be used for deployment.

## Package Scripts

Available commands in package.json:

```json
{
  "dev": "next dev",        // Start development server
  "build": "next build",    // Create production build
  "start": "next start",    // Start production server
  "lint": "next lint"       // Run ESLint
}
```

## Project Structure

```
canvas-editor/
├── node_modules/           # Dependencies (auto-generated)
├── .next/                  # Next.js build output (auto-generated)
├── public/                 # Static assets
├── components/
│   ├── CanvasEditor.tsx    # Main canvas component
│   ├── Toolbar.tsx         # Drawing tools
│   ├── ShapeEditor.tsx     # Property editor
│   ├── FileControls.tsx    # File operations
│   └── ui/                 # Shadcn UI components
├── utils/
│   ├── shapes.ts           # Shape utilities
│   ├── svg.ts              # SVG parser
│   └── gcode.ts            # G-code generator
├── App.tsx                 # Main app component
├── types.ts                # TypeScript types
├── styles/
│   └── globals.css         # Global styles
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── next.config.js          # Next.js config
└── tailwind.config.js      # Tailwind config
```

## Troubleshooting

### Issue: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Option 1: Kill the process using port 3000
# On macOS/Linux:
lsof -ti:3000 | xargs kill

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Option 2: Use a different port
PORT=3001 npm run dev
```

### Issue: Module Not Found

**Error:**
```
Module not found: Can't resolve 'package-name'
```

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript Errors

**Error:**
```
Type error: ...
```

**Solution:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# If errors persist, check tsconfig.json settings
```

### Issue: Build Fails

**Error:**
```
Build failed with errors
```

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear all and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Issue: Slow Performance

**Solutions:**
1. Ensure you're using production build (`npm run build && npm start`)
2. Close unnecessary browser tabs
3. Check browser console for errors
4. Reduce number of shapes on canvas
5. Clear browser cache

### Issue: Canvas Not Rendering

**Solutions:**
1. Check browser console (F12) for JavaScript errors
2. Ensure JavaScript is enabled in browser
3. Try a different browser (Chrome recommended)
4. Clear browser cache and reload
5. Check that canvas container has height/width

## Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Note:** Internet Explorer is not supported.

## Development Tips

### Hot Reload

In development mode, the app automatically reloads when you save files:
- Component changes: Fast Refresh (preserves state)
- Style changes: Instant update
- Config changes: May require restart

### Adding New Dependencies

```bash
# Add a new package
npm install package-name

# Add as dev dependency
npm install --save-dev package-name

# Remove a package
npm uninstall package-name
```

### Clearing All Caches

If you experience persistent issues:

```bash
# Clear everything
rm -rf .next node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

## Environment Variables

Create a `.env.local` file for environment variables:

```env
# Example (not needed for this app)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are accessible in the browser.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on vercel.com
3. Deploy automatically

### Other Platforms

For deployment to other platforms:

1. Build the project:
   ```bash
   npm run build
   ```

2. The output will be in `.next/` directory

3. Ensure the platform runs:
   ```bash
   npm start
   ```

4. Configure environment variables if needed

## Performance Optimization

**For Production:**
- Always use `npm run build` before deploying
- Enable gzip/brotli compression on server
- Use CDN for static assets
- Enable HTTP/2
- Set proper cache headers

**For Development:**
- Use React DevTools for debugging
- Monitor Network tab for large assets
- Use Lighthouse for performance audits

## Testing the Application

### Manual Testing Checklist

1. **Drawing Tools:**
   - [ ] Select each shape tool
   - [ ] Draw shapes on canvas
   - [ ] Change colors and stroke width
   - [ ] Draw with free line tool

2. **Pan & Zoom:**
   - [ ] Middle-click drag to pan
   - [ ] Mouse wheel to zoom in/out
   - [ ] Zoom indicator updates

3. **Selection & Editing:**
   - [ ] Select shapes with select tool
   - [ ] Move shapes by dragging
   - [ ] Edit properties in right panel
   - [ ] Delete shapes

4. **File Operations:**
   - [ ] Import SVG file
   - [ ] Export JSON
   - [ ] Generate G-code
   - [ ] Download files successfully

5. **Responsiveness:**
   - [ ] Test at different zoom levels
   - [ ] Test with many shapes
   - [ ] Check browser console for errors

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review the INSTRUCTIONS.md file
3. Check browser console (F12) for errors
4. Verify Node.js and npm versions
5. Try clearing caches and reinstalling
6. Test in a different browser

## Next Steps

After successfully running the application:

1. **Explore Features:**
   - Try all drawing tools
   - Import an SVG file
   - Generate G-code output
   - Experiment with colors and styles

2. **Customize:**
   - Modify shapes in `utils/shapes.ts`
   - Add new tools to `Toolbar.tsx`
   - Customize G-code output in `utils/gcode.ts`
   - Adjust styles in `styles/globals.css`

3. **Learn More:**
   - Read Next.js documentation: https://nextjs.org/docs
   - Explore Tailwind CSS: https://tailwindcss.com/docs
   - Learn React: https://react.dev

## Quick Reference

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start prod server

# Maintenance
npm run lint         # Check code quality
rm -rf .next         # Clear build cache
rm -rf node_modules  # Remove dependencies
```

---

**Ready to start? Run `npm run dev` and open http://localhost:3000** 🚀
