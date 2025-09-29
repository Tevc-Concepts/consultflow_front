'use client';

import * as React from 'react';

export type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
};

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-2',
};

export function Spinner({ size = 'sm', className = '', label }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-live="polite" aria-busy="true">
      <span className={`animate-spin rounded-full ${sizeMap[size]} border-current border-t-transparent`}/>
      {label ? <span className="text-sm opacity-80">{label}</span> : null}
    </span>
  );
}

export default Spinner;
