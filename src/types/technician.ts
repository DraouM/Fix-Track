// src/types/technician.ts

export interface Technician {
  id: string;
  name: string;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shape returned by the Rust `Technician` model (snake_case)
export interface TechnicianDb {
  id: string;
  name: string;
  phone?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function mapTechnicianFromDB(db: TechnicianDb): Technician {
  return {
    id: db.id,
    name: db.name,
    phone: db.phone ?? null,
    active: db.active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}
