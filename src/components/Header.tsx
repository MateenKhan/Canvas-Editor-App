import React from 'react';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleRight: () => void;
  isRightOpen?: boolean;
  theme?: string;
  onThemeChange?: (t: string) => void;
}

export function Header({ onToggleRight, isRightOpen, theme = 'galaxy', onThemeChange }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background text-foreground px-4 py-3 shadow-sm relative z-30">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground"> Design & Make by Airtajal </h1>
        <div className="flex items-center gap-2">
          <label htmlFor="theme-select" className="sr-only">Theme</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => onThemeChange?.(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm bg-background text-foreground"
          >
            <option value="galaxy">Galaxy</option>
            <option value="forest">Forest</option>
            <option value="glacier">Glacier</option>
            <option value="summer">Summer</option>
            <option value="rosey">Rosey</option>
            <option value="ocean">Ocean</option>
            <option value="sunset">Sunset</option>
            <option value="midnight">Midnight</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden my-2"
            aria-label="Toggle sidebar"
            aria-controls="right-sidebar"
            aria-expanded={!!isRightOpen}
            onClick={onToggleRight}
          >
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  );
}
