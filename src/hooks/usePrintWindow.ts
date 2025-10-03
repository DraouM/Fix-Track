/**
 * Enhanced print window management hook with memory leak prevention
 */
import { useCallback, useRef } from "react";

interface PrintWindowConfig {
  title?: string;
  width?: number;
  height?: number;
  cleanup?: boolean;
}

export function usePrintWindow() {
  const activeWindows = useRef<Set<Window>>(new Set());

  const openPrintWindow = useCallback(
    (htmlContent: string, config: PrintWindowConfig = {}) => {
      const {
        title = "Print Document",
        width = 800,
        height = 600,
        cleanup = true,
      } = config;
      let printWindow: Window | null = null;
      let cleanupTimer: NodeJS.Timeout;
      let hasBeenCleaned = false;

      try {
        // Create print window with specific dimensions
        const features = `width=${width},height=${height},scrollbars=yes,resizable=yes`;
        printWindow = window.open("", "_blank", features);

        if (!printWindow) {
          throw new Error("Popup blocked or failed to open");
        }

        // Track active window
        activeWindows.current.add(printWindow);

        // Write content
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.document.title = title;

        const performCleanup = () => {
          if (!hasBeenCleaned && printWindow && !printWindow.closed) {
            hasBeenCleaned = true;
            activeWindows.current.delete(printWindow);
            clearTimeout(cleanupTimer);

            try {
              printWindow.close();
            } catch (error) {
              console.warn("Print window cleanup warning:", error);
            }
          }
        };

        // Set up print handling
        printWindow.onload = () => {
          if (!printWindow) return;

          try {
            printWindow.focus();
            printWindow.print();

            if (cleanup) {
              // Cleanup after a reasonable delay
              cleanupTimer = setTimeout(performCleanup, 2000);

              // Also cleanup when window is manually closed
              printWindow.onbeforeunload = performCleanup;
            }
          } catch (error) {
            console.error("Print execution error:", error);
            if (cleanup) performCleanup();
          }
        };

        // Fallback cleanup
        if (cleanup) {
          setTimeout(() => {
            if (!hasBeenCleaned && printWindow && !printWindow.closed) {
              console.warn("Print window cleanup fallback triggered");
              performCleanup();
            }
          }, 15000); // 15 second fallback
        }

        return {
          window: printWindow,
          cleanup: performCleanup,
        };
      } catch (error) {
        console.error("Print window error:", error);

        // Cleanup on error
        if (printWindow) {
          activeWindows.current.delete(printWindow);
          if (!printWindow.closed) {
            try {
              printWindow.close();
            } catch (cleanupError) {
              console.warn("Error cleanup warning:", cleanupError);
            }
          }
        }

        throw error;
      }
    },
    []
  );

  const closeAllWindows = useCallback(() => {
    activeWindows.current.forEach((window) => {
      if (!window.closed) {
        try {
          window.close();
        } catch (error) {
          console.warn("Bulk window cleanup warning:", error);
        }
      }
    });
    activeWindows.current.clear();
  }, []);

  // Cleanup all windows when component unmounts
  const cleanup = useCallback(() => {
    closeAllWindows();
  }, [closeAllWindows]);

  return {
    openPrintWindow,
    closeAllWindows,
    cleanup,
    activeWindowCount: activeWindows.current.size,
  };
}

/**
 * Hook for safe blob URL management
 */
export function useBlobUrl() {
  const activeBlobUrls = useRef<Set<string>>(new Set());

  const createBlobUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    activeBlobUrls.current.add(url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((url: string) => {
    try {
      URL.revokeObjectURL(url);
      activeBlobUrls.current.delete(url);
    } catch (error) {
      console.warn("Blob URL revocation warning:", error);
    }
  }, []);

  const revokeAllBlobUrls = useCallback(() => {
    activeBlobUrls.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn("Bulk blob URL revocation warning:", error);
      }
    });
    activeBlobUrls.current.clear();
  }, []);

  return {
    createBlobUrl,
    revokeBlobUrl,
    revokeAllBlobUrls,
    activeBlobCount: activeBlobUrls.current.size,
  };
}
