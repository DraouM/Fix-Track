import { invoke } from "@tauri-apps/api/core";

export interface MoneyTransfer {
  id: string;
  from_account: string;
  to_account: string;
  amount: number;
  date: string;
  method?: string;
  notes?: string;
  created_by?: string;
}

export async function addMoneyTransfer(transfer: MoneyTransfer): Promise<MoneyTransfer> {
  return await invoke("add_money_transfer", { transfer });
}

export async function getAllTransfers(): Promise<MoneyTransfer[]> {
  return await invoke("get_all_transfers");
}

export async function updateMoneyTransfer(
  id: string,
  amount: number,
  from_account: string,
  to_account: string,
  method: string | undefined,
  notes: string | undefined
): Promise<void> {
  return await invoke("update_money_transfer", { id, amount, fromAccount: from_account, toAccount: to_account, method, notes });
}

export async function deleteMoneyTransfer(id: string): Promise<void> {
  return await invoke("delete_money_transfer", { id });
}
