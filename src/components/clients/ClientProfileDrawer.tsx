"use client";

import React, { useEffect } from "react";
import {
  X,
  Pencil,
  DollarSign,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Wallet,
  TrendingUp,
  History,
  Calendar,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/types/client";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { cn } from "@/lib/utils";

export interface ClientProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onOpenLedger?: () => void;
  onOpenPayment?: () => void;
  onEdit?: () => void;
}

/**
 * Core client profile shown as a right-side slider (slide-over), mirroring the
 * chrome of the suppliers' EntityPeekDrawer (backdrop, ESC-to-close, scroll
 * lock, slide-in panel) but displaying the info-only core profile instead of
 * the ledger table.
 */
export function ClientProfileDrawer({
  isOpen,
  onClose,
  client,
  onOpenLedger,
  onOpenPayment,
  onEdit,
}: ClientProfileDrawerProps) {
  // ── Keyboard shortcut: Escape to close ──────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Prevent background scroll when open ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        aria-hidden="true"
      />

      {/* Drawer Container (wide like the suppliers' peek drawer) */}
      <div className="relative z-10 w-full max-w-[880px] h-full bg-[#fbfcfd] dark:bg-slate-950 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
        {/* Top Drawer Header */}
        <div className="flex-shrink-0 px-6 py-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/10 font-black text-lg">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-foreground dark:text-slate-100 truncate max-w-[340px]">
                  {client.name}
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                    client.status === "active"
                      ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700",
                  )}
                >
                  {client.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 opacity-40 text-primary" />
                  <span className="font-mono text-muted-foreground/70 uppercase">
                    ID: {client.id.slice(0, 8)}
                  </span>
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 opacity-40 text-primary" />
                  Registered: {formatDate(client.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onOpenLedger && (
              <Button
                onClick={onOpenLedger}
                variant="outline"
                size="sm"
                title="Open financial ledger"
                className="h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-black text-[10px] uppercase tracking-widest gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Ledger
              </Button>
            )}
            {onOpenPayment && (
              <Button
                onClick={onOpenPayment}
                size="sm"
                className="h-10 px-3 rounded-xl bg-primary hover:bg-primary/90 shadow-sm font-black text-[10px] uppercase tracking-widest gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Settle
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="icon"
                title="Edit client credentials"
                className="h-10 w-10 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors gap-2 text-muted-foreground hover:text-foreground"
            >
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 text-muted-foreground">
                ESC
              </kbd>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Body - Scrollable Container: identity + financial side by side */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Primary Identity Card */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md dark:border dark:border-slate-800">
              <CardHeader className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800 py-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <User className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-muted-foreground/40">
                    Primary Identity
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40 ml-1">
                    Full Legal Name
                  </p>
                  <div className="h-12 w-full px-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex items-center font-bold text-sm text-foreground dark:text-slate-200">
                    {client.name}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40 ml-1">
                    Direct Comms
                  </p>
                  <div className="space-y-3">
                    <div className="h-12 w-full px-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                      <Phone className="w-4 h-4 opacity-30 text-primary" />
                      <span className="font-bold text-sm text-foreground/80 dark:text-slate-300">
                        {client.phone || "No phone documented"}
                      </span>
                    </div>
                    <div className="h-12 w-full px-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                      <Mail className="w-4 h-4 opacity-30 text-primary" />
                      <span className="font-bold text-sm text-foreground/80 dark:text-slate-300 truncate">
                        {client.email || "No email documented"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40 ml-1">
                    Billing Location
                  </p>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 min-h-[80px] flex items-start gap-3">
                    <MapPin className="w-4 h-4 opacity-30 text-primary mt-0.5" />
                    <span className="font-bold text-sm text-foreground/80 dark:text-slate-300 leading-relaxed italic">
                      {client.address || "Billing destination unconfigured"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Standing Card */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md dark:border dark:border-slate-800">
              <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100/50 dark:border-emerald-900/20 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800/60 dark:text-emerald-400/60">
                      Financial Standing
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      Real-time ledger
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-muted-foreground/30 mb-3">
                    Outstanding Aggregate
                  </p>
                  <div className="flex items-baseline gap-3">
                    <h2
                      className={cn(
                        "text-5xl font-black tracking-tighter",
                        (client.outstandingBalance || 0) > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {formatCurrency(client.outstandingBalance || 0)}
                    </h2>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase tracking-widest">
                    Currently pending settlements
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-800">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-muted-foreground/30 mb-1">
                      Trust Score
                    </p>
                    <p className="text-sm font-black text-foreground dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      Premium
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-800">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-muted-foreground/30 mb-1">
                      Status
                    </p>
                    <p className="text-sm font-black text-foreground dark:text-slate-200 capitalize">
                      {client.status}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-muted-foreground/30">
                    System Insights
                  </p>
                  <div className="relative p-6 rounded-3xl bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 min-h-[110px]">
                    <History className="absolute top-4 right-4 w-5 h-5 text-amber-500/20 dark:text-amber-500/10" />
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-300 leading-relaxed italic">
                      {client.notes ||
                        "No administrative observation recorded for this identity."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientProfileDrawer;
