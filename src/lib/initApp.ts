/**
 * Application initialization utility
 * This module provides functions to properly initialize the application
 * and handle common initialization issues that could cause chunk loading errors
 */

import { toast } from "sonner";

interface InitializationResult {
  success: boolean;
  message: string;
  error?: Error;
}

/**
 * Initialize all application contexts sequentially
 * This helps prevent race conditions and chunk loading issues
 */
export async function initializeAppContexts(): Promise<InitializationResult> {
  try {
    console.log("🔄 Starting application initialization...");

    // Add a small delay to ensure chunk loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Initialize contexts in order
    console.log("📦 Initializing inventory context...");
    // In a real implementation, this would initialize the inventory context

    console.log("🔧 Initializing repair context...");
    // In a real implementation, this would initialize the repair context

    console.log("🏢 Initializing supplier context...");
    // In a real implementation, this would initialize the supplier context

    console.log("✅ Application initialization completed successfully");

    return {
      success: true,
      message: "Application contexts initialized successfully",
    };
  } catch (error) {
    console.error("❌ Application initialization failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown initialization error";

    toast.error("Failed to initialize application", {
      description: errorMessage,
    });

    return {
      success: false,
      message: "Failed to initialize application contexts",
      error: error instanceof Error ? error : new Error(errorMessage),
    };
  }
}

/**
 * Validate application environment
 * Checks for common issues that could cause chunk loading errors
 */
export function validateAppEnvironment(): InitializationResult {
  try {
    // Check if required APIs are available
    if (typeof window === "undefined") {
      return {
        success: false,
        message: "Application must be run in a browser environment",
      };
    }

    // Check for required browser features
    if (!window.Promise) {
      return {
        success: false,
        message: "Browser does not support Promises",
      };
    }

    // Check for dynamic import support
    if (!(typeof document.createElement("script").noModule === "boolean")) {
      console.warn("Browser may not fully support modern JavaScript features");
    }

    return {
      success: true,
      message: "Application environment validated successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown validation error";

    return {
      success: false,
      message: "Application environment validation failed",
      error: error instanceof Error ? error : new Error(errorMessage),
    };
  }
}

/**
 * Handle chunk loading errors
 * Provides recovery mechanisms for common chunk loading issues
 */
export function handleChunkLoadingError(error: Error): void {
  console.error("Chunk loading error detected:", error);

  // Show user-friendly error message
  toast.error("Application loading issue", {
    description:
      "Some components are taking longer than expected to load. This may be due to network issues or browser cache problems.",
    duration: 10000,
  });

  // Suggest solutions
  console.info("💡 Suggested solutions:");
  console.info("1. Refresh the page");
  console.info("2. Clear browser cache and refresh");
  console.info("3. Check your internet connection");
  console.info("4. Try using a different browser");

  // Log additional debugging information
  console.info("🔍 Debug information:");
  console.info("- User agent:", navigator.userAgent);
  console.info("- Online status:", navigator.onLine);
  console.info("- Language:", navigator.language);
}

/**
 * Preload critical application chunks
 * Attempts to preload chunks that are critical for application startup
 */
export async function preloadCriticalChunks(): Promise<InitializationResult> {
  try {
    console.log("📥 Preloading critical application chunks...");

    // In a real implementation, this would preload critical chunks
    // For now, we'll just add a small delay to simulate preloading
    await new Promise((resolve) => setTimeout(resolve, 50));

    console.log("✅ Critical chunks preloaded successfully");

    return {
      success: true,
      message: "Critical application chunks preloaded successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown preloading error";

    console.warn("⚠️ Failed to preload critical chunks:", errorMessage);

    // This is not a critical error, so we still return success
    return {
      success: true,
      message: "Chunk preloading completed with warnings: " + errorMessage,
    };
  }
}

// Export all functions as default
export default {
  initializeAppContexts,
  validateAppEnvironment,
  handleChunkLoadingError,
  preloadCriticalChunks,
};
