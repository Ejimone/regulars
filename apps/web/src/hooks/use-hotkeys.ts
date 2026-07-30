"use client";

import { useEffect, useRef } from "react";

type HotkeyHandler = (event: KeyboardEvent) => void;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

/** Bind a global keyboard shortcut.
 *
 * `combo` examples: "k+meta" (⌘K / Ctrl+K — meta matches ctrl too), "j", "/",
 * "enter+meta". Plain-key combos are suppressed while the user is typing in a
 * form field; meta combos always fire. */
export function useHotkey(combo: string, handler: HotkeyHandler, enabled = true) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const parts = combo.toLowerCase().split("+");
    const key = parts.find((p) => p !== "meta" && p !== "shift") ?? "";
    const needsMeta = parts.includes("meta");
    const needsShift = parts.includes("shift");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key) return;
      const hasMeta = event.metaKey || event.ctrlKey;
      if (needsMeta !== hasMeta) return;
      if (needsShift !== event.shiftKey) return;
      if (!needsMeta && isTypingTarget(event.target)) return;
      handlerRef.current(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled]);
}
