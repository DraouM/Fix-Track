"use client";

import { useEffect, useRef, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { RefreshCw, Download, ArrowUpCircle, X } from "lucide-react";

export function Updater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("Initializing...");
  const modalRef = useRef<HTMLDivElement | null>(null);

  // A transport failure means the request never received an HTTP reply: DNS, TLS,
  // connection reset or offline. Typically transient (or raw.githubusercontent.com
  // being blocked on the current network), so always offer a retry.
  function describeError(errMsg: string) {
    if (
      /error sending request|dns error|connection refused|tls handshake|timed out|network/i.test(
        errMsg,
      )
    ) {
      return "Could not reach the update server. Check your internet connection (raw.githubusercontent.com may need a VPN/proxy on this network).";
    }
    if (/invalid key|signature/i.test(errMsg)) {
      return "Update package signature is invalid. Do not install this build.";
    }
    return errMsg;
  }

  // Only check when running in Tauri environment
  async function checkForUpdates() {
    if (
      typeof window === "undefined" ||
      !("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
    ) {
      setDebugInfo("Not running in Tauri environment");
      return;
    }

    try {
      setChecking(true);
      setError(null);
      setDebugInfo("Checking for updates...");
      const availableUpdate = await check();
      if (availableUpdate) {
        setDebugInfo(`Update found: ${availableUpdate.version}`);
        setUpdate(availableUpdate);
      } else {
        setDebugInfo("No update available (already on latest)");
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error("Failed to check for updates:", err);
      setDebugInfo(`Error: ${errMsg}`);
      setError(describeError(errMsg));
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkForUpdates();
  }, []);

  // Install with progress tracking
  async function installUpdate() {
    if (!update) return;
    try {
      setDownloading(true);
      setError(null);

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case "Finished":
            setProgress(100);
            break;
        }
      });

      // Relaunch after successful install
      await relaunch();
    } catch (err: any) {
      console.error("Failed to install update:", err);
      setError(describeError(err?.message || "Failed to download update"));
      setDownloading(false);
    }
  }

  // Keyboard accessibility: close modal with Escape unless installing
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !downloading) setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, downloading]);

  // Notes/body fallback helper - Tauri's Update may expose notes in different fields
  const getNotes = (u: Update) => {
    // Some updater feeds use `notes`, others `body` — support both
    return (
      (u as any).notes || u.body || "Performance improvements and bug fixes."
    );
  };

  // If no update found yet, show a subtle debug banner in dev; in prod this is hidden
  if (!update) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-yellow-500/30 bg-yellow-950/90 p-3 shadow-lg text-yellow-200 text-xs font-mono">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="font-bold">🔍 Updater</div>
          <button
            onClick={checkForUpdates}
            disabled={checking}
            className="flex items-center gap-1 rounded border border-yellow-500/40 px-1.5 py-0.5 text-yellow-100 transition hover:bg-yellow-900/60 disabled:opacity-50"
            aria-label="Re-check for updates"
          >
            <RefreshCw className={checking ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
        <div>{debugInfo}</div>
        {checking && <div className="mt-1 animate-pulse">⏳ Checking...</div>}
        {error && <div className="mt-1 text-red-400">❌ {error}</div>}
      </div>
    );
  }

  // When update exists, show a small bottom-corner banner; clicking opens modal
  return (
    <>
      {/* Notification Banner */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800">
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">
              New Version Ready
            </p>
            <p className="text-sm font-bold text-white">
              Fixary {update.version}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="ml-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition"
            aria-label={`View details for version ${update.version}`}
          >
            What's New?
          </button>
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="updater-title"
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                  Update Available
                </span>
                <h2
                  id="updater-title"
                  className="text-xl font-bold mt-2 text-slate-900 dark:text-white"
                >
                  Fixary {update.version}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Published: {update.date ? String(update.date) : "Unknown"}
                </p>
              </div>
              {!downloading && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
                  aria-label="Close update dialog"
                >
                  <X />
                </button>
              )}
            </div>

            <div className="my-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                What's New in this Release
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed">
                {getNotes(update)}
              </div>
            </div>

            {/* Progress */}
            {downloading && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Downloading update...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

            <div className="flex justify-end gap-3 mt-6">
              {!downloading && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Remind Me Later
                </button>
              )}
              <button
                onClick={installUpdate}
                disabled={downloading}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded-xl shadow-lg transition flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <RefreshCw className="animate-spin" /> Installing...
                  </>
                ) : (
                  <>
                    <Download /> Update Now & Restart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
