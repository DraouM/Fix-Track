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
    pub code: Option<String>,
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

/// ORDERS
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Order {
    pub id: String,
    pub order_number: String,
    pub supplier_id: String,
    pub status: String,
    pub payment_status: String,
    pub total_amount: f64,
    pub paid_amount: f64,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderItem {
    pub id: String,
    pub order_id: String,
    pub item_id: Option<String>,
    pub item_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderPayment {
    pub id: String,
    pub order_id: String,
    pub amount: f64,
    pub method: String,
    pub date: String,
    pub received_by: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderHistory {
    pub id: String,
    pub order_id: String,
    pub date: String,
    pub event_type: String,
    pub details: String,
    pub changed_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderWithDetails {
    pub order: Order,
    pub items: Vec<OrderItem>,
    pub payments: Vec<OrderPayment>,
    pub supplier_name: String,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct ClientHistoryEvent {
    pub id: String,
    pub client_id: String,
    pub date: String,
    pub event_type: String, // Renamed from type_name for consistency
    pub notes: Option<String>,
    pub amount: f64, // Made non-optional for history
    pub changed_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupplierHistoryEvent {
    pub id: String,
    pub supplier_id: String,
    pub date: String,
    pub event_type: String,
    pub notes: Option<String>,
    pub amount: f64,
    pub changed_by: Option<String>,
}

/// SALES
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sale {
    pub id: String,
    pub sale_number: String,
    pub client_id: String,
    pub status: String,
    pub payment_status: String,
    pub total_amount: f64,
    pub paid_amount: f64,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaleItem {
    pub id: String,
    pub sale_id: String,
    pub item_id: Option<String>,
    pub item_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SalePayment {
    pub id: String,
    pub sale_id: String,
    pub amount: f64,
    pub method: String,
    pub date: String,
    pub received_by: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaleHistory {
    pub id: String,
    pub sale_id: String,
    pub date: String,
    pub event_type: String,
    pub details: String,
    pub changed_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleWithDetails {
    pub sale: Sale,
    pub items: Vec<SaleItem>,
    pub payments: Vec<SalePayment>,
    pub client_name: String,
}
