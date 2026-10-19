'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 transition-colors">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        className="group relative flex items-center h-8 w-[64px] rounded-full p-1 cursor-pointer select-none transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        style={{
          // Frosted Glass Capsule Track with reflective glass rim
          background: isDark
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(5, 11, 18, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(241, 245, 249, 0.85) 0%, rgba(226, 232, 240, 0.95) 100%)',
          border: isDark
            ? '1.5px solid rgba(255, 255, 255, 0.16)'
            : '1.5px solid rgba(0, 200, 83, 0.25)',
          boxShadow: isDark
            ? 'inset 0 1px 2px rgba(255, 255, 255, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
            : 'inset 0 1px 3px rgba(255, 255, 255, 0.9), inset 0 -2px 4px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 200, 83, 0.12)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Track Decorative Glyphs: Subtle Moon (left) & Sun (right) */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <Moon
            className={`w-3 h-3 transition-opacity duration-300 ${
              isDark ? 'opacity-80 text-emerald-400' : 'opacity-25 text-slate-400'
            }`}
          />
          <Sun
            className={`w-3.5 h-3.5 transition-opacity duration-300 ${
              !isDark ? 'opacity-90 text-amber-500' : 'opacity-25 text-slate-500'
            }`}
          />
        </div>

        {/* 3D Glass Sliding Sphere Knob (inspired by the green glass 3D reference) */}
        <div
          className="relative z-10 w-6 h-6 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105"
          style={{
            transform: isMounted
              ? isDark
                ? 'translateX(0px)'
                : 'translateX(30px)'
              : 'translateX(0px)',
            // Multi-layered radial gradient simulating a glowing 3D glass sphere with specular reflection
            background: isDark
              ? 'radial-gradient(circle at 35% 30%, #ffffff 0%, #a7f3d0 18%, #00C853 45%, #008a38 75%, #003816 100%)'
              : 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fef08a 18%, #f59e0b 50%, #d97706 75%, #78350f 100%)',
            boxShadow: isDark
              ? '0 0 14px rgba(0, 200, 83, 0.7), 0 2px 5px rgba(0, 0, 0, 0.4), inset -1px -2px 3px rgba(0, 46, 19, 0.6), inset 1px 1px 2px rgba(255, 255, 255, 0.9)'
              : '0 0 14px rgba(245, 158, 11, 0.65), 0 2px 5px rgba(0, 0, 0, 0.2), inset -1px -2px 3px rgba(120, 53, 15, 0.5), inset 1px 1px 2px rgba(255, 255, 255, 0.9)',
          }}
        >
          {/* Specular Glint Highlight Arc */}
          <div
            className="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white/70 filter blur-[0.3px]"
            style={{ transform: 'rotate(-30deg)' }}
          />
        </div>
      </button>
    </div>
  );
}
