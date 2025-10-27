"use client";

import React, { useState, useEffect } from 'react';

interface ContextInitializerProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: (error: string) => React.ReactNode;
}

export function ContextInitializer({ 
  children, 
  loadingFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Initializing application...</p>
      </div>
    </div>
  ),
  errorFallback = (error: string) => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-6 bg-destructive/10 rounded-lg max-w-md">
        <h2 className="text-xl font-bold text-destructive mb-2">Initialization Error</h2>
        <p className="text-destructive/80 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Reload Application
        </button>
      </div>
    </div>
  )
}: ContextInitializerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple initialization simulation
  useEffect(() => {
    const init = async () => {
      try {
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize application';
        setError(errorMessage);
        console.error('Context initialization error:', errorMessage);
      }
    };
    
    init();
  }, []);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    return <>{typeof errorFallback === 'function' ? errorFallback(error) : errorFallback}</>;
  }

  return <>{children}</>;
}