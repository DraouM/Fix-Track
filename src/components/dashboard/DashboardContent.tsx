"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Package,
  Wrench,
  DollarSign,
  HelpCircle,
} from "lucide-react";

interface InventoryItem {
  id: string;
  item_name: string;
  phone_brand: string;
  item_type: string;
  buying_price: number;
  selling_price: number;
  quantity_in_stock?: number;
  low_stock_threshold?: number;
  supplier_info?: string;
}

interface DashboardContentProps {
  items: InventoryItem[];
  loading: boolean;
  error: string;
  success: string;
  onInitDatabase: () => void;
  onAddTestItem: () => void;
  onLoadItems: () => void;
  onDeleteItem: (itemId: string) => void;
}

export function DashboardContent({
  items,
  loading,
  error,
  success,
  onInitDatabase,
  onAddTestItem,
  onLoadItems,
  onDeleteItem,
}: DashboardContentProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded-full bg-red-500" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded-full bg-green-500" />
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Database Status Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-blue-100">
              <Database className="size-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Database Status</h3>
              <p className="text-sm text-muted-foreground">
                {items.length > 0
                  ? "Connected & Ready"
                  : "Needs Initialization"}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={onInitDatabase}
              disabled={loading}
              className="w-full"
              variant={items.length > 0 ? "secondary" : "default"}
            >
              {loading ? "Initializing..." : "Initialize Database"}
            </Button>
          </div>
        </div>

        {/* Inventory Overview Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-green-100">
              <Package className="size-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Inventory Items</h3>
              <p className="text-sm text-muted-foreground">
                {items.length} items in database
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Button
              onClick={onAddTestItem}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? "Adding..." : "Add Test Item"}
            </Button>
            <Button
              onClick={() => router.push("/inventory")}
              className="w-full"
            >
              Manage Inventory
            </Button>
          </div>
        </div>

        {/* Repairs Overview Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-orange-100">
              <Wrench className="size-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Repair Management</h3>
              <p className="text-sm text-muted-foreground">
                Track and manage repairs
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => router.push("/repairs")} className="w-full">
              Go to Repairs
            </Button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Inventory Items</h2>
              <Badge variant="secondary">{items.length} items</Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prices
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {item.phone_brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {item.item_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {item.quantity_in_stock ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-3" />
                        {item.buying_price} / ${item.selling_price}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => onDeleteItem(item.id)}
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Getting Started Guide */}
      <div className="rounded-lg border bg-muted/50 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <HelpCircle className="size-5" />
          Getting Started
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                1
              </span>
              <span className="font-medium">Initialize Database</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Set up your database tables to start managing data
            </p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-medium">
                2
              </span>
              <span className="font-medium">Add Test Data</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Add sample items to verify everything is working
            </p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
                3
              </span>
              <span className="font-medium">Start Managing</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Navigate to Inventory or Repairs to start working
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
