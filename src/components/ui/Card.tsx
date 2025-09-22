import * as React from "react";

/**
 * Card component
 *
 * Mobile-first container with rounded corners and soft shadow.
 * Accepts optional header and footer regions.
 *
 * Example:
 * ```tsx
 * import Card from "@/components/ui/Card";
 *
 * export default function Example() {
 *   return (
 *     <Card header={<h3 className="text-lg font-semibold">Title</h3>} footer={<div>Footer</div>}>
 *       <p>Card content</p>
 *     </Card>
 *   );
 * }
 * ```
 */

export type CardVariant = "default" | "primary";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    /**
     * Visual style
     * - default: white background card with soft shadow
     * - primary: gradient brand card with white text (use for hero/primary sections)
     * Utility classes (copy/paste):
     *   - Primary card: "rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-white shadow-soft-1 md:shadow-soft hover:shadow-hover"
     */
    variant?: CardVariant;
}

function Card({ header, footer, className, variant = "default", children, ...props }: CardProps, ref: React.Ref<HTMLDivElement>) {
    const base = [
        "rounded-2xl",
        // Responsive spacing tokens: px-4 py-3 (mobile) / px-6 py-4 (desktop)
        "px-4 py-3 md:px-6 md:py-4"
    ];

    const styles = variant === "primary"
        ? [
            "bg-gradient-to-r from-brand-start to-brand-end text-white",
            "shadow-soft-1 md:shadow-soft hover:shadow-hover"
        ]
        : [
            "shadow-soft-1 md:shadow-soft hover:shadow-hover",
            "bg-white text-deep-navy"
        ];
    return (
        <div
            ref={ref}
            className={[...base, ...styles, className].filter(Boolean).join(" ")}
            {...props}
        >
            {header ? <div className="mb-3">{header}</div> : null}
            <div>{children}</div>
            {footer ? <div className="mt-4">{footer}</div> : null}
        </div>
    );
}

const _Card = React.forwardRef(Card);

export default _Card;
export { _Card as Card };
