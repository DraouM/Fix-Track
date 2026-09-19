// Helpers for opening secondary windows in the Tauri desktop app.
// In a browser (e.g. `npm run dev` / web preview) these fall back so the
// feature keeps working; in Tauri they use the native WebviewWindow API
// because browser popups (`window.open`) are not reliable there.

/** Returns true when running inside the Tauri desktop runtime. */
export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

/**
 * Opens the client financial ledger in a dedicated native window.
 *
 * @param clientId The client id passed to the ledger page as a query param.
 * @returns `true` if a native Tauri window was created/focused, `false` when
 *          not running in Tauri (caller should fall back to in-app navigation).
 */
export async function openLedgerWindow(clientId: string): Promise<boolean> {
  if (!isTauri()) return false;

  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const label = `ledger-${clientId}`;
  const url = `/clients/ledger/?id=${encodeURIComponent(clientId)}`;

  // Reuse + focus the window if one is already open for this client.
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    try {
      await existing.setFocus();
      return true;
    } catch (err) {
      console.error("Failed to focus existing ledger window:", err);
    }
  }

  const win = new WebviewWindow(label, {
    url,
    title: "Financial Ledger",
    width: 1200,
    height: 800,
    resizable: true,
    focus: true,
  });

  win.once("tauri://error", (e) => {
    console.error("Failed to open ledger window:", e);
  });

  return true;
}

/**
 * Requests the current window to close. In a native Tauri window this closes
 * the OS window; otherwise it falls back to `window.close()` (popups) and
 * finally to `history.back()` for normal tab navigation.
 */
export async function closeCurrentWindow(): Promise<void> {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
      return;
    } catch (err) {
      console.error("Failed to close Tauri window:", err);
    }
  }

  if (typeof window !== "undefined" && window.opener) {
    window.close();
    return;
  }

  window.history.back();
}
