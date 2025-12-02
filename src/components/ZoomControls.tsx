import React from 'react';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react@0.487.0';

interface ViewTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

interface ZoomControlsProps {
  transform: ViewTransform;
  setTransform: (t: ViewTransform) => void;
  getCanvasRect: () => DOMRect | null;
}

export function ZoomControls({ transform, setTransform, getCanvasRect }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-16 right-4 flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          const rect = getCanvasRect();
          if (!rect) return;
          const anchorX = rect.width / 2;
          const anchorY = rect.height / 2;
          const newScale = Math.min(10, transform.scale * 1.1);
          const scaleChange = newScale / transform.scale;
          const newTranslateX = anchorX - (anchorX - transform.translateX) * scaleChange;
          const newTranslateY = anchorY - (anchorY - transform.translateY) * scaleChange;
          setTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
        }}
        title="Zoom In"
      >
        <ZoomIn />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          const rect = getCanvasRect();
          if (!rect) return;
          const anchorX = rect.width / 2;
          const anchorY = rect.height / 2;
          const newScale = Math.max(0.1, transform.scale * 0.9);
          const scaleChange = newScale / transform.scale;
          const newTranslateX = anchorX - (anchorX - transform.translateX) * scaleChange;
          const newTranslateY = anchorY - (anchorY - transform.translateY) * scaleChange;
          setTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
        }}
        title="Zoom Out"
      >
        <ZoomOut />
      </Button>
    </div>
  );
}

