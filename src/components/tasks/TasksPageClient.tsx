"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle,
  MoreVertical,
  Edit2,
  Check,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useTaskContext } from "@/context/TaskContext";
import TaskForm from "./TaskForm";
import type { Task, TaskPriority } from "@/types/task";
import { cn } from "@/lib/utils";

export default function TasksPageClient() {
  const { t, i18n } = useTranslation();
  const { tasks, loading, deleteTask, toggleTaskStatus } = useTaskContext();
  const isRTL = i18n.language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "Pending").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const highPriority = tasks.filter((t) => t.priority === "High" && t.status === "Pending").length;
    return { pending, completed, highPriority };
  }, [tasks]);

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  const priorityColors = {
    Low: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
    Medium: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/50",
    High: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/50",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t("tasks.title")}
              </h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                {t("tasks.subtitle")}
              </p>
            </div>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddNew}
                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest"
              >
                <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t("tasks.addTask")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-black">
                  {taskToEdit ? t("tasks.editTask") : t("tasks.newTask")}
                </DialogTitle>
              </DialogHeader>
              <div className="pt-4">
                <TaskForm
                  taskToEdit={taskToEdit}
                  onSuccess={() => setIsFormOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("tasks.pending")}</span>
            </div>
            <div className="text-2xl font-black">{stats.pending}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("tasks.completed")}</span>
            </div>
            <div className="text-2xl font-black">{stats.completed}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("tasks.urgent")}</span>
            </div>
            <div className="text-2xl font-black">{stats.highPriority}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input
              placeholder={t("tasks.placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("h-11 rounded-xl bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800", isRTL ? "pr-10" : "pl-10")}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md",
                  task.status === "Completed" && "opacity-60 grayscale-[0.5]"
                )}
              >
                <div className="flex-shrink-0">
                  <Checkbox
                    checked={task.status === "Completed"}
                    onCheckedChange={() => toggleTaskStatus(task.id)}
                    className="h-5 w-5 rounded-lg border-2 border-gray-200 dark:border-slate-700 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "text-sm font-black uppercase tracking-tight truncate",
                      task.status === "Completed" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-tighter px-1.5 py-0", priorityColors[task.priority as TaskPriority])}>
                      {t(`tasks.${task.priority.toLowerCase()}`)}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                      <Calendar className="h-3 w-3" />
                      {t("tasks.due")}: {new Date(task.due_date).toLocaleDateString(i18n.language)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(task)}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTasks.length === 0 && !loading && (
            <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
               <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-full w-fit mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
               </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {searchTerm ? t("tasks.noTasksSearch") : t("tasks.noTasks")}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
