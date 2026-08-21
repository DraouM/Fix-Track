import { invoke } from '@tauri-apps/api/core';

/**
 * Check if the current machine has a valid cached license.
 * All validation (fingerprint, expiry, file integrity) happens in Rust.
 * Returns false on any error — fail-closed.
 */
export async function isLicenseActive(): Promise<boolean> {
    try {
        return await invoke<boolean>('is_licensed');
    } catch (error) {
        console.error('Failed to check license status:', error);
        return false; // Fail closed
    }
}

/**
 * Activate a license key. Rust handles:
 *   - Machine fingerprint generation
 *   - Keygen API validation
 *   - Auto machine activation if needed
 *   - Caching the signed license to disk
 *
 * @returns Success message string
 * @throws Error with descriptive message on failure
 */
export async function validateLicenseKey(key: string): Promise<boolean> {
    await invoke<string>('activate_license', { key });
    return true;
}

/**
 * Remove the cached license from disk.
 */
export async function deactivateLicense(): Promise<void> {
    return invoke('deactivate_license');
}
