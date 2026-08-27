"use client";

import { useCallback, useState } from "react";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
  run: () => void | Promise<void>;
};

/**
 * Manage a single confirmation dialog per screen without per-action state.
 * Call `request(...)` with the target action; render `<ConfirmDialog>` with
 * `open`, `title`, `description`, `confirmLabel`, `destructive`, `onClose`,
 * `onConfirm` returned from the hook.
 */
export function useConfirmAction() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [confirming, setConfirming] = useState(false);

  const request = useCallback(
    (opts: {
      title: string;
      description: string;
      confirmLabel?: string;
      destructive?: boolean;
      run: () => void | Promise<void>;
    }) => {
      setState({
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Confirm",
        destructive: opts.destructive ?? false,
        run: opts.run,
      });
    },
    []
  );

  const close = useCallback(() => {
    if (confirming) return;
    setState(null);
  }, [confirming]);

  const confirm = useCallback(async () => {
    if (!state) return;
    setConfirming(true);
    try {
      await state.run();
      setState(null);
    } finally {
      setConfirming(false);
    }
  }, [state]);

  return {
    open: state !== null,
    title: state?.title ?? "",
    description: state?.description ?? "",
    confirmLabel: state?.confirmLabel ?? "Confirm",
    destructive: state?.destructive ?? false,
    confirming,
    request,
    close,
    confirm,
  };
}
