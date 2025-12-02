import { useState } from 'react';
import { ViewTransform } from '../types';

export function useViewTransform(initial?: ViewTransform) {
  const [transform, setTransform] = useState<ViewTransform>(
    initial ?? { scale: 1, translateX: 0, translateY: 0 }
  );

  const zoomToAnchor = (anchorX: number, anchorY: number, factor: number) => {
    const newScale = Math.max(0.1, Math.min(10, transform.scale * factor));
    const scaleChange = newScale / transform.scale;
    const newTranslateX = anchorX - (anchorX - transform.translateX) * scaleChange;
    const newTranslateY = anchorY - (anchorY - transform.translateY) * scaleChange;
    setTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
  };

  return { transform, setTransform, zoomToAnchor };
}

