use crate::db;
use crate::db::models::Task;
use rusqlite::{params, Result};
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
pub fn get_tasks() -> Result<Vec<Task>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT id, title, description, priority, status, due_date, created_at, updated_at FROM tasks ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2).ok(),
                priority: row.get(3)?,
                status: row.get(4)?,
                due_date: row.get(5).ok(),
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    Ok(tasks)
}

#[tauri::command]
pub fn insert_task(mut task: Task) -> Result<Task, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    if task.id.is_empty() {
        task.id = Uuid::new_v4().to_string();
    }
    
    let now = Utc::now().to_rfc3339();
    task.created_at = now.clone();
    task.updated_at = now;

    conn.execute(
        "INSERT INTO tasks (id, title, description, priority, status, due_date, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            task.id,
            task.title,
            task.description,
            task.priority,
            task.status,
            task.due_date,
            task.created_at,
            task.updated_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
pub fn update_task(mut task: Task) -> Result<Task, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    task.updated_at = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET title = ?1, description = ?2, priority = ?3, status = ?4, due_date = ?5, updated_at = ?6 WHERE id = ?7",
        params![
            task.title,
            task.description,
            task.priority,
            task.status,
            task.due_date,
            task.updated_at,
            task.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
pub fn delete_task(id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
