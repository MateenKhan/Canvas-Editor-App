import React from 'react';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

export function Header({ onToggleLeft, onToggleRight }: HeaderProps) {
  return (
    <header className="border-b bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          className="sm:hidden my-2"
          onClick={onToggleLeft}
        >
          <Menu />
        </Button>
        <h1 className="text-gray-900">Airtajal Canvas</h1>
        <Button
          variant="outline"
          size="icon"
          className="sm:hidden my-2"
          onClick={onToggleRight}
        >
          <Menu />
        </Button>
      </div>
    </header>
  );
}
