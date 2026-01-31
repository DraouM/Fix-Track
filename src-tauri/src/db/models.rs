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
    
    // Virtual fields for full details
    #[serde(default)]
    pub used_parts: Vec<RepairUsedPart>,
    #[serde(default)]
    pub payments: Vec<RepairPayment>,
    #[serde(default)]
    pub history: Vec<RepairHistory>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RepairPayment {
    pub id: String,
    pub repair_id: String,
    pub amount: f64,
    pub date: String,
    pub method: String,
    pub received_by: Option<String>,
    pub session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepairUsedPart {
    pub id: String,
    pub repair_id: String,
    pub part_id: String,
    pub part_name: String,
    pub quantity: i32,
    #[serde(rename = "cost")]
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
    pub session_id: Option<String>,
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClientPayment {
    pub id: String,
    pub client_id: String,
    pub amount: f64,
    pub method: String,
    pub date: String,
    pub notes: Option<String>,
    pub session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierPayment {
    pub id: String,
    pub supplier_id: String,
    pub amount: f64,
    pub method: String,
    pub date: String,
    pub notes: Option<String>,
    pub session_id: Option<String>,
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
    pub session_id: Option<String>,
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

/// EXPENSES
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Expense {
    pub id: String,
    pub amount: f64,
    pub reason: String,
    pub date: String,
    pub session_id: Option<String>,
    pub category: Option<String>,
    pub created_by: Option<String>,
}

/// DAILY SESSIONS
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DailySession {
    pub id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub opening_balance: f64,
    pub closing_balance: Option<f64>,
    pub counted_amount: Option<f64>,
    pub withdrawal_amount: Option<f64>,
    pub status: String,
    pub notes: Option<String>,
    pub created_by: Option<String>,
}

/// TRANSACTIONS (Unified)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: String,
    pub transaction_number: String,
    pub transaction_type: String, // "Sale" or "Purchase"
    pub party_id: String,
    pub party_type: String, // "Client" or "Supplier"
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
pub struct TransactionItem {
    pub id: String,
    pub transaction_id: String,
    pub item_id: Option<String>,
    pub item_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionPayment {
    pub id: String,
    pub transaction_id: String,
    pub amount: f64,
    pub method: String,
    pub date: String,
    pub received_by: Option<String>,
    pub notes: Option<String>,
    pub session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionHistory {
    pub id: String,
    pub transaction_id: String,
    pub date: String,
    pub event_type: String,
    pub details: String,
    pub changed_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionWithDetails {
    pub transaction: Transaction,
    pub items: Vec<TransactionItem>,
    pub payments: Vec<TransactionPayment>,
    pub party_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardTransaction {
    pub id: String,
    pub tx_type: String, // "credit" or "debit"
    pub category: String,
    pub amount: f64,
    pub description: String,
    pub time: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevenueData {
    pub date: String,
    pub revenue: f64,
    pub profit: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevenueBreakdown {
    pub category: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardStats {
    pub total_revenue: f64,
    pub net_cash: f64,
    pub active_repairs: i32,
    pub completed_repairs: i32,
    pub stock_alerts: i32,
    pub out_of_stock: i32,
    pub revenue_change: f64,
}

/// TASKS
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: String, // "Low", "Medium", "High"
    pub status: String,   // "Pending", "Completed"
    pub due_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
