"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import { DataTable } from "@/components/ui/data-table";
import { supplierColumns } from "./supplier-columns";
import { Supplier } from "@/types/supplier";

interface SupplierTableProps {
  onEdit: (supplier: Supplier) => void;
}

export function SupplierTable({ onEdit }: SupplierTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  return (
    <DataTable
      columns={supplierColumns({ onEdit })}
      data={suppliers}
      isLoading={isLoading}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder="Search suppliers..."
    />
  );
}
