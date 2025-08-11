"use client";

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// Types matching your Rust structs
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

export default function TestPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Initialize database tables
  const initDatabase = async () => {
    try {
      setLoading(true);
      setError("");
      await invoke("init_database");
      setSuccess("Database initialized successfully!");
    } catch (err) {
      setError(`Failed to initialize database: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Add a test item
  const addTestItem = async () => {
    const testItem: InventoryItem = {
      id: `item_${Date.now()}`,
      item_name: "iPhone 14 Screen",
      phone_brand: "Apple",
      item_type: "Screen",
      buying_price: 120.0,
      selling_price: 200.0,
      quantity_in_stock: 5,
      low_stock_threshold: 2,
      supplier_info: "TechParts Inc",
    };

    try {
      setLoading(true);
      setError("");
      await invoke("insert_item", { item: testItem });
      setSuccess("Test item added successfully!");
      await loadItems(); // Refresh the list
    } catch (err) {
      setError(`Failed to add item: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Load all items
  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await invoke<InventoryItem[]>("get_items");
      setItems(result);
      setSuccess(`Loaded ${result.length} items successfully!`);
    } catch (err) {
      setError(`Failed to load items: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete an item
  const deleteItem = async (itemId: string) => {
    try {
      setLoading(true);
      setError("");
      await invoke("delete_item", { itemId });
      setSuccess("Item deleted successfully!");
      await loadItems(); // Refresh the list
    } catch (err) {
      setError(`Failed to delete item: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Inventory System Test
        </h1>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={initDatabase}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Loading..." : "Initialize Database"}
          </button>

          <button
            onClick={addTestItem}
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Loading..." : "Add Test Item"}
          </button>

          <button
            onClick={loadItems}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load Items"}
          </button>
        </div>

        {/* Items Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Inventory Items ({items.length})
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No items found. Try adding a test item first!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.phone_brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.item_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity_in_stock ?? "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Buy: ${item.buying_price} | Sell: ${item.selling_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p className="text-sm text-gray-600">
            This test page verifies your Rust backend is working. Try the
            buttons in order:
            <br />
            1. Initialize Database → 2. Add Test Item → 3. Load Items
          </p>
        </div>
      </div>

      {/* Go to the inventory */}
      <div>
        {/* Use Next.js navigation to go to the inventory */}
        <button
          onClick={() => (window.location.href = "./inventory/page.tsx")}
          className="text-blue-600 hover:text-blue-900"
        >
          Go to inventory
        </button>
      </div>
    </div>
  );
}
