"use client";

import React from "react";

interface AppLoaderProps {
  message?: string;
}

export function AppLoader({
  message = "Loading application...",
}: AppLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
