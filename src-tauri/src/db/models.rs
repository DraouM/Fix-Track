// This file holds your data models
use serde::{Deserialize, Serialize};

/// REPAIRS
#[derive(Debug, Serialize, Deserialize)]
pub struct Repair {
    pub id: String,
    pub customer_name: String,
    pub customer_phone: String,
    pub device_brand: String,
    pub device_model: String,
    pub issue_description: String,
    pub estimated_cost: f64,
    pub status: String,
    pub payment_status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepairPayment {
    pub id: String,
    pub repair_id: String,
    pub amount: f64,
    pub date: String,
    pub method: String,
    pub received_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepairUsedPart {
    pub id: String,
    pub repair_id: String,
    pub part_id: String,
    pub part_name: String,
    pub quantity: i32,
    pub unit_price: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepairHistory {
    pub id: String,
    pub repair_id: String,
    pub date: String,
    pub event_type: String,
    pub details: String,
    pub changed_by: Option<String>,
}

/// SUPPLIERS
#[derive(Debug, Serialize, Deserialize)]
pub struct SupplierHistoryEvent {
    pub id: String,
    pub supplier_id: String,
    pub date: String, // ISO string
    // pub type: String, // e.g., Payment Made, Credit Adjusted, etc.
    pub notes: Option<String>,
    pub amount: Option<f64>,
    pub changed_by: Option<String>,
}
