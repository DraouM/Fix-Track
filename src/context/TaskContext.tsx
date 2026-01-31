"use client";

import { invoke } from "@tauri-apps/api/core";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { Task, TaskStatus } from "@/types/task";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

interface TaskActions {
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
}

export type TaskContextType = TaskState & TaskActions;

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<Task[]>("get_tasks");
      setTasks(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error("Failed to fetch tasks:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (data: Omit<Task, "id" | "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      const newTask = {
        ...data,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await invoke("insert_task", { task: newTask });
      toast.success("Task created");
      await fetchTasks();
    } catch (err) {
      console.error("Failed to create task:", err);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }, [fetchTasks]);

  const updateTask = useCallback(async (task: Task) => {
    setLoading(true);
    try {
        const updatedTask = {
            ...task,
            updated_at: new Date().toISOString()
        };
      await invoke("update_task", { task: updatedTask });
      // Don't show toast for simple toggles usually, but here generic update
      await fetchTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await invoke("delete_task", { id });
      toast.success("Task deleted");
      await fetchTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  }, [fetchTasks]);

  const toggleTaskStatus = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === "Pending" ? "Completed" : "Pending";
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      await invoke("update_task", { 
        task: { ...task, status: newStatus, updated_at: new Date().toISOString() } 
      });
    } catch (err) {
        // Rollback
        setTasks(prev => prev.map(t => t.id === id ? task : t));
        toast.error("Failed to update status");
    }
  }, [tasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const value = useMemo(() => ({
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus
  }), [tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask, toggleTaskStatus]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTaskContext must be used within a TaskProvider");
  return context;
};
