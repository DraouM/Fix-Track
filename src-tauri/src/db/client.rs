use rusqlite::{params, Connection, Result};

pub fn init_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS client (
            id INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT
        )",
        [],
    )?;
    Ok(())
}

pub fn add_client(conn: &Connection, name: &str, email: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO client (name, email) VALUES (?1, ?2)",
        params![name, email],
    )?;
    Ok(())
}
