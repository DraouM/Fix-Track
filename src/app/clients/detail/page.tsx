"use client";

import { ClientDetail } from "@/components/clients/ClientDetail";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ClientDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive font-bold">Error: Client ID is required</p>
      </div>
    );
  }

  return <ClientDetail clientId={id} />;
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading client details...</p>
      </div>
    }>
      <ClientDetailContent />
    </Suspense>
  );
}
