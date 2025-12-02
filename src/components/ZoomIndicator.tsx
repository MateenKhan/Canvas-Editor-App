import React from 'react';

interface ZoomIndicatorProps {
  scale: number;
}

export function ZoomIndicator({ scale }: ZoomIndicatorProps) {
  return (
    <div className="absolute bottom-4 right-4 rounded bg-white px-3 py-2 shadow-md">
      <span className="text-gray-700">Zoom: {Math.round(scale * 100)}%</span>
    </div>
  );
}

