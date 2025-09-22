"use client";

import * as React from "react";

/**
 * BrandBadge
 * Circular gradient badge for leading icons in chips/cards/buttons.
 * Classes to copy:
 * - "h-9 w-9 rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white grid place-items-center shadow-soft-1"
 */
export interface BrandBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number; // px size; defaults to 36 (h-9 w-9)
    children?: React.ReactNode; // icon
}

export default function BrandBadge({ size = 36, children, className, ...props }: BrandBadgeProps) {
    const style: React.CSSProperties = { width: size, height: size };
    return (
        <div
            className={["rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white grid place-items-center shadow-soft-1", className].filter(Boolean).join(" ")}
            style={style}
            {...props}
        >
            <span className="opacity-90" aria-hidden>{children}</span>
        </div>
    );
}
