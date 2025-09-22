"use client";

import * as React from "react";

/**
 * Button component
 *
 * Accessible, mobile-first button with variants and sizes.
 * - Variants: primary | ghost | danger
 * - Focus ring and keyboard accessible behavior
 * - Supports optional left icon
 *
 * Example:
 * ```tsx
 * import Button from "@/components/ui/Button";
 *
 * export default function Example() {
 *   return (
 *     <div className="space-x-2">
 *       <Button variant="primary">Save</Button>
 *       <Button variant="ghost">Cancel</Button>
 *       <Button variant="danger" icon={<span>!</span>}>Delete</Button>
 *     </div>
 *   );
 * }
 * ```
 */

export type ButtonVariant = "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
    /** Visual style of the button */
    variant?: ButtonVariant;
    /** Size of the button */
    size?: ButtonSize;
    /** Optional left icon */
    icon?: React.ReactNode;
}

// Spacing tokens: px-4 py-3 (mobile), px-6 py-4 (desktop)
// Utility to keep consistent paddings per size while following tokens
const sizeClasses: Record<ButtonSize, string> = {
    sm: "text-sm px-3 py-2 md:px-4 md:py-2.5",
    md: "text-sm px-4 py-3 md:px-6 md:py-4",
    lg: "text-base px-5 py-3.5 md:px-7 md:py-5"
};

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        // Primary: gradient background, subtle shadow, strong focus ring
        // Classes (copy/paste): "bg-gradient-to-r from-brand-start to-brand-end text-white shadow-soft-1 hover:shadow-hover"
        "bg-gradient-to-r from-brand-start to-brand-end text-white shadow-soft-1 hover:shadow-hover",
    ghost:
        "bg-transparent text-deep-navy hover:bg-medium/40",
    danger:
        "bg-coral text-deep-navy hover:bg-coral/90"
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function Button(
    { variant = "primary", size = "md", icon, className, children, ...props }: ButtonProps,
    ref: React.Ref<HTMLButtonElement>
) {
    return (
        <button
            ref={ref}
            className={cn(
                // Base button primitives
                "inline-flex items-center justify-center gap-2 rounded-full font-medium",
                // Strong focus ring (brand color)
                "outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2",
                // Disabled and motion
                "disabled:opacity-50 disabled:cursor-not-allowed transition-shadow",
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {icon ? <span aria-hidden className="grid place-items-center">{icon}</span> : null}
            <span>{children}</span>
        </button>
    );
}

const _Button = React.forwardRef(Button);

export default _Button;
export { _Button as Button };
