import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  // Using standard classes directly to avoid dependency on cn if it doesn't exist
  // We can merge className manually just in case
  const defaultClasses = "animate-pulse rounded-md bg-slate-800/60";
  const combinedClasses = className ? `${defaultClasses} ${className}` : defaultClasses;
  
  return (
    <div
      className={combinedClasses}
      {...props}
    />
  );
}
