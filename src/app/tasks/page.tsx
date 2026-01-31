"use client";

import { TaskProvider } from "@/context/TaskContext";
import TasksPageClient from "@/components/tasks/TasksPageClient";

export default function TasksPage() {
  return (
    <TaskProvider>
      <TasksPageClient />
    </TaskProvider>
  );
}
