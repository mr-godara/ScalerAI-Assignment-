"use client";

import { useEffect, useCallback, useRef } from "react";

export type ShortcutAction = {
  key: string | string[]; // Single key like "Escape" or sequence like ["g", "h"]
  action: () => void;
  description: string;
  category?: string;
  preventInput?: boolean; // If true (default), don't trigger when an input is focused.
  ctrl?: boolean; // Requires Ctrl or Cmd to be pressed
};

export const useKeyboardShortcuts = (shortcuts: ShortcutAction[]) => {
  const sequenceBuffer = useRef<string[]>([]);
  const sequenceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      const key = event.key;

      // Add to sequence buffer
      sequenceBuffer.current.push(key);
      if (sequenceTimer.current) clearTimeout(sequenceTimer.current);

      sequenceTimer.current = setTimeout(() => {
        sequenceBuffer.current = [];
      }, 1000);

      for (const s of shortcuts) {
        const prevent = s.preventInput !== false; // Default is true

        if (isInputFocused && prevent) {
          continue;
        }

        if (Array.isArray(s.key)) {
          // Check if sequence matches exactly
          if (sequenceBuffer.current.length === s.key.length) {
            const seqMatch = s.key.every(
              (k, i) => sequenceBuffer.current[i] === k
            );
            if (seqMatch) {
              event.preventDefault();
              s.action();
              sequenceBuffer.current = [];
              break;
            }
          }
        } else {
          // Single key
          if (key === s.key) {
            // Check modifier
            if (s.ctrl && !(event.ctrlKey || event.metaKey)) {
              continue; // Modifier not pressed, but required
            }
            if (!s.ctrl && (event.ctrlKey || event.metaKey)) {
              // If not specified, but user is pressing Ctrl/Cmd, skip so we don't block normal shortcuts
              continue;
            }
            
            // For single keys, only preventDefault if it's not a generic key that might break input
            event.preventDefault();
            s.action();
            sequenceBuffer.current = [];
            break;
          }
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
};
