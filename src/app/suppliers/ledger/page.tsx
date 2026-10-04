"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SupplierLedgerPageClient } from "@/components/suppliers/SupplierLedgerPageClient";

function SupplierLedgerContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fbfcfd] dark:bg-slate-950">
        <p className="text-destructive font-bold">Error: Supplier ID is required</p>
      </div>
    );
  }

  return <SupplierLedgerPageClient supplierId={id} />;
}

export default function SupplierLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfcfd] dark:bg-slate-950">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
          <p className="text-muted-foreground font-bold">
            Loading Supplier Financial Ledger...
          </p>
        </div>
      }
    >
      <SupplierLedgerContent />
    </Suspense>
  );
}
