'use client';

import { useState } from 'react';

interface Props {
  onMenuToggle: () => void;
}

export default function MobileHeader({ onMenuToggle }: Props) {
  return (
    <header className="mobile-header">
      <span className="brand-mobile">Fix Sewa</span>
      <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
        ☰
      </button>
    </header>
  );
}
