// ... your existing code ...

#[cfg(test)] // This module only compiles when running tests
mod tests {
    use super::*;
    use rusqlite::Connection;
    use uuid::Uuid; // Add uuid to your Cargo.toml for testing

    // Helper function to create an in-memory database for testing
    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().expect("Failed to create in-memory DB");
        // Run your migrations/schema setup here
        conn.execute_batch(
            "
            CREATE TABLE repairs (
                id TEXT PRIMARY KEY,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                device_brand TEXT NOT NULL,
                device_model TEXT NOT NULL,
                issue_description TEXT NOT NULL,
                estimated_cost REAL NOT NULL,
                status TEXT NOT NULL,
                payment_status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            ",
        )
        .expect("Failed to create test tables");
        conn
    }

    // Helper to create a test Repair
    fn create_test_repair() -> Repair {
        let id = Uuid::new_v4().to_string();
        Repair {
            id,
            customer_name: "Test Customer".to_string(),
            customer_phone: "123-456-7890".to_string(),
            device_brand: "Test Brand".to_string(),
            device_model: "Test Model".to_string(),
            issue_description: "Test issue".to_string(),
            estimated_cost: 99.99,
            status: "Pending".to_string(),
            payment_status: "Unpaid".to_string(),
            created_at: "2023-01-01T00:00:00Z".to_string(),
            updated_at: "2023-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_insert_and_get_repairs() {
        let conn = setup_test_db();
        let test_repair = create_test_repair();

        // Test insertion
        insert_repair_db(&conn, &test_repair).expect("Failed to insert repair");

        // Test retrieval
        let repairs = get_repairs_db(&conn).expect("Failed to get repairs");

        assert_eq!(repairs.len(), 1);
        assert_eq!(repairs[0].customer_name, "Test Customer");
        assert_eq!(repairs[0].device_model, "Test Model");
    }

    #[test]
    fn test_update_repair_status() {
        let conn = setup_test_db();
        let test_repair = create_test_repair();

        // Insert first
        insert_repair_db(&conn, &test_repair).expect("Failed to insert repair");

        // Test status update
        update_repair_status_db(&conn, &test_repair.id, "Completed", Some("Paid"))
            .expect("Failed to update status");

        // Verify the update
        let repairs = get_repairs_db(&conn).expect("Failed to get repairs");
        assert_eq!(repairs[0].status, "Completed");
        assert_eq!(repairs[0].payment_status, "Paid");
    }

    #[test]
    fn test_delete_repair() {
        let conn = setup_test_db();
        let test_repair = create_test_repair();

        // Insert first
        insert_repair_db(&conn, &test_repair).expect("Failed to insert repair");
        assert_eq!(get_repairs_db(&conn).unwrap().len(), 1);

        // Test deletion
        delete_repair_db(&conn, &test_repair.id).expect("Failed to delete repair");

        // Verify deletion
        let repairs = get_repairs_db(&conn).expect("Failed to get repairs");
        assert_eq!(repairs.len(), 0);
    }
}
