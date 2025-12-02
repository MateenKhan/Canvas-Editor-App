import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Download, Play, Pause, RotateCcw, Gauge, SkipBack, SkipForward, ZoomIn, ZoomOut, Rewind, FastForward, Square, FileCode, Shapes } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Slider } from './ui/slider';

interface GCodeViewerProps {
  gcode: string;
  margin: number;
  onLoadFromCanvas?: () => string | void;
}

interface GCodeMove {
  x: number;
  y: number;
  isRapid: boolean;
}

export function GCodeViewer({ gcode, margin, onLoadFromCanvas }: GCodeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [moves, setMoves] = useState<GCodeMove[]>([]);
  const animationRef = useRef<number>();
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerOffsetX, setViewerOffsetX] = useState(0);
  const [viewerOffsetY, setViewerOffsetY] = useState(0);
  const [playDirection, setPlayDirection] = useState<1 | -1>(1);
  const [editedGcode, setEditedGcode] = useState(gcode);
  const [parseVersion, setParseVersion] = useState(0);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [accordionOpen, setAccordionOpen] = useState<string[]>(['simulation', 'gcode']);
  const pinchDistRef = useRef<number | null>(null);
  const pinchMidRef = useRef<{ x: number; y: number } | null>(null);
  const lastDragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const lines = editedGcode.split('\n');
    const parsedMoves: GCodeMove[] = [];
    let currentX = 0;
    let currentY = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(';')) continue;
      const xMatch = trimmed.match(/X([-\d.]+)/);
      const yMatch = trimmed.match(/Y([-\d.]+)/);
      if (xMatch) currentX = parseFloat(xMatch[1]);
      if (yMatch) currentY = parseFloat(yMatch[1]);
      const isRapid = trimmed.startsWith('G0') || trimmed.startsWith('G00');
      if (xMatch || yMatch) {
        parsedMoves.push({ x: currentX, y: currentY, isRapid });
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

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 50;
    const scaleX = (canvas.width - padding * 2) / width;
    const scaleY = (canvas.height - padding * 2) / height;
    const scale = Math.min(scaleX, scaleY);

    const centerX = canvas.width / 2 - ((minX + maxX) / 2) * scale + viewerOffsetX;
    const centerY = canvas.height / 2 + ((minY + maxY) / 2) * scale + viewerOffsetY;

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
      
      const x1 = centerX + move.x * scale;
      const y1 = centerY - move.y * scale;
      const x2 = centerX + nextMove.x * scale;
      const y2 = centerY - nextMove.y * scale;

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
      const x = centerX + current.x * scale;
      const y = centerY - current.y * scale;
      
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw start point
    if (moves.length > 0) {
      const start = moves[0];
      const startX = centerX + start.x * scale;
      const startY = centerY - start.y * scale;
      
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

  }, [moves, currentStep, viewerScale, viewerOffsetX, viewerOffsetY]);

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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">G-code Preview</h2>
          <span className="text-gray-600 text-sm">
            {editedGcode.split('\n').length} lines | Margin: {margin}mm
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <Accordion
          type="multiple"
          value={accordionOpen}
          onValueChange={(val) => setAccordionOpen(Array.isArray(val) ? val : [])}
          className="w-full"
        >
          <AccordionItem value="simulation">
            <AccordionTrigger className="text-lg font-semibold">
              Simulation
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {/* Media Player Controls */}
                <div className="bg-white border rounded-lg p-4 space-y-3">
                  {/* Timeline Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="font-medium">Step: {currentStep} / {moves.length}</span>
                      <span className="font-medium">{Math.round((currentStep / moves.length) * 100)}%</span>
                    </div>
                    <div className="py-3 px-1">
                      <div className="relative">
                        <Slider
                          value={[currentStep]}
                          onValueChange={(value) => {
                            setCurrentStep(value[0]);
                            setIsPlaying(false);
                          }}
                          min={0}
                          max={Math.max(moves.length - 1, 1)}
                          step={1}
                          className="w-full cursor-pointer [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-gray-700 [&_[data-slot=slider-range]]:bg-blue-500 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-blue-500 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-lg hover:[&_[data-slot=slider-thumb]]:scale-110 [&_[data-slot=slider-thumb]]:transition-transform"
                        />
                      </div>
                    </div>
                    
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} title="Reset">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRefresh} title="Load from G-code">
                      <FileCode className="h-4 w-4" />
                    </Button>
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
                          setAccordionOpen(prev => Array.from(new Set([...prev, 'simulation'])));
                          setTimeout(() => {
                            containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
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

                    {/* Speed Control (single slider 0–1000) */}
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
                </div>
                
                <div 
                  ref={containerRef} 
                  className="relative w-full bg-gray-900 rounded-lg overflow-auto"
                  style={{ height: '400px' }}
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
                    } else if (e.touches.length === 1) {
                      const rect = container.getBoundingClientRect();
                      lastDragRef.current = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
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

                      const xs = moves.map(m => m.x);
                      const ys = moves.map(m => m.y);
                      if (xs.length === 0 || ys.length === 0) return;
                      const minX = Math.min(...xs);
                      const maxX = Math.max(...xs);
                      const minY = Math.min(...ys);
                      const maxY = Math.max(...ys);
                      const width = Math.max(1, maxX - minX);
                      const height = Math.max(1, maxY - minY);
                      const padding = 50;
                      const canvasWidth = Math.max(1, Math.round(container.clientWidth * viewerScale));
                      const canvasHeight = Math.max(1, Math.round(container.clientHeight * viewerScale));
                      const scaleX = (canvasWidth - padding * 2) / width;
                      const scaleY = (canvasHeight - padding * 2) / height;
                      const scale = Math.min(scaleX, scaleY);

                      const centerBaseX = canvasWidth / 2 - ((minX + maxX) / 2) * scale;
                      const centerBaseY = canvasHeight / 2 + ((minY + maxY) / 2) * scale;
                      const currentCenterX = centerBaseX + viewerOffsetX;
                      const currentCenterY = centerBaseY + viewerOffsetY;

                      const newViewerScale = Math.max(0.2, Math.min(10, viewerScale * factor));
                      const newCanvasWidth = Math.max(1, Math.round(container.clientWidth * newViewerScale));
                      const newCanvasHeight = Math.max(1, Math.round(container.clientHeight * newViewerScale));
                      const newScaleX = (newCanvasWidth - padding * 2) / width;
                      const newScaleY = (newCanvasHeight - padding * 2) / height;
                      const newScale = Math.min(newScaleX, newScaleY);

                      const scaleChange = newScale / scale;
                      const newCenterX = midX - (midX - currentCenterX) * scaleChange;
                      const newCenterY = midY - (midY - currentCenterY) * scaleChange;

                      const newCenterBaseX = newCanvasWidth / 2 - ((minX + maxX) / 2) * newScale;
                      const newCenterBaseY = newCanvasHeight / 2 + ((minY + maxY) / 2) * newScale;
                      setViewerScale(newViewerScale);
                      setViewerOffsetX(newCenterX - newCenterBaseX);
                      setViewerOffsetY(newCenterY - newCenterBaseY);
                    } else if (e.touches.length === 1 && lastDragRef.current) {
                      e.preventDefault();
                      const rect = container.getBoundingClientRect();
                      const x = e.touches[0].clientX - rect.left;
                      const y = e.touches[0].clientY - rect.top;
                      const dx = x - lastDragRef.current.x;
                      const dy = y - lastDragRef.current.y;
                      lastDragRef.current = { x, y };
                      setViewerOffsetX(prev => prev + dx);
                      setViewerOffsetY(prev => prev + dy);
                    }
                  }}
                  onTouchEnd={() => {
                    pinchDistRef.current = null;
                    pinchMidRef.current = null;
                    lastDragRef.current = null;
                  }}
                  style={{ touchAction: 'none' }}
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
            </AccordionContent>
          </AccordionItem>

            <AccordionItem value="gcode">
              <AccordionTrigger className="text-lg font-semibold">
                G-code
              </AccordionTrigger>
              <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={findText} onChange={e => setFindText(e.target.value)} className="flex-1" placeholder="Find" />
                  <Input value={replaceText} onChange={e => setReplaceText(e.target.value)} className="flex-1" placeholder="Replace" />
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
                  <Textarea value={editedGcode} onChange={e => setEditedGcode(e.target.value)} className="text-green-400 font-mono text-sm leading-relaxed min-h-[240px] h-64 overflow-auto" />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setParseVersion(v => v + 1);
                      setCurrentStep(0);
                      setPlayDirection(1);
                      setIsPlaying(true);
                      setAccordionOpen(prev => Array.from(new Set([...prev, 'simulation'])));
                      setTimeout(() => {
                        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 50);
                    }}
                  >
                    Simulate
                  </Button>
                </div>
              </div>
              </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
  
