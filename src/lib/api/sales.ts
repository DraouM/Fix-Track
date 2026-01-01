import { invoke } from "@tauri-apps/api/core";
import { Sale, SaleItem, SalePayment, SaleWithDetails } from "@/types/sale";

export const createSale = (sale: Sale) => invoke<Sale>("create_sale", { sale });
export const getSales = (statusFilter?: string) =>
  invoke<Sale[]>("get_sales", { statusFilter });
export const getSaleById = (saleId: string) =>
  invoke<SaleWithDetails | null>("get_sale_by_id", { saleId });
export const updateSale = (sale: Sale) => invoke<void>("update_sale", { sale });
export const addSaleItem = (item: SaleItem) =>
  invoke<void>("add_sale_item", { item });
export const updateSaleItem = (item: SaleItem) =>
  invoke<void>("update_sale_item", { item });
export const removeSaleItem = (itemId: string, saleId: string) =>
  invoke<void>("remove_sale_item", { itemId, saleId });
export const addSalePayment = (payment: SalePayment) =>
  invoke<void>("add_sale_payment", { payment });
export const completeSale = (saleId: string) =>
  invoke<void>("complete_sale", { saleId });
