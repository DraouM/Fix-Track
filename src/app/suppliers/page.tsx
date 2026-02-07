import SuppliersPageClient from "@/components/suppliers/SupplierPageClient";
import { Suspense } from "react";

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div>Loading Suppliers...</div>}>
      <SuppliersPageClient />
    </Suspense>
  );
}
