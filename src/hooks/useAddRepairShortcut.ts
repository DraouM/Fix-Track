"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Event dispatched on `window` when the Add-New-Repair shortcut fires while
 * the Repairs page is already mounted (its listener consumes it immediately).
 */
export const OPEN_NEW_REPAIR_EVENT = "app:open-new-repair";

/**
 * sessionStorage flag kept when the shortcut fires from another page: the
 * Repairs page consumes it on mount, bridging the async navigation.
 */
export const PENDING_NEW_REPAIR_KEY = "fixary:pending-new-repair";

/**
 * Global shortcut: Ctrl+Shift+N (Windows/Linux) / Cmd+Shift+N (macOS)
 * opens the "Add New Repair" dialog, identical to clicking the Add Repair
 * button on the Repairs page. Works from any page, dialog or focused input
 * (capture-phase listener). No other browser shortcuts are intercepted.
 */
export function useAddRepairShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isAddRepairShortcut =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        !e.altKey &&
        e.key.toLowerCase() === "n";

      if (!isAddRepairShortcut) return;

      e.preventDefault();
      e.stopPropagation();

      // Remember the intent so the Repairs page can pick it up after navigation
      try {
        sessionStorage.setItem(PENDING_NEW_REPAIR_KEY, "1");
      } catch {
        // Private mode / storage disabled: fall back to the event only
      }

      router.push("/repairs");

      // If the Repairs page is already mounted, its listener fires now and
      // clears the pending flag; otherwise it is consumed on mount.
      window.dispatchEvent(new CustomEvent(OPEN_NEW_REPAIR_EVENT));
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [router]);
}
