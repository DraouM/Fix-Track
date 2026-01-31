"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskContext } from "@/context/TaskContext";
import type { Task, TaskFormValues, TaskPriority, TaskStatus } from "@/types/task";

interface TaskFormProps {
  taskToEdit?: Task | null;
  onSuccess: () => void;
}

export default function TaskForm({ taskToEdit, onSuccess }: TaskFormProps) {
  const { t } = useTranslation();
  const { createTask, updateTask } = useTaskContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskFormValues>({
    defaultValues: taskToEdit
      ? {
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          priority: taskToEdit.priority,
          status: taskToEdit.status,
          due_date: taskToEdit.due_date || "",
        }
      : {
          title: "",
          description: "",
          priority: "Medium",
          status: "Pending",
          due_date: "",
        },
  });

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        await updateTask({
          ...taskToEdit,
          ...values,
        });
      } else {
        await createTask(values);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest opacity-60">
                {t("common.title") || "Title"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Task title..."
                  {...field}
                  className="h-10 rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest opacity-60">
                  Priority
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                    <SelectItem value="Low" className="font-bold">Low</SelectItem>
                    <SelectItem value="Medium" className="font-bold">Medium</SelectItem>
                    <SelectItem value="High" className="font-bold text-red-500">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest opacity-60">
                  Due Date
                </FormLabel>
                <FormControl>
                    <Input
                        type="date"
                        {...field}
                        className="h-10 rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold"
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest opacity-60">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details..."
                  className="min-h-[100px] rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-medium"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest"
        >
          {isSubmitting ? (
              t("common.processing") || "Processing..."
          ) : (
             <>
                <Save className="w-4 h-4 mr-2" />
                {taskToEdit ? "Update Task" : "Add Task"}
             </>
          )}
        </Button>
      </form>
    </Form>
  );
}
