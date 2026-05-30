"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

type SubmitButtonProps = ComponentProps<"button"> & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : children}
    </button>
  );
}
