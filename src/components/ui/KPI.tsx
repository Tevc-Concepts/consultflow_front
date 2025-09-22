import * as React from "react";

/**
 * KPI component
 *
 * Shows a compact metric with label, delta percentage, and a sparkline placeholder.
 * Optimized for mobile.
 *
 * Example:
 * ```tsx
 * import KPI from "@/components/ui/KPI";
 *
 * export default function Example() {
 *   return (
 *     <div className="grid grid-cols-2 gap-4">
 *       <KPI label="Revenue" value="$120k" delta={12.3} />
 *       <KPI label="Burn Rate" value="$-45k" delta={-3.5} />
 *     </div>
 *   );
 * }
 * ```
 */

export interface KPIProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Label for the metric */
    label: string;
    /** Display value */
    value: string | number;
    /** Change percentage (positive or negative) */
    delta?: number;
    /** Optional sparkline node (if you want to render a chart) */
    spark?: React.ReactNode;
    /** Optional leading icon (rendered inside a circular gradient badge) */
    icon?: React.ReactNode;
}

function formatDelta(delta?: number) {
    if (delta == null) return null;
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}%`;
}

function KPI({ label, value, delta, spark, icon, className, ...props }: KPIProps, ref: React.Ref<HTMLDivElement>) {
    const positive = (delta ?? 0) > 0;
    const negative = (delta ?? 0) < 0;

    return (
        <div
            ref={ref}
            className={[
                // KPI chip: white, subtle border, soft shadow, responsive spacing
                "rounded-2xl border border-medium/60 bg-white px-4 py-3 md:px-6 md:py-4",
                "shadow-soft-1",
                className
            ].filter(Boolean).join(" ")}
            {...props}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {icon ? (
                        <div aria-hidden className="h-9 w-9 rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white grid place-items-center shadow-soft-1">
                            <span className="opacity-90">{icon}</span>
                        </div>
                    ) : null}
                    <div>
                        <div className="text-xs text-deep-navy/70">{label}</div>
                        <div className="text-lg md:text-xl font-semibold text-deep-navy">{value}</div>
                    </div>
                </div>
                <div
                    className={[
                        "text-xs rounded-full px-2 py-0.5 font-medium",
                        positive && "bg-emerald/20 text-forest-green",
                        negative && "bg-coral/20 text-coral",
                        !positive && !negative && "bg-medium/30 text-deep-navy/80"
                    ].filter(Boolean).join(" ")}
                    aria-label="change percentage"
                >
                    {formatDelta(delta) ?? "–"}
                </div>
            </div>
            <div className="mt-2 h-8">
                {spark ?? (
                    <div
                        aria-hidden
                        className="h-full w-full rounded-md bg-gradient-to-r from-emerald/30 via-cobalt/30 to-violet/30"
                        title="sparkline placeholder"
                    />
                )}
            </div>
        </div>
    );
}

const _KPI = React.forwardRef(KPI);

export default _KPI;
export { _KPI as KPI };
