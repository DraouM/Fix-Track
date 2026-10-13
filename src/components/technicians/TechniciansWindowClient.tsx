"use client";

import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Users, Phone, Hash } from "lucide-react";
import { format } from "date-fns";

import { useTechnicianContext } from "@/context/TechnicianContext";
import { useRepairContext } from "@/context/RepairContext";
import { useSettings } from "@/context/SettingsContext";
import {
  formatCurrency as formatCurrencyCentralized,
  getLocaleForIntl,
} from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Repair, RepairStatus } from "@/types/repair";
import type { Technician } from "@/types/technician";
import { parseSpecialties } from "@/types/technician";

// Active workload above this threshold highlights the technician as overloaded
const OVERLOAD_THRESHOLD = 8;

const getStatusDot = (status: RepairStatus) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-500";
    case "In Progress":
      return "bg-blue-500";
    case "Completed":
      return "bg-green-500";
    case "Delivered":
      return "bg-purple-500";
    default:
      return "bg-gray-400";
  }
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface StatProps {
  label: string;
  value: string;
  className?: string;
}

function TechnicianStat({ label, value, className }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl bg-muted/30 dark:bg-slate-800/40">
      <span
        className={cn(
          "text-sm font-black leading-none tracking-tight",
          className,
        )}
      >
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70 text-center">
        {label}
      </span>
    </div>
  );
}

interface TechnicianCardProps {
  technician: Technician;
  repairs: Repair[];
  formatMoney: (value: number) => string;
}

function TechnicianCard({
  technician,
  repairs,
  formatMoney,
}: TechnicianCardProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const total = repairs.length;
    const active = repairs.filter(
      (r) => r.status === "Pending" || r.status === "In Progress",
    ).length;
    const delivered = repairs.filter((r) => r.status === "Delivered").length;
    const collected = repairs.reduce(
      (sum, r) =>
        sum + (r.payments || []).reduce((s, p) => s + (p.amount || 0), 0),
      0,
    );
    // Completion: repairs that reached Completed or Delivered over total
    const doneCount = repairs.filter(
      (r) => r.status === "Completed" || r.status === "Delivered",
    ).length;
    const completionRate =
      total > 0 ? Math.round((doneCount / total) * 100) : 0;
    // Average turnaround (days) for finished repairs
    const finished = repairs.filter(
      (r) => r.status === "Completed" || r.status === "Delivered",
    );
    const avgTurnaroundDays =
      finished.length > 0
        ? finished.reduce(
            (sum, r) =>
              sum +
              Math.max(
                0,
                (new Date(r.updatedAt).getTime() -
                  new Date(r.createdAt).getTime()) /
                  86400000,
              ),
            0,
          ) / finished.length
        : null;
    return {
      total,
      active,
      delivered,
      collected,
      completionRate,
      avgTurnaroundDays,
      overloaded: active >= OVERLOAD_THRESHOLD,
    };
  }, [repairs]);

  const recentRepairs = useMemo(
    () =>
      [...repairs]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [repairs],
  );

  const skills = parseSpecialties(technician.specialties);

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 gap-4",
        !technician.active && "opacity-70",
      )}
    >
      {/* Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex items-center justify-center h-11 w-11 shrink-0 rounded-2xl text-sm font-black",
              technician.active
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {getInitials(technician.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-foreground truncate">
              {technician.name}
            </span>
            {technician.phone && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                <Phone className="h-3 w-3" />
                {technician.phone}
              </span>
            )}
            {skills.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Badge
          variant={technician.active ? "secondary" : "outline"}
          className={cn(
            "text-[9px] font-black uppercase tracking-wider shrink-0",
            technician.active
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
          )}
        >
          {technician.active
            ? t("technicians.active")
            : t("technicians.inactive")}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <TechnicianStat
          label={t("technicians.totalRepairs")}
          value={String(stats.total)}
        />
        <TechnicianStat
          label={t("technicians.activeRepairs")}
          value={String(stats.active)}
          className={
            stats.overloaded
              ? "text-red-600 dark:text-red-400"
              : "text-blue-600 dark:text-blue-400"
          }
        />
        <TechnicianStat
          label={t("technicians.completionRate")}
          value={`${stats.completionRate}%`}
          className="text-purple-600 dark:text-purple-400"
        />
        <TechnicianStat
          label={t("technicians.collected")}
          value={formatMoney(stats.collected)}
          className="text-green-600 dark:text-green-400"
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/70 -mt-2">
        <span>
          {stats.avgTurnaroundDays !== null &&
            t("technicians.avgTurnaround", {
              days: stats.avgTurnaroundDays.toFixed(1),
            })}
        </span>
        {stats.overloaded && (
          <span className="text-red-500 font-black uppercase tracking-wider">
            {t("technicians.overloaded")}
          </span>
        )}
        <span className="tabular-nums">
          {t("technicians.delivered")}: {stats.delivered}
        </span>
      </div>

      {/* Recent repairs */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          {t("technicians.recentRepairs")}
        </span>
        {recentRepairs.length === 0 ? (
          <span className="text-xs font-bold text-muted-foreground/60 py-1">
            {t("technicians.noRepairs")}
          </span>
        ) : (
          recentRepairs.map((repair) => (
            <div
              key={repair.id}
              className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-muted/20 dark:bg-slate-800/30"
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  getStatusDot(repair.status),
                )}
              />
              <span className="font-black text-foreground truncate min-w-0">
                {repair.customerName}
              </span>
              <span className="font-bold text-muted-foreground/70 truncate min-w-0">
                {repair.deviceBrand} {repair.deviceModel}
              </span>
              <span className="ms-auto shrink-0 flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase">
                {repair.code && <Hash className="h-2.5 w-2.5" />}
                {repair.code || repair.id.split("-")[0].toUpperCase()}
              </span>
              <span className="shrink-0 text-[10px] font-bold text-muted-foreground/50">
                {format(new Date(repair.createdAt), "MMM dd")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TechniciansWindowClient() {
  const { t, i18n } = useTranslation();
  const { technicians, loading: techniciansLoading } = useTechnicianContext();
  const { repairs, loading: repairsLoading } = useRepairContext();
  const { settings } = useSettings();

  const formatMoney = useCallback(
    (value: number) =>
      formatCurrencyCentralized(
        value,
        settings.currency,
        getLocaleForIntl(i18n.language),
      ),
    [settings.currency, i18n.language],
  );

  // Group repairs by technician id once for all cards
  const repairsByTechnician = useMemo(() => {
    const map = new Map<string, Repair[]>();
    const unassigned: Repair[] = [];
    repairs.forEach((repair) => {
      if (repair.technicianId) {
        const list = map.get(repair.technicianId);
        if (list) {
          list.push(repair);
        } else {
          map.set(repair.technicianId, [repair]);
        }
      } else {
        unassigned.push(repair);
      }
    });
    return { map, unassigned };
  }, [repairs]);

  const sortedTechnicians = useMemo(
    () =>
      [...technicians].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [technicians],
  );

  const loading = techniciansLoading || repairsLoading;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t("technicians.title")}
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                <span className="text-xs font-black">
                  {technicians.filter((tech) => tech.active).length}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                  {t("technicians.active")}
                </span>
              </div>
              {repairsByTechnician.unassigned.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border border-gray-100 dark:border-slate-800">
                  <span className="text-xs font-black">
                    {repairsByTechnician.unassigned.length}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {t("technicians.unassigned")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && technicians.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-muted-foreground font-bold">
              {t("common.loading")}
            </p>
          </div>
        ) : sortedTechnicians.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-black text-muted-foreground">
              {t("technicians.empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedTechnicians.map((technician) => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                repairs={repairsByTechnician.map.get(technician.id) ?? []}
                formatMoney={formatMoney}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
