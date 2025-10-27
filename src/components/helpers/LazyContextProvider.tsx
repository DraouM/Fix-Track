"use client";

import React, { useState, useEffect } from "react";

interface LazyContextProviderProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LazyContextProvider({
  children,
  loadingFallback = (
    <div className="h-screen flex items-center justify-center">Loading...</div>
  ),
  errorFallback = (
    <div className="h-screen flex items-center justify-center">
      Error loading context
    </div>
  ),
}: LazyContextProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate async initialization
  useEffect(() => {
    // In a real implementation, this would be replaced with actual initialization logic
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    return <>{errorFallback}</>;
  }

  return <>{children}</>;
}
