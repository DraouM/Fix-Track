// src/types/technician.ts

export interface Technician {
  id: string;
  name: string;
  phone?: string | null;
  /** Comma-separated skill tags (e.g. "screen, battery, water damage") */
  specialties?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shape returned by the Rust `Technician` model (snake_case)
export interface TechnicianDb {
  id: string;
  name: string;
  phone?: string | null;
  specialties?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function mapTechnicianFromDB(db: TechnicianDb): Technician {
  return {
    id: db.id,
    name: db.name,
    phone: db.phone ?? null,
    specialties: db.specialties ?? null,
    active: db.active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/** Parse the comma-separated specialties string into trimmed tags */
export function parseSpecialties(specialties?: string | null): string[] {
  if (!specialties) return [];
  return specialties
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
