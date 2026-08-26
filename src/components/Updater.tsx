"use client";

import { useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { RefreshCw, Download, ArrowUpCircle } from "lucide-react";

export function Updater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  async function checkForUpdates() {
    try {
      setChecking(true);
      setError(null);
      const availableUpdate = await check();
      if (availableUpdate) {
        setUpdate(availableUpdate);
      }
    } catch (err: any) {
      console.error("Failed to check for updates:", err);
      // Quiet fail if not in Tauri environment or network issue
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkForUpdates();
  }, []);

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
            break;
        }
      });

      await relaunch();
    } catch (err: any) {
      console.error("Failed to install update:", err);
      setError(err?.message || "Failed to download update");
      setDownloading(false);
    }
  }

  if (!update) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg text-card-foreground">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <ArrowUpCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Update Available</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Version {update.version} is ready to install.
          </p>
          
          {update.body && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {update.body}
            </p>
          )}

          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={installUpdate}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Downloading {progress > 0 ? `${progress}%` : "..."}
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Update & Relaunch
                </>
              )}
            </button>
            <button
              onClick={() => setUpdate(null)}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
