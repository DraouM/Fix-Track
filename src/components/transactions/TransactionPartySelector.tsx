"use client";

import React, { useState } from "react";
import { User, Building2, Plus, ShoppingCart as CartIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClientContext } from "@/context/ClientContext";
import { useSupplierState } from "@/context/SupplierContext";
import { formatCurrency } from "@/lib/clientUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TransactionPartySelectorProps {
  type: "Client" | "Supplier";
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function TransactionPartySelector({
  type,
  selectedId,
  onSelect,
  className,
}: TransactionPartySelectorProps) {
  const { clients } = useClientContext();
  const { suppliers } = useSupplierState();
  const [showAddForm, setShowAddForm] = useState(false);
  const { t } = useTranslation();

  const parties = type === "Client" ? clients : suppliers;
  const selectedParty = parties.find((p: any) => p.id === selectedId);

  const iconColor = type === "Client" ? "text-green-600" : "text-blue-600";

  return (
    <Card className={cn("overflow-hidden border shadow-sm", className)}>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          {type === "Client" ? (
            <User className={cn("h-4 w-4", iconColor)} />
          ) : (
            <Building2 className={cn("h-4 w-4", iconColor)} />
          )}
          {t("transactions_module.party.details", { type: t(`transactions_module.party.${type.toLowerCase()}`) })}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!showAddForm ? (
          <div className="space-y-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-all"
                  value={selectedId}
                  onChange={(e) => onSelect(e.target.value)}
                >
                  <option value="">{t("transactions_module.party.select", { type: t(`transactions_module.party.${type.toLowerCase()}`) })}</option>
                  {parties.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{" "}
                      {p.outstandingBalance > 0
                        ? `(${t("suppliers.balance")}: ${formatCurrency(p.outstandingBalance)})`
                        : ""}
                    </option>
                  ))}
                </select>
             </div>
            
             <Button
              variant="link"
              className="p-0 h-auto text-xs text-primary/80 hover:text-primary font-medium"
              onClick={() => setShowAddForm(true)}
            >
              {t("transactions_module.party.addNew", { type: t(`transactions_module.party.${type.toLowerCase()}`) })}
            </Button>

            {selectedParty && (
              <div className={cn(
                "mt-2 p-3 rounded-lg border transition-all animate-in fade-in slide-in-from-top-2",
                type === "Client" ? "bg-green-50/50 border-green-100" : "bg-blue-50/50 border-blue-100"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{selectedParty.name}</h3>
                    {(selectedParty.email || selectedParty.phone) && (
                      <p className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                        {selectedParty.phone && <span>{selectedParty.phone}</span>}
                        {selectedParty.email && <span>{selectedParty.email}</span>}
                      </p>
                    )}
                  </div>
                  {selectedParty.outstandingBalance > 0 && (
                    <Badge variant={type === "Client" ? "destructive" : "secondary"} className="text-[10px] font-bold py-0 h-5">
                      {formatCurrency(selectedParty.outstandingBalance)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
           <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">{t("transactions_module.party.name", { type: t(`transactions_module.party.${type.toLowerCase()}`) })}</label>
              <Input
                type="text"
                placeholder={t("transactions_module.party.placeholder", { type: t(`transactions_module.party.${type.toLowerCase()}`) })}
                className="mt-1 h-9 text-sm"
              />
            </div>
             <div className="flex gap-2 pt-1">
              <Button className="flex-1 h-9 text-sm" size="sm" onClick={() => setShowAddForm(false)}>
                {t("transactions_module.party.add", { type: t(`transactions_module.party.${type.toLowerCase()}`) })}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
