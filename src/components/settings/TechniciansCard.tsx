"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Phone,
  Wrench,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTechnicianContext } from "@/context/TechnicianContext";
import { parseSpecialties, type Technician } from "@/types/technician";

interface TechnicianFormState {
  name: string;
  phone: string;
  specialties: string;
}

const EMPTY_FORM: TechnicianFormState = {
  name: "",
  phone: "",
  specialties: "",
};

export function TechniciansCard() {
  const { t } = useTranslation();
  const { technicians, createTechnician, updateTechnician, deleteTechnician } =
    useTechnicianContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [form, setForm] = useState<TechnicianFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (technician: Technician) => {
    setEditing(technician);
    setForm({
      name: technician.name,
      phone: technician.phone ?? "",
      specialties: technician.specialties ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t("settings.technicians.nameRequired"));
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        specialties: form.specialties.trim() || null,
      };
      if (editing) {
        await updateTechnician({ ...editing, ...payload });
      } else {
        await createTechnician(payload);
      }
      setIsDialogOpen(false);
    } catch {
      // error toasted by context
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (technician: Technician) => {
    if (!window.confirm(t("settings.technicians.deleteConfirm"))) return;
    try {
      await deleteTechnician(technician.id);
    } catch {
      // error toasted by context
    }
  };

  const handleToggleActive = async (technician: Technician) => {
    try {
      await updateTechnician({ ...technician, active: !technician.active });
    } catch {
      // error toasted by context
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t("technicians.title")}
          </CardTitle>
          <CardDescription>
            {t("settings.technicians.description")}
          </CardDescription>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("settings.technicians.add")}
        </Button>
      </CardHeader>
      <CardContent>
        {technicians.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("technicians.empty")}
          </p>
        ) : (
          <div className="space-y-2">
            {technicians.map((technician) => {
              const skills = parseSpecialties(technician.specialties);
              return (
                <div
                  key={technician.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    technician.active
                      ? "bg-white dark:bg-slate-900"
                      : "bg-muted/30 opacity-70",
                  )}
                >
                  <div className="flex items-center justify-center h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary text-xs font-black uppercase">
                    {technician.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {technician.name}
                      </span>
                      <Badge
                        variant={technician.active ? "secondary" : "outline"}
                        className={cn(
                          "text-[9px] uppercase font-bold",
                          technician.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {technician.active
                          ? t("technicians.active")
                          : t("technicians.inactive")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mt-0.5">
                      {technician.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {technician.phone}
                        </span>
                      )}
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        >
                          <Wrench className="h-2.5 w-2.5" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={
                        technician.active
                          ? t("settings.technicians.deactivate")
                          : t("settings.technicians.activate")
                      }
                      onClick={() => handleToggleActive(technician)}
                    >
                      <Users
                        className={cn(
                          "h-4 w-4",
                          technician.active
                            ? "text-green-500"
                            : "text-muted-foreground/50",
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(technician)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(technician)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          {t("settings.technicians.softDeleteHint")}
        </p>
      </CardContent>

      {/* Add / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t("settings.technicians.edit")
                : t("settings.technicians.add")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.technicians.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("settings.technicians.name")} *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("settings.technicians.name")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("settings.technicians.phone")}
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+212 6 00 00 00 00"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("settings.technicians.specialties")}
              </label>
              <Input
                value={form.specialties}
                onChange={(e) =>
                  setForm({ ...form, specialties: e.target.value })
                }
                placeholder={t("settings.technicians.specialtiesHint")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
