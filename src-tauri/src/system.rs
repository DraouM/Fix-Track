use machine_uid;
use sha2::{Digest, Sha256};

#[tauri::command]
pub fn get_device_id() -> String {
    let id = machine_uid::get().unwrap_or("unknown-device".into());
    // Hash it for privacy and shorter length
    let mut hasher = Sha256::new();
    hasher.update(id);
    let result = hasher.finalize();
    format!("{:x}", result)
}
