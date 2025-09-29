"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger" | "ghost";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md">
            <div className="mb-2 flex items-start justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600">{description}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onCancel} disabled={loading}>
                {cancelText}
              </Button>
              <Button
                onClick={onConfirm}
                className={confirmVariant === "danger" ? "bg-red-600 hover:bg-red-700" : ""}
                disabled={loading}
              >
                {loading ? 'Processing…' : confirmText}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
