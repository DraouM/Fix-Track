"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Event dispatched on `window` when the Add-New-Item shortcut fires while
 * the Inventory page is already mounted (its listener consumes it immediately).
 */
export const OPEN_NEW_ITEM_EVENT = "app:open-new-item";

/**
 * sessionStorage flag kept when the shortcut fires from another page: the
 * Inventory page consumes it on mount, bridging the async navigation.
 */
export const PENDING_NEW_ITEM_KEY = "fixary:pending-new-item";

/**
 * Global shortcut: Ctrl+Shift+A (Windows/Linux) / Cmd+Shift+A (macOS)
 * opens the "Add Item" dialog, identical to clicking the Add Item button
 * on the Inventory page. Works from any page, dialog or focused input
 * (capture-phase listener). No other browser shortcuts are intercepted.
 */
export function useAddItemShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isAddItemShortcut =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        !e.altKey &&
        e.key.toLowerCase() === "a";

      if (!isAddItemShortcut) return;

      e.preventDefault();
      e.stopPropagation();

      // Remember the intent so the Inventory page can pick it up after navigation
      try {
        sessionStorage.setItem(PENDING_NEW_ITEM_KEY, "1");
      } catch {
        // Private mode / storage disabled: fall back to the event only
      }

      router.push("/inventory");

      // If the Inventory page is already mounted, its listener fires now and
      // clears the pending flag; otherwise it is consumed on mount.
      window.dispatchEvent(new CustomEvent(OPEN_NEW_ITEM_EVENT));
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [router]);
}
