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

export type EntityWindowType = "client" | "supplier";
export type EntityWindowMode = "ledger" | "detail";

/**
 * Opens an entity (client or supplier) ledger or detail view in a dedicated native window.
 *
 * @param entityType "client" or "supplier"
 * @param entityId The entity ID passed to the target page as a query param.
 * @param mode "ledger" or "detail" (default is "ledger")
 * @returns `true` if a native Tauri window was created/focused, `false` when
 *          not running in Tauri (caller should fall back to in-app navigation).
 */
export async function openEntityWindow(
  entityType: EntityWindowType,
  entityId: string,
  mode: EntityWindowMode = "ledger"
): Promise<boolean> {
  if (!isTauri()) return false;

  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const label = `${entityType}-${mode}-${entityId}`;
  const routePrefix = entityType === "client" ? "clients" : "suppliers";
  const url = `/${routePrefix}/${mode}/?id=${encodeURIComponent(entityId)}`;

  // Also check legacy client ledger label for backward compatibility
  const legacyLabel =
    entityType === "client" && mode === "ledger" ? `ledger-${entityId}` : null;

  let existing = await WebviewWindow.getByLabel(label);
  if (!existing && legacyLabel) {
    existing = await WebviewWindow.getByLabel(legacyLabel);
  }

  if (existing) {
    try {
      await existing.setFocus();
      return true;
    } catch (err) {
      console.error(
        `Failed to focus existing ${entityType} ${mode} window:`,
        err
      );
    }
  }

  const title =
    mode === "ledger"
      ? entityType === "client"
        ? "Financial Ledger"
        : "Operational Ledger"
      : entityType === "client"
      ? "Client Profile"
      : "Supplier Profile";

  const win = new WebviewWindow(label, {
    url,
    title,
    width: 1200,
    height: 800,
    resizable: true,
    focus: true,
  });

  win.once("tauri://error", (e) => {
    console.error(`Failed to open ${entityType} ${mode} window:`, e);
  });

  return true;
}

/**
 * Opens the client financial ledger in a dedicated native window.
 *
 * @param clientId The client id passed to the ledger page as a query param.
 * @returns `true` if a native Tauri window was created/focused, `false` when
 *          not running in Tauri (caller should fall back to in-app navigation).
 */
export async function openLedgerWindow(clientId: string): Promise<boolean> {
  return openEntityWindow("client", clientId, "ledger");
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
