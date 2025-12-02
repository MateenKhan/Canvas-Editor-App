import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Download, Play, Pause, RotateCcw, Gauge, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
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
}

interface GCodeMove {
  x: number;
  y: number;
  isRapid: boolean;
}

export function GCodeViewer({ gcode, margin }: GCodeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [moves, setMoves] = useState<GCodeMove[]>([]);
  const animationRef = useRef<number>();
  const [viewerScale, setViewerScale] = useState(1);

  // Parse G-code into moves
  useEffect(() => {
    const lines = gcode.split('\n');
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

    const centerX = canvas.width / 2 - ((minX + maxX) / 2) * scale;
    const centerY = canvas.height / 2 + ((minY + maxY) / 2) * scale;

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

  }, [moves, currentStep, viewerScale]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || currentStep >= moves.length - 1) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (currentStep >= moves.length - 1) {
        setIsPlaying(false);
      }
      return;
    }

    const interval = 1000 / (speed / 10);
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      if (now - lastTime >= interval) {
        setCurrentStep(prev => Math.min(prev + 1, moves.length - 1));
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
  }, [isPlaying, currentStep, moves.length, speed]);

  const handleDownload = () => {
    const blob = new Blob([gcode], { type: 'text/plain' });
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-900 font-semibold">G-code Preview</h2>
          <span className="text-gray-600 text-sm">
            {gcode.split('\n').length} lines | Margin: {margin}mm
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
        <Accordion type="multiple" defaultValue={["simulation"]} className="w-full">
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
                    <div className="text-xs text-gray-500 text-center">
                      Click or drag the slider to scrub through the simulation
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        title="Reset (Home)"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStepBackward}
                        disabled={currentStep === 0}
                        title="Step Backward (←)"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handlePlayPause}
                        title="Play/Pause (Space)"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStepForward}
                        disabled={currentStep >= moves.length - 1}
                        title="Step Forward (→)"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Speed Control */}
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Gauge className="h-5 w-5 text-gray-600" />
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">Playback Speed</span>
                            <span className="text-lg text-gray-900 font-bold min-w-[70px] text-right bg-gray-100 px-2 py-0.5 rounded">{speed}%</span>
                          </div>
                          <div className="py-1">
                            <Slider
                              value={[speed]}
                              onValueChange={(value) => setSpeed(value[0])}
                              min={1}
                              max={1000}
                              step={1}
                              className="w-full cursor-pointer [&_[data-slot=slider-track]]:h-3 [&_[data-slot=slider-track]]:bg-gray-300 [&_[data-slot=slider-track]]:rounded-full [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-green-500 [&_[data-slot=slider-range]]:via-yellow-500 [&_[data-slot=slider-range]]:to-red-500 [&_[data-slot=slider-range]]:rounded-full [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-3 [&_[data-slot=slider-thumb]]:border-gray-700 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-thumb]]:cursor-grab hover:[&_[data-slot=slider-thumb]]:scale-125 active:[&_[data-slot=slider-thumb]]:cursor-grabbing active:[&_[data-slot=slider-thumb]]:scale-110 [&_[data-slot=slider-thumb]]:transition-all [&_[data-slot=slider-thumb]]:duration-150"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
                            <span>1%<br/><span className="text-[10px] text-gray-400">Slowest</span></span>
                            <span>100%<br/><span className="text-[10px] text-gray-400">Normal</span></span>
                            <span>500%<br/><span className="text-[10px] text-gray-400">Fast</span></span>
                            <span>1000%<br/><span className="text-[10px] text-gray-400">Fastest</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 justify-end flex-wrap">
                        {[10, 25, 50, 100, 200, 500, 1000].map((presetSpeed) => (
                          <Button
                            key={presetSpeed}
                            variant={speed === presetSpeed ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSpeed(presetSpeed)}
                            className="text-xs px-2 h-6"
                          >
                            {presetSpeed}%
                          </Button>
                        ))}
                      </div>
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
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[500px]">
                <pre className="text-green-400 font-mono text-sm leading-relaxed">
                  {gcode}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
