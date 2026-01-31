export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "Pending" | "Completed";

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date?: string;
    created_at: string;
    updated_at: string;
}

export interface TaskFormValues {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date?: string;
}
