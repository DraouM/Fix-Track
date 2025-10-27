import { useState, useEffect, useCallback } from "react";

interface AsyncInitializeState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface AsyncInitializeActions<T> {
  initialize: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  reset: () => void;
}

type UseAsyncInitializeReturn<T> = AsyncInitializeState<T> &
  AsyncInitializeActions<T>;

export function useAsyncInitialize<T>(
  initFunction: () => Promise<T>,
  dependencies: any[] = []
): UseAsyncInitializeReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  const initialize = useCallback(async () => {
    if (initialized) return;

    setLoading(true);
    setError(null);

    try {
      const result = await initFunction();
      setData(result);
      setInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [initFunction, initialized, ...dependencies]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setInitialized(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    data,
    loading,
    error,
    initialized,
    initialize,
    setData,
    reset,
  };
}
