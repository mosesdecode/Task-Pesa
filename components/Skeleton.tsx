import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  // Using standard classes directly to avoid dependency on cn if it doesn't exist
  // We can merge className manually just in case
  const defaultClasses = `
    relative overflow-hidden 
    bg-slate-800/60 rounded-md 
    animate-pulse
    before:absolute before:inset-0 
    before:-translate-x-full before:animate-shimmer 
    before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
  `.replace(/\s+/g, ' ').trim();
  const combinedClasses = className ? `${defaultClasses} ${className}` : defaultClasses;
  
  return (
    <div
      className={combinedClasses}
      {...props}
    />
  );
}
