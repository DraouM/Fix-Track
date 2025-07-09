pub mod client;
pub mod inventory;
pub mod repair;
pub mod sale;

use rusqlite::Connection;

pub fn get_connection() -> rusqlite::Result<Connection> {
    Connection::open("fixtrack.db")
}
