import { useState, useCallback, useEffect } from "react";

interface ContextInitializerState {
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface ContextInitializerActions {
  initialize: () => Promise<void>;
  reset: () => void;
}

type ContextInitializerReturn = ContextInitializerState &
  ContextInitializerActions;

export function useContextInitializer(
  initFunction: () => Promise<void>,
  dependencies: any[] = []
): ContextInitializerReturn {
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (initialized) return;

    setLoading(true);
    setError(null);

    try {
      await initFunction();
      setInitialized(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize";
      setError(errorMessage);
      console.error("Context initialization error:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [initFunction, initialized, ...dependencies]);

  const reset = useCallback(() => {
    setLoading(false);
    setInitialized(false);
    setError(null);
  }, []);

  // Initialize on mount with a slight delay to prevent blocking
  useEffect(() => {
    const initTimer = setTimeout(() => {
      initialize();
    }, 10);

    return () => clearTimeout(initTimer);
  }, [initialize]);

  return {
    loading,
    initialized,
    error,
    initialize,
    reset,
  };
}
