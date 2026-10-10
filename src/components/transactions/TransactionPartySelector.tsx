"use client";

import React, { useState } from "react";
import { User, Building2, Plus, Phone, Mail, ChevronDown } from "lucide-react";
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
  const PartyIcon = type === "Client" ? User : Building2;

  return (
    <Card
      className={cn(
        "overflow-hidden border dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900",
        className,
      )}
    >
      <CardHeader className="px-5 pt-4 pb-3 border-b dark:border-slate-800 bg-muted/20 dark:bg-slate-800/50">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 dark:text-slate-200">
          <PartyIcon className={cn("h-4 w-4", iconColor)} />
          {t("transactions_module.party.details", {
            type: t(`transactions_module.party.${type.toLowerCase()}`),
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {!showAddForm ? (
          <div className="space-y-4">
            {/* Party picker with an explicit micro label (project token style) */}
            <div>
              <label
                htmlFor="party-select"
                className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500 mb-1.5 ml-1"
              >
                {t("transactions_module.party.select", {
                  type: t(`transactions_module.party.${type.toLowerCase()}`),
                })}
              </label>
              <div className="relative">
                <PartyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-slate-500 pointer-events-none" />
                <select
                  id="party-select"
                  className="w-full h-10 pl-10 pr-9 rounded-xl border border-input dark:border-slate-800 bg-background dark:bg-slate-950 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer transition-all dark:text-slate-200"
                  value={selectedId}
                  onChange={(e) => onSelect(e.target.value)}
                >
                  <option value="" className="dark:bg-slate-900">
                    {t("transactions_module.party.select", {
                      type: t(
                        `transactions_module.party.${type.toLowerCase()}`,
                      ),
                    })}
                  </option>
                  {parties.map((p: any) => (
                    <option
                      key={p.id}
                      value={p.id}
                      className="dark:bg-slate-900"
                    >
                      {p.name}{" "}
                      {p.outstandingBalance > 0
                        ? `(${t("suppliers.balance")}: ${formatCurrency(p.outstandingBalance)})`
                        : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-slate-500 pointer-events-none" />
              </div>
            </div>

            <Button
              variant="link"
              className="p-0 h-auto text-[11px] text-primary/80 dark:text-primary/60 hover:text-primary dark:hover:text-primary font-bold uppercase tracking-wider"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("transactions_module.party.addNew", {
                type: t(`transactions_module.party.${type.toLowerCase()}`),
              })}
            </Button>

            {selectedParty && (
              <div
                className={cn(
                  "p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 duration-300",
                  type === "Client"
                    ? "bg-green-50/60 dark:bg-green-900/10 border-green-100 dark:border-green-900/40"
                    : "bg-blue-50/60 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/40",
                )}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground dark:text-slate-100 truncate">
                      {selectedParty.name}
                    </h3>
                    {(selectedParty.email || selectedParty.phone) && (
                      <div className="flex flex-col gap-1 mt-2">
                        {selectedParty.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-400">
                            <Phone className="h-3 w-3 opacity-70" />
                            {selectedParty.phone}
                          </span>
                        )}
                        {selectedParty.email && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-400">
                            <Mail className="h-3 w-3 opacity-70" />
                            {selectedParty.email}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedParty.outstandingBalance > 0 && (
                    <Badge
                      variant={type === "Client" ? "destructive" : "secondary"}
                      className="text-[10px] font-bold py-0 h-5 rounded-md flex-shrink-0"
                    >
                      {formatCurrency(selectedParty.outstandingBalance)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500 mb-1.5 ml-1">
                {t("transactions_module.party.name", {
                  type: t(`transactions_module.party.${type.toLowerCase()}`),
                })}
              </label>
              <Input
                type="text"
                placeholder={t("transactions_module.party.placeholder", {
                  type: t(`transactions_module.party.${type.toLowerCase()}`),
                })}
                className="h-10 text-sm rounded-xl dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 h-10 text-xs font-black uppercase tracking-wider rounded-xl"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                {t("transactions_module.party.add", {
                  type: t(`transactions_module.party.${type.toLowerCase()}`),
                })}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 text-xs font-bold rounded-xl dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
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
