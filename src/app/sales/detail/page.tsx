"use client";

import { SaleDetailClient } from "@/components/clients/SaleDetailClient";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SaleDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive font-bold">Error: Sale ID is required</p>
      </div>
    );
  }

  return <SaleDetailClient saleId={id} />;
}

export default function SaleDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading sale details...</p>
      </div>
    }>
      <SaleDetailContent />
    </Suspense>
  );
}
