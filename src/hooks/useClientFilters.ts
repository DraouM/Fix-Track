import { useState, useMemo } from "react";
import type { Client } from "@/types/client";

export type ClientSortKey = "name" | "outstandingBalance" | "updatedAt";

export interface ClientSortConfig {
    key: ClientSortKey;
    direction: "asc" | "desc";
}

export function useClientFilters(clients: Client[]) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | "All">("All");
    const [sortConfig, setSortConfig] = useState<ClientSortConfig>({
        key: "updatedAt",
        direction: "desc",
    });

    const filteredAndSortedClients = useMemo(() => {
        let filtered = [...clients];

        // Search Term Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.name.toLowerCase().includes(lowerSearch) ||
                    c.contactName?.toLowerCase().includes(lowerSearch) ||
                    c.phone?.toLowerCase().includes(lowerSearch) ||
                    c.email?.toLowerCase().includes(lowerSearch)
            );
        }

        // Active Filter
        if (activeFilter !== "All") {
            filtered = filtered.filter((c) => (c.status === "active") === activeFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA: any = a[key as keyof Client];
            let valB: any = b[key as keyof Client];

            if (valA === undefined) valA = "";
            if (valB === undefined) valB = "";

            if (valA < valB) return direction === "asc" ? -1 : 1;
            if (valA > valB) return direction === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [clients, searchTerm, activeFilter, sortConfig]);

    const handleSort = (key: ClientSortKey) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const clearFilters = () => {
        setSearchTerm("");
        setActiveFilter("All");
        setSortConfig({ key: "updatedAt", direction: "desc" });
    };

    return {
        filteredAndSortedClients,
        searchTerm,
        activeFilter,
        filters: { searchTerm, active: activeFilter },
        sortConfig,
        setSearchTerm,
        setActiveFilter,
        handleSort,
        clearFilters,
    };
}
