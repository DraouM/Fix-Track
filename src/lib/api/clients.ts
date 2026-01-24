
import { invoke } from "@tauri-apps/api/core";
import { Client, ClientStatus } from "@/types/client";

export async function getClientById(clientId: string): Promise<Client | null> {
    try {
        const data = await invoke<any>("get_client_by_id", { clientId });
        if (!data) return null;
        return mapClientFromDB(data);
    } catch (error) {
        console.error("Failed to fetch client:", error);
        throw error;
    }
}

function mapClientFromDB(db: any): Client {
    return {
        id: db.id,
        name: db.name,
        contactName: db.contact_name,
        email: db.email,
        phone: db.phone,
        address: db.address,
        notes: db.notes,
        outstandingBalance: db.outstanding_balance,
        status: db.status as ClientStatus,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    };
}
