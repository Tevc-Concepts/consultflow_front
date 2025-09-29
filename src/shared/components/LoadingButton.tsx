"use client";

import * as React from "react";
import Button from "@components/ui/Button";
import Spinner from "./Spinner";

export interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingLabel?: string;
  spinnerSize?: "xs" | "sm" | "md" | "lg";
}

export default function LoadingButton({
  loading = false,
  loadingLabel,
  spinnerSize = "sm",
  disabled,
  children,
  ...rest
}: LoadingButtonProps) {
  return (
    <Button {...rest} disabled={disabled || loading}>
      {loading ? <Spinner size={spinnerSize} label={loadingLabel} /> : children}
    </Button>
  );
}
