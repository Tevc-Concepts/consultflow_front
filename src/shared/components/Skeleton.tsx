import * as React from 'react';

/**
 * Skeleton
 * Simple animated placeholder for loading states.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export default function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={[
                'animate-pulse rounded-md bg-medium/60',
                className
            ].filter(Boolean).join(' ')}
            aria-hidden
            {...props}
        />
    );
}

export { Skeleton };
