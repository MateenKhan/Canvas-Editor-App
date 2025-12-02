import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Download, Play, Pause, RotateCcw, SkipBack, SkipForward, ZoomIn, ZoomOut, Rewind, FastForward, Square, FileCode, Shapes } from 'lucide-react';
 

interface GCodeViewerProps {
  gcode: string;
  margin: number;
  onLoadFromCanvas?: () => string | void;
  showSimulationControls?: boolean;
  showGcodeEditor?: boolean;
  showLoadFromGcodeButton?: boolean;
  showSimulationHeader?: boolean;
  showDownload?: boolean;
}

interface GCodeMove {
  x: number;
  y: number;
  isRapid: boolean;
  z?: number;
}

export function GCodeViewer({ gcode, margin, onLoadFromCanvas, showSimulationControls = true, showGcodeEditor = true, showLoadFromGcodeButton = true, showSimulationHeader = true, showDownload = true }: GCodeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [moves, setMoves] = useState<GCodeMove[]>([]);
  const animationRef = useRef<number | null>(null);
  const [viewerScale, setViewerScale] = useState(1);
  const [playDirection, setPlayDirection] = useState<1 | -1>(1);
  const [editedGcode, setEditedGcode] = useState(gcode);
  const [parseVersion, setParseVersion] = useState(0);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const initialSections = showSimulationControls
    ? (showGcodeEditor ? ['simulation', 'gcode'] : ['simulation'])
    : (showGcodeEditor ? ['gcode'] : []);
  const [accordionOpen, setAccordionOpen] = useState<string[]>(initialSections);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const maxStepCount = Math.max(moves.length - 1, 1);
  const segments = moves.length > 1
    ? moves.slice(1).map((m, i) => {
        const startPct = (i / maxStepCount) * 100;
        const endPct = ((i + 1) / maxStepCount) * 100;
        const widthPct = endPct - startPct;
        return { startPct, widthPct, isRapid: m.isRapid };
      })
    : [];

  const setStepFromClientX = (clientX: number) => {
    const el = timelineRef.current;
    if (!el || moves.length === 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const maxStep = Math.max(moves.length - 1, 1);
    const next = Math.round(ratio * maxStep);
    setCurrentStep(Math.min(maxStep, Math.max(0, next)));
  };
  const pinchDistRef = useRef<number | null>(null);
  const pinchMidRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const lines = editedGcode.split('\n');
    const parsedMoves: GCodeMove[] = [];
    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(';')) continue;
      const xMatch = trimmed.match(/X([-\d.]+)/);
      const yMatch = trimmed.match(/Y([-\d.]+)/);
      const zMatch = trimmed.match(/Z([-\d.]+)/);
      if (xMatch) currentX = parseFloat(xMatch[1]);
      if (yMatch) currentY = parseFloat(yMatch[1]);
      if (zMatch) currentZ = parseFloat(zMatch[1]);
      const isRapid = trimmed.startsWith('G0') || trimmed.startsWith('G00');
      if (xMatch || yMatch) {
        parsedMoves.push({ x: currentX, y: currentY, z: currentZ, isRapid });
      }
    }
    setMoves(parsedMoves);
    setCurrentStep(0);
  }, [parseVersion]);

  useEffect(() => {
    setEditedGcode(gcode);
    setParseVersion(v => v + 1);
  }, [gcode]);

  // Draw simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || moves.length === 0) return;

    const canvasWidth = Math.max(1, Math.round(container.clientWidth * viewerScale));
    const canvasHeight = Math.max(1, Math.round(container.clientHeight * viewerScale));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find bounds
    const xs = moves.map(m => m.x);
    const ys = moves.map(m => m.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const padding = 50;
    const scaleX = (canvas.width - padding * 2) / width;
    const scaleY = (canvas.height - padding * 2) / height;
    const scale = Math.min(scaleX, scaleY);

    const centerX = canvas.width / 2 - ((minX + maxX) / 2) * scale;
    const centerY = canvas.height / 2 + ((minY + maxY) / 2) * scale;

    const transform = (wx: number, wy: number) => {
      const vx = wx * scale;
      const vy = -wy * scale;
      return [centerX + vx, centerY + vy] as const;
    };

    // Draw grid
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1;
    const gridSize = 10 * scale;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw completed path
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.min(currentStep, moves.length - 1); i++) {
      const move = moves[i];
      const nextMove = moves[i + 1];
      
      const [x1, y1] = transform(move.x, move.y);
      const [x2, y2] = transform(nextMove.x, nextMove.y);

      ctx.strokeStyle = nextMove.isRapid ? '#858585' : '#00ff00';
      ctx.setLineDash(nextMove.isRapid ? [5, 5] : []);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw current position
    if (currentStep < moves.length) {
      const current = moves[currentStep];
      const [x, y] = transform(current.x, current.y);
      
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw start point
    if (moves.length > 0) {
      const start = moves[0];
      const [startX, startY] = transform(start.x, start.y);
      
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(startX, startY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw bounds info
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Bounds: ${width.toFixed(2)} x ${height.toFixed(2)} mm`, 10, 20);

    // Axis triad (X right, Y up, Z diagonal)
    const triadOriginX = 20;
    const triadOriginY = canvas.height - 30;
    ctx.lineWidth = 2;
    // X - red (right)
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(triadOriginX, triadOriginY);
    ctx.lineTo(triadOriginX + 30, triadOriginY);
    ctx.stroke();
    ctx.fillText('X', triadOriginX + 35, triadOriginY + 4);
    // Y - green (up)
    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(triadOriginX, triadOriginY);
    ctx.lineTo(triadOriginX, triadOriginY - 30);
    ctx.stroke();
    ctx.fillText('Y', triadOriginX - 4, triadOriginY - 35);
    // Z - blue (diagonal)
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(triadOriginX, triadOriginY);
    ctx.lineTo(triadOriginX + 20, triadOriginY - 20);
    ctx.stroke();
    ctx.fillText('Z', triadOriginX + 24, triadOriginY - 24);

    // Current coordinates
    if (currentStep < moves.length) {
      const c = moves[currentStep];
      ctx.fillStyle = '#d4d4d4';
      ctx.fillText(`X:${c.x.toFixed(2)} Y:${c.y.toFixed(2)}`, 10, canvas.height - 10);
    }

  }, [moves, currentStep, viewerScale]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || (playDirection === 1 && currentStep >= moves.length - 1) || (playDirection === -1 && currentStep <= 0)) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if ((playDirection === 1 && currentStep >= moves.length - 1) || (playDirection === -1 && currentStep <= 0)) {
        setIsPlaying(false);
      }
      return;
    }

    const effectiveSpeed = Math.max(1, speed);
    const interval = 1000 / (effectiveSpeed / 10);
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      if (now - lastTime >= interval) {
        setCurrentStep(prev => (playDirection === 1 ? Math.min(prev + 1, moves.length - 1) : Math.max(prev - 1, 0)));
        lastTime = now;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentStep, moves.length, speed, playDirection]);

  const handleDownload = () => {
    const blob = new Blob([editedGcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.gcode';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleStepForward = () => {
    setCurrentStep(prev => Math.min(prev + 1, moves.length - 1));
    setIsPlaying(false);
  };

  const handleStepBackward = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setIsPlaying(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentStep, moves.length]);

  const handleRefresh = () => {
    setIsPlaying(false);
    setParseVersion(v => v + 1);
  };

  const content = showSimulationControls ? (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-medium">Step: {currentStep} / {moves.length}</span>
            <span className="font-medium">{moves.length > 0 ? Math.round((currentStep / Math.max(moves.length - 1, 1)) * 100) : 0}%</span>
          </div>
          <div className="py-3 px-1">
            <div
              ref={timelineRef}
              className="relative h-3 rounded cursor-pointer select-none"
              style={{ backgroundColor: '#3f3f46' }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsPlaying(false);
                setIsScrubbing(true);
                setStepFromClientX(e.clientX);
                const onMove = (ev: MouseEvent) => setStepFromClientX(ev.clientX);
                const onUp = () => {
                  setIsScrubbing(false);
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              onTouchStart={(e) => {
                const t = e.touches[0];
                setIsPlaying(false);
                setIsScrubbing(true);
                setStepFromClientX(t.clientX);
                const onMove = (ev: TouchEvent) => {
                  const tt = ev.touches[0];
                  if (tt) setStepFromClientX(tt.clientX);
                };
                const onEnd = () => {
                  setIsScrubbing(false);
                  window.removeEventListener('touchmove', onMove);
                  window.removeEventListener('touchend', onEnd);
                  window.removeEventListener('touchcancel', onEnd);
                };
                window.addEventListener('touchmove', onMove, { passive: true });
                window.addEventListener('touchend', onEnd);
                window.addEventListener('touchcancel', onEnd);
              }}
            >
              <div className="absolute inset-0 rounded">
                {segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 h-full"
                    style={{
                      left: `${seg.startPct}%`,
                      width: `${seg.widthPct}%`,
                      backgroundImage: seg.isRapid
                        ? 'linear-gradient(0deg, #858585, #858585), repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0 6px, transparent 6px 12px)'
                        : undefined,
                      backgroundColor: seg.isRapid ? undefined : '#22c55e',
                    }}
                  />
                ))}
              </div>
              <div
                className="absolute left-0 top-0 h-1 rounded bg-blue-500 z-10"
                style={{ width: `${moves.length > 1 ? (currentStep / (moves.length - 1)) * 100 : 0}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-blue-500 bg-white shadow z-20"
                style={{ left: `${moves.length > 1 ? (currentStep / (moves.length - 1)) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} title="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
            {showLoadFromGcodeButton && (
              <Button variant="outline" size="sm" onClick={handleRefresh} title="Load from G-code">
                <FileCode className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!onLoadFromCanvas) return;
                const next = onLoadFromCanvas();
                if (typeof next === 'string' && next.length > 0) {
                  setEditedGcode(next);
                  setParseVersion(v => v + 1);
                  setCurrentStep(0);
                  setPlayDirection(1);
                  setIsPlaying(true);
                }
              }}
              title="Load from Canvas"
            >
              <Shapes className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setPlayDirection(-1); setIsPlaying(true); }} title="Reverse">
              <Rewind className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={() => { setPlayDirection(1); setIsPlaying(true); }} title="Play">
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsPlaying(false)} title="Pause">
              <Pause className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setIsPlaying(false); setCurrentStep(0); }} title="Stop">
              <Square className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleStepBackward} disabled={currentStep === 0} title="Step Back">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleStepForward} disabled={currentStep >= moves.length - 1} title="Step Forward">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSpeed(s => Math.max(0, s - 100))} title="Slow">
              <Rewind className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSpeed(s => Math.min(1000, s + 100))} title="Fast">
              <FastForward className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{speed}%</span>
          </div>
        </div>
        <div 
          ref={containerRef} 
          className="relative w-full bg-gray-900 rounded-lg overflow-auto"
          style={{ height: '400px', touchAction: 'none' }}
          onWheel={(e) => {
            if (e.ctrlKey) {
              e.preventDefault();
              const factor = e.deltaY < 0 ? 1.1 : 0.9;
              setViewerScale((prev) => {
                const next = Math.max(0.2, Math.min(10, prev * factor));
                return next;
              });
            }
          }}
          onTouchStart={(e) => {
            const container = containerRef.current;
            if (!container) return;
            if (e.touches.length === 2) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              pinchDistRef.current = Math.hypot(dx, dy);
              const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - container.getBoundingClientRect().left;
              const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - container.getBoundingClientRect().top;
              pinchMidRef.current = { x: midX, y: midY };
            }
          }}
          onTouchMove={(e) => {
            const container = containerRef.current;
            if (!container) return;
            if (e.touches.length === 2 && pinchDistRef.current && pinchMidRef.current) {
              e.preventDefault();
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              const dist = Math.hypot(dx, dy);
              const factor = dist / pinchDistRef.current;
              const rect = container.getBoundingClientRect();
              const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
              const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
              pinchDistRef.current = dist;
              pinchMidRef.current = { x: midX, y: midY };
              const newViewerScale = Math.max(0.2, Math.min(10, viewerScale * factor));
              setViewerScale(newViewerScale);
            }
          }}
          onTouchEnd={() => {
            pinchDistRef.current = null;
            pinchMidRef.current = null;
          }}
        >
          <canvas ref={canvasRef} />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewerScale((s) => Math.min(10, s * 1.1))}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewerScale((s) => Math.max(0.2, s * 0.9))}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="rounded bg-gray-800 text-white px-2 py-1 text-xs">{Math.round(viewerScale * 100)}%</span>
          </div>
        </div>
        <div className="bg-gray-800 text-white px-3 py-2 rounded text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span>Cut path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-500" style={{ borderTop: '1px dashed' }}></div>
            <span>Rapid move</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Current position</span>
          </div>
        </div>
      </div>
    </div>
  ) : (
    showGcodeEditor ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input value={findText} onChange={e => setFindText(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1" placeholder="Find" />
          <input value={replaceText} onChange={e => setReplaceText(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1" placeholder="Replace" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!findText) return;
              const next = editedGcode.split(findText).join(replaceText);
              setEditedGcode(next);
            }}
          >
            Replace All
          </Button>
          <span className="text-xs text-gray-600">Matches: {findText ? (editedGcode.split(findText).length - 1) : 0}</span>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[500px]">
          <Textarea value={editedGcode} onChange={e => setEditedGcode(e.target.value)} className="text-white font-mono text-sm leading-relaxed min-h-[3840px] h-[256rem] overflow-auto" style={{ backgroundColor: '#f0f0f0' }} />
        </div>
      </div>
    ) : null
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">G-code Preview</h2>
          <span className="text-gray-600 text-sm">
            {editedGcode.split('\n').length} lines | Margin: {margin}mm
          </span>
        </div>
        {showDownload && (
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        
        {content}
      </div>
    </div>
  );
}
  
