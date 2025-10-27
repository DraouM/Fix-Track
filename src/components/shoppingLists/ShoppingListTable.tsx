"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ShoppingListForm } from "./ShoppingListForm";
import { columns } from "./shopping-list-columns";
import type { ShoppingListItem } from "@/types/shopping-list";

interface ShoppingListTableProps {
  items: ShoppingListItem[];
}

export function ShoppingListTable({ items }: ShoppingListTableProps) {
  const [data, setData] = useState<ShoppingListItem[]>(items);

  const refreshData = async () => {
    // TODO: Implement API call to refresh data
    try {
      const response = await fetch("/api/shopping-list");
      if (!response.ok) throw new Error("Failed to fetch items");
      const freshData = await response.json();
      setData(freshData);
    } catch (error) {
      console.error("Error refreshing shopping list data:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shopping List</h2>
        <ShoppingListForm onSuccess={refreshData}>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </ShoppingListForm>
      </div>
      <DataTable columns={columns} data={data} searchField="name" />
    </div>
  );
}
