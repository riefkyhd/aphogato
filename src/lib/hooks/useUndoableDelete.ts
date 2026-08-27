"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

type UndoOptions<T> = {
  /** Called immediately to remove the item from local state (optimistic). */
  optimisticRemove: () => void;
  /** Called if user hits Undo before the timeout. Should restore local state. */
  restore: () => void;
  /** Called after timeout expires. Should perform the server delete. */
  commit: () => Promise<T> | T;
  /** Toast message. */
  message?: string;
  /** Milliseconds until commit fires. */
  timeoutMs?: number;
  /** Called if commit throws. */
  onError?: (error: unknown) => void;
};

/**
 * Optimistic delete with a Sonner undo toast. Removes locally, shows a
 * countdown toast, and only calls the server after the timeout expires.
 * If the user taps Undo, the local state is restored and no server call
 * happens.
 */
export function useUndoableDelete() {
  const activeTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const cancelAll = useCallback(() => {
    activeTimers.current.forEach((t) => clearTimeout(t));
    activeTimers.current.clear();
  }, []);

  const trigger = useCallback(<T,>(opts: UndoOptions<T>) => {
    const timeoutMs = opts.timeoutMs ?? 5000;
    let undone = false;

    opts.optimisticRemove();

    const timer = setTimeout(async () => {
      activeTimers.current.delete(timer);
      if (undone) return;
      try {
        await opts.commit();
      } catch (error) {
        opts.restore();
        opts.onError?.(error);
        toast.error("Couldn't delete. Please try again.");
      }
    }, timeoutMs);

    activeTimers.current.add(timer);

    toast(opts.message ?? "Deleted", {
      duration: timeoutMs,
      action: {
        label: "Undo",
        onClick: () => {
          if (undone) return;
          undone = true;
          clearTimeout(timer);
          activeTimers.current.delete(timer);
          opts.restore();
        },
      },
    });
  }, []);

  return { trigger, cancelAll };
}
