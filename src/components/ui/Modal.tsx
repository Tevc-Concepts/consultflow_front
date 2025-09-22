"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Modal (Dialog)
 *
 * Accessible modal dialog with focus trap and framer-motion animations.
 * - Closes on overlay click or Escape key (configurable)
 * - Traps focus within the dialog when open
 * - Renders to document.body by default
 *
 * Example:
 * ```tsx
 * import Modal from "@/components/ui/Modal";
 * import Button from "@/components/ui/Button";
 *
 * export default function Example() {
 *   const [open, setOpen] = React.useState(false);
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>Open modal</Button>
 *       <Modal open={open} onOpenChange={setOpen} title="Confirm action">
 *         <p>Are you sure?</p>
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */

export interface ModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when open state should change */
    onOpenChange: (open: boolean) => void;
    /** Title content for the dialog header */
    title?: React.ReactNode;
    /** Optional description */
    description?: React.ReactNode;
    /** Content of the dialog */
    children?: React.ReactNode;
    /** Disable closing via Escape key */
    disableEscapeClose?: boolean;
    /** Disable closing via overlay click */
    disableOverlayClose?: boolean;
    /** IDs for aria attributes (optional override) */
    labelledById?: string;
    describedById?: string;
}

export default function Modal({
    open,
    onOpenChange,
    title,
    description,
    children,
    disableEscapeClose,
    disableOverlayClose,
    labelledById,
    describedById
}: ModalProps) {
    const overlayRef = React.useRef<HTMLDivElement>(null);
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const titleId = React.useId();
    const descId = React.useId();

    // Close on Escape
    React.useEffect(() => {
        if (!open || disableEscapeClose) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, disableEscapeClose, onOpenChange]);

    // Focus trap
    React.useEffect(() => {
        if (!open) return;
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            if (focusable.length === 0) return;

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    (last || first).focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    (first || last).focus();
                }
            }
        };

        dialog.addEventListener("keydown", handleKeyDown);
        // move focus to dialog
        (first || dialog).focus();

        return () => dialog.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    // Prevent background scroll when open
    React.useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open ? (
                <div aria-live="assertive" className="fixed inset-0 z-50">
                    {/* Overlay */}
                    <motion.div
                        ref={overlayRef}
                        aria-hidden
                        className="fixed inset-0 bg-black/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            if (!disableOverlayClose) onOpenChange(false);
                        }}
                    />

                    {/* Dialog */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledById ?? titleId}
                        aria-describedby={describedById ?? descId}
                        tabIndex={-1}
                        ref={dialogRef}
                        className="fixed inset-0 flex items-end md:items-center justify-center p-4"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                    >
                        <div className="w-full max-w-lg rounded-2xl bg-white p-4 md:p-6 shadow-soft">
                            {title ? (
                                <h2 id={labelledById ?? titleId} className="text-lg font-semibold text-deep-navy">
                                    {title}
                                </h2>
                            ) : null}
                            {description ? (
                                <p id={describedById ?? descId} className="mt-1 text-sm text-deep-navy/80">
                                    {description}
                                </p>
                            ) : null}
                            <div className="mt-3">{children}</div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded-full px-3 py-2 text-sm text-deep-navy hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            ) : null}
        </AnimatePresence>
    );
}
