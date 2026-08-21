use crate::system::get_device_id;
use reqwest;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

// ─── Keygen Configuration ────────────────────────────────────────────────────
// These IDs are public (sent to Keygen's public API), but compiled into the
// binary they're no longer trivially visible in JS bundles or devtools.
const ACCOUNT_ID: &str = "gxuzi-com";
const PRODUCT_ID: &str = "fe3a98c7-0972-41eb-9806-8d47cbf77502";
const POLICY_ID: &str = "e49bf7a8-fc0d-45af-a6f7-0604f0c18dc6";

// ─── Ed25519 Signature Verification ──────────────────────────────────────────
// TODO(SECURITY): Replace this with your real Keygen Ed25519 public key.
//   Find it at: Keygen Dashboard → Settings → Public Key (or Cryptography tab)
//   It should look like: "MCowBQYDK2VwAyEA..." (base64-encoded DER)
//   WITHOUT this key, licenses can only be validated online via API calls.
//   WITH this key, signed license files can be verified fully offline.
//   ⚠️  DO NOT generate your own key pair — use the one from your Keygen account.
const KEYGEN_VERIFY_KEY: Option<&str> = None;

// License cache filename
const LICENSE_CACHE_FILE: &str = "license.json";

// ─── Types ───────────────────────────────────────────────────────────────────

/// Cached license stored on disk. Contains all data needed to verify
/// the license without hitting the Keygen API on every launch.
#[derive(Debug, Serialize, Deserialize)]
struct CachedLicense {
    /// SHA-256 hash of the license key — NOT the plaintext key
    key_hash: String,
    /// Machine fingerprint at time of activation — checked on every load
    fingerprint: String,
    /// Keygen license ID
    license_id: String,
    /// License status from Keygen (e.g. "ACTIVE", "EXPIRING", etc.)
    status: String,
    /// Expiry timestamp (ISO 8601) or null for perpetual licenses
    expiry: Option<String>,
    /// Unix timestamp when this cache was written
    activated_at: u64,
    /// Raw Keygen validation response for future Ed25519 verification
    raw_response: String,
}

/// Keygen validate-key API response
#[derive(Debug, Deserialize)]
struct KeygenValidationResponse {
    meta: Option<KeygenMeta>,
    data: Option<KeygenLicenseData>,
    errors: Option<Vec<KeygenError>>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct KeygenMeta {
    valid: Option<bool>,
    detail: Option<String>,
    code: Option<String>,
    #[serde(default)]
    constant: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct KeygenLicenseData {
    id: Option<String>,
    #[serde(rename = "type")]
    data_type: Option<String>,
    attributes: Option<KeygenLicenseAttributes>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct KeygenLicenseAttributes {
    key: Option<String>,
    status: Option<String>,
    expiry: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct KeygenError {
    title: Option<String>,
    detail: Option<String>,
    code: Option<String>,
}

/// Keygen machine creation response
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct KeygenMachineResponse {
    data: Option<serde_json::Value>,
    errors: Option<Vec<KeygenError>>,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Get the license cache file path.
/// Uses the OS-appropriate app data directory (e.g. %APPDATA% on Windows).
fn get_license_cache_path() -> Result<PathBuf, String> {
    let data_dir = dirs::data_dir()
        .ok_or_else(|| "Could not determine app data directory".to_string())?;
    let app_dir = data_dir.join("com.fixary.repair-management");
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    Ok(app_dir.join(LICENSE_CACHE_FILE))
}

/// Hash a license key using SHA-256 so we never store plaintext keys on disk.
fn hash_key(key: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Read and validate the cached license from disk.
/// Returns None if the file is missing, corrupted, or the fingerprint doesn't match.
/// This is the FAIL-CLOSED behavior: any problem → not licensed.
fn read_cached_license() -> Option<CachedLicense> {
    let path = get_license_cache_path().ok()?;

    // Missing file → not licensed
    let contents = fs::read_to_string(&path).ok()?;

    // Corrupted/malformed JSON → not licensed
    let cached: CachedLicense = serde_json::from_str(&contents).ok()?;

    // Fingerprint mismatch (e.g. cloned disk, different machine) → not licensed
    let current_fingerprint = get_device_id();
    if cached.fingerprint != current_fingerprint {
        eprintln!(
            "[license] Fingerprint mismatch: cached='{}' current='{}'. Rejecting cached license.",
            &cached.fingerprint[..8.min(cached.fingerprint.len())],
            &current_fingerprint[..8.min(current_fingerprint.len())]
        );
        return None;
    }

    // Check expiry if present
    if let Some(ref expiry_str) = cached.expiry {
        if let Ok(expiry) = chrono::DateTime::parse_from_rfc3339(expiry_str) {
            if expiry < chrono::Utc::now() {
                eprintln!("[license] Cached license has expired ({}). Rejecting.", expiry_str);
                return None;
            }
        }
    }

    // If we had an Ed25519 key, we'd verify the raw_response signature here
    if KEYGEN_VERIFY_KEY.is_none() {
        // This is logged once per launch so it stays visible
        eprintln!(
            "[license] WARNING: Ed25519 verification key not configured. \
             License is validated via cached API response only. \
             Set KEYGEN_VERIFY_KEY in license.rs for offline signature verification."
        );
    } else {
        // TODO(SECURITY): Implement Ed25519 verification of cached.raw_response
        // using ed25519_dalek and the KEYGEN_VERIFY_KEY constant.
        // See: https://keygen.sh/docs/api/signatures/
        let _ = verify_signature(&cached.raw_response);
    }

    Some(cached)
}

/// Placeholder for Ed25519 signature verification.
/// When KEYGEN_VERIFY_KEY is set, this should verify the signed API response.
#[allow(unused)]
fn verify_signature(raw_response: &str) -> Result<bool, String> {
    let _key_b64 = match KEYGEN_VERIFY_KEY {
        Some(k) => k,
        None => return Err("No verification key configured".to_string()),
    };

    // TODO(SECURITY): Implement actual verification:
    // 1. Parse the Keygen-Signature header from the raw_response
    // 2. Decode the base64 public key into ed25519_dalek::VerifyingKey
    // 3. Verify the response body against the signature
    // Example:
    //   use ed25519_dalek::{VerifyingKey, Signature, Verifier};
    //   use base64::engine::general_purpose::STANDARD;
    //   let key_bytes = STANDARD.decode(key_b64).map_err(|e| e.to_string())?;
    //   let verifying_key = VerifyingKey::from_bytes(&key_bytes.try_into().unwrap())
    //       .map_err(|e| e.to_string())?;
    //   let signature = Signature::from_bytes(&sig_bytes.try_into().unwrap());
    //   verifying_key.verify(response_body, &signature).map_err(|e| e.to_string())?;

    Err("Ed25519 verification not yet implemented".to_string())
}

/// Build an HTTP client with reasonable timeouts
fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

/// Call Keygen validate-key API
async fn keygen_validate_key(
    client: &reqwest::Client,
    key: &str,
    fingerprint: &str,
) -> Result<(KeygenValidationResponse, String), String> {
    let url = format!(
        "https://api.keygen.sh/v1/accounts/{}/licenses/actions/validate-key",
        ACCOUNT_ID
    );

    let body = serde_json::json!({
        "meta": {
            "key": key,
            "scope": {
                "product": PRODUCT_ID,
                "policy": POLICY_ID,
                "fingerprint": fingerprint,
            }
        }
    });

    let response = client
        .post(&url)
        .header("Content-Type", "application/vnd.api+json")
        .header("Accept", "application/vnd.api+json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error contacting Keygen: {}", e))?;

    let raw_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read Keygen response: {}", e))?;

    let parsed: KeygenValidationResponse = serde_json::from_str(&raw_text)
        .map_err(|e| format!("Failed to parse Keygen response: {}", e))?;

    Ok((parsed, raw_text))
}

/// Call Keygen machine activation API
async fn keygen_activate_machine(
    client: &reqwest::Client,
    key: &str,
    fingerprint: &str,
    license_id: Option<&str>,
) -> Result<KeygenMachineResponse, String> {
    let url = format!(
        "https://api.keygen.sh/v1/accounts/{}/machines",
        ACCOUNT_ID
    );

    let mut machine_data = serde_json::json!({
        "data": {
            "type": "machines",
            "attributes": {
                "fingerprint": fingerprint,
                "platform": "Tauri/Windows",
                "name": "Fixary POS Device"
            }
        }
    });

    // Add license relationship if we have the ID
    if let Some(lid) = license_id {
        machine_data["data"]["relationships"] = serde_json::json!({
            "license": {
                "data": { "type": "licenses", "id": lid }
            }
        });
    }

    let response = client
        .post(&url)
        .header("Content-Type", "application/vnd.api+json")
        .header("Accept", "application/vnd.api+json")
        .header("Authorization", format!("License {}", key))
        .json(&machine_data)
        .send()
        .await
        .map_err(|e| format!("Network error during machine activation: {}", e))?;

    let parsed: KeygenMachineResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse machine activation response: {}", e))?;

    Ok(parsed)
}

// ─── Tauri Commands ──────────────────────────────────────────────────────────

/// Activate a license key. This is the main entry point called from the frontend.
///
/// Flow:
///   1. Get machine fingerprint
///   2. Validate key with Keygen API
///   3. If fingerprint mismatch, auto-activate machine then retry
///   4. On success, cache the signed response to disk
///   5. Return success message or error
#[tauri::command]
pub async fn activate_license(key: String) -> Result<String, String> {
    let key = key.trim().to_string();
    if key.is_empty() {
        return Err("License key cannot be empty".to_string());
    }

    let fingerprint = get_device_id();
    let client = http_client()?;

    // First validation attempt
    let (mut data, mut raw_response) = keygen_validate_key(&client, &key, &fingerprint).await?;

    // If machine is not activated (fingerprint mismatch), try to activate it
    if let Some(ref meta) = data.meta {
        if meta.code.as_deref() == Some("FINGERPRINT_SCOPE_MISMATCH") {
            eprintln!("[license] Machine not activated. Attempting activation...");

            let license_id = data.data.as_ref().and_then(|d| d.id.as_deref());
            let activation = keygen_activate_machine(&client, &key, &fingerprint, license_id).await?;

            if let Some(errors) = activation.errors {
                if !errors.is_empty() {
                    let detail = errors[0]
                        .detail
                        .as_deref()
                        .unwrap_or("Machine activation failed");

                    if detail.contains("not allowed by policy") {
                        return Err(
                            "Activation Policy Error: Your license policy does not allow \
                             machine activation using the license key. Please go to your \
                             Keygen Dashboard > Policies > Edit > Authentication and enable \
                             'Allow license keys to create machines'."
                                .to_string(),
                        );
                    }

                    return Err(detail.to_string());
                }
            }

            eprintln!("[license] Machine activated successfully. Retrying validation...");

            // Brief delay for propagation
            tokio::time::sleep(Duration::from_secs(1)).await;

            // Retry validation
            let retry = keygen_validate_key(&client, &key, &fingerprint).await?;
            data = retry.0;
            raw_response = retry.1;
        }
    }

    // Check for API errors
    if let Some(errors) = &data.errors {
        if !errors.is_empty() {
            let detail = errors[0]
                .detail
                .as_deref()
                .unwrap_or("Validation failed");
            return Err(detail.to_string());
        }
    }

    // Check validation result
    let meta = data.meta.as_ref().ok_or("Missing meta in Keygen response")?;
    let valid = meta.valid.unwrap_or(false);

    if !valid {
        let detail = meta.detail.as_deref().unwrap_or("Unknown");
        let code = meta.code.as_deref().unwrap_or("UNKNOWN");
        return Err(format!("Activation failed: {} (Code: {})", detail, code));
    }

    // Success — cache the license to disk
    let license_data = data.data.as_ref();
    let cached = CachedLicense {
        key_hash: hash_key(&key),
        fingerprint,
        license_id: license_data
            .and_then(|d| d.id.as_deref())
            .unwrap_or("unknown")
            .to_string(),
        status: license_data
            .and_then(|d| d.attributes.as_ref())
            .and_then(|a| a.status.as_deref())
            .unwrap_or("ACTIVE")
            .to_string(),
        expiry: license_data
            .and_then(|d| d.attributes.as_ref())
            .and_then(|a| a.expiry.clone()),
        activated_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        raw_response,
    };

    let cache_path = get_license_cache_path()?;
    let json = serde_json::to_string_pretty(&cached)
        .map_err(|e| format!("Failed to serialize license cache: {}", e))?;
    fs::write(&cache_path, &json)
        .map_err(|e| format!("Failed to write license cache to disk: {}", e))?;

    eprintln!("[license] License activated and cached to {:?}", cache_path);

    Ok("License activated successfully".to_string())
}

/// Check if the current machine has a valid cached license.
///
/// This is called on every app launch and whenever the frontend needs to gate features.
/// It performs these checks on every call (fail-closed):
///   1. Cache file exists and is readable
///   2. JSON is well-formed
///   3. Machine fingerprint matches current device
///   4. License has not expired
///   5. (Future) Ed25519 signature is valid
///
/// If ANY check fails, returns false. No exceptions, no fallbacks.
#[tauri::command]
pub fn is_licensed() -> bool {
    read_cached_license().is_some()
}

/// Remove the cached license. Used when the user wants to deactivate.
#[tauri::command]
pub fn deactivate_license() -> Result<(), String> {
    let path = get_license_cache_path()?;
    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to remove license cache: {}", e))?;
        eprintln!("[license] License cache removed from {:?}", path);
    }
    Ok(())
}
