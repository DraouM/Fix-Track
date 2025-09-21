"use client";

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

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

export default function DashboardPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Database operations
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
      await loadItems();
    } catch (err) {
      setError(`Failed to add item: ${err}`);
    } finally {
      setLoading(false);
    }
  };

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

  const deleteItem = async (itemId: string) => {
    try {
      setLoading(true);
      setError("");
      await invoke("delete_item", { itemId });
      setSuccess("Item deleted successfully!");
      await loadItems();
    } catch (err) {
      setError(`Failed to delete item: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContent
      items={items}
      loading={loading}
      error={error}
      success={success}
      onInitDatabase={initDatabase}
      onAddTestItem={addTestItem}
      onLoadItems={loadItems}
      onDeleteItem={deleteItem}
    />
  );
}
