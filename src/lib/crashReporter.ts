/**
 * Crash Reporter Utility
 *
 * This utility helps capture and report application crashes to prevent
 * unexpected terminations and provide better debugging information.
 */

// Type definitions
interface CrashReport {
  timestamp: string;
  error: string;
  stack?: string;
  component?: string;
  userAgent: string;
  url: string;
  additionalInfo?: Record<string, any>;
}

interface CrashReporterConfig {
  maxReports: number;
  reportToServer: boolean;
  consoleLogging: boolean;
}

// Default configuration
const DEFAULT_CONFIG: CrashReporterConfig = {
  maxReports: 10,
  reportToServer: false,
  consoleLogging: true,
};

// In-memory storage for crash reports
const crashReports: CrashReport[] = [];

/**
 * Initialize the crash reporter
 * @param config Configuration options
 */
export function initCrashReporter(config: Partial<CrashReporterConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Set up global error handlers
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      handleGlobalError(event.error, "Global Error", finalConfig);
    });

    window.addEventListener("unhandledrejection", (event) => {
      handleGlobalError(
        event.reason,
        "Unhandled Promise Rejection",
        finalConfig
      );
    });
  }

  if (finalConfig.consoleLogging) {
    console.log("Crash reporter initialized");
  }
}

/**
 * Handle global errors
 * @param error The error object
 * @param component Component or context where error occurred
 * @param config Configuration
 */
function handleGlobalError(
  error: any,
  component: string,
  config: CrashReporterConfig
) {
  const report: CrashReport = {
    timestamp: new Date().toISOString(),
    error: error?.message || String(error),
    stack: error?.stack,
    component,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    url: typeof window !== "undefined" ? window.location.href : "Unknown",
  };

  // Store the report
  crashReports.push(report);

  // Limit the number of stored reports
  if (crashReports.length > config.maxReports) {
    crashReports.shift();
  }

  // Log to console if enabled
  if (config.consoleLogging) {
    console.error(`Crash Report [${component}]:`, report);
  }

  // Report to server if enabled
  if (config.reportToServer) {
    reportToServer(report).catch((err) => {
      if (config.consoleLogging) {
        console.error("Failed to report crash to server:", err);
      }
    });
  }
}

/**
 * Report a crash to the server
 * @param report Crash report data
 */
async function reportToServer(report: CrashReport): Promise<void> {
  // In a real implementation, this would send the report to your server
  // For now, we'll just log it
  console.log("Reporting crash to server:", report);

  // Example implementation:
  /*
  try {
    await fetch('/api/crash-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
  } catch (error) {
    throw new Error(`Failed to report crash: ${error}`);
  }
  */
}

/**
 * Report a specific error
 * @param error The error to report
 * @param component Component or context where error occurred
 * @param additionalInfo Additional information to include
 */
export function reportError(
  error: Error,
  component?: string,
  additionalInfo?: Record<string, any>
) {
  handleGlobalError(
    {
      message: error.message,
      stack: error.stack,
    },
    component || "Manual Report",
    DEFAULT_CONFIG
  );
}

/**
 * Get all stored crash reports
 * @returns Array of crash reports
 */
export function getCrashReports(): CrashReport[] {
  return [...crashReports];
}

/**
 * Clear all stored crash reports
 */
export function clearCrashReports(): void {
  crashReports.length = 0;
}

/**
 * Wrap a function with crash reporting
 * @param fn Function to wrap
 * @param component Component name for reporting
 * @returns Wrapped function
 */
export function withCrashReporting<T extends (...args: any[]) => any>(
  fn: T,
  component: string
): (...args: Parameters<T>) => ReturnType<T> {
  return function (...args: Parameters<T>): ReturnType<T> {
    try {
      return fn(...args);
    } catch (error) {
      reportError(error as Error, component);
      throw error;
    }
  };
}

// Initialize the crash reporter
initCrashReporter();

// Export default
export default {
  initCrashReporter,
  reportError,
  getCrashReports,
  clearCrashReports,
  withCrashReporting,
};
