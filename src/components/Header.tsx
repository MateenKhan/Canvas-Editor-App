import React from 'react';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleRight: () => void;
  isRightOpen?: boolean;
}

export function Header({ onToggleRight, isRightOpen }: HeaderProps) {
  return (
    <header className="border-b bg-white px-4 py-3 shadow-sm relative z-30">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900"> Design & Make by Airtajal </h1>
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
    </header>
  );
}
