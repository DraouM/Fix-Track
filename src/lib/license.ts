import { invoke } from '@tauri-apps/api/core';

export async function getDeviceId(): Promise<string> {
    try {
        const deviceId = await invoke<string>('get_device_id');
        return deviceId;
    } catch (error) {
        console.error('Failed to get device ID:', error);
        throw error;
    }
}

interface ValidationResponse {
    meta: {
        constant: string;
        valid: boolean;
        detail: string;
        code: string;
    };
    data?: {
        id: string;
        type: string;
        attributes: {
            key: string;
            status: string;
            expiry: string | null;
        };
    };
    errors?: Array<{ title: string; detail: string; code: string }>;
}

const LICENSE_KEY_STORAGE = 'fixary_license_key';

export function isLicenseActive(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(LICENSE_KEY_STORAGE);
}

export async function validateLicenseKey(key: string): Promise<boolean> {
    const deviceId = await getDeviceId();
    const accountId = 'gxuzi-com';
    const productId = 'fe3a98c7-0972-41eb-9806-8d47cbf77502';
    const policyId = 'e49bf7a8-fc0d-45af-a6f7-0604f0c18dc6';

    const validate = async () => {
        const response = await fetch(`https://api.keygen.sh/v1/accounts/${accountId}/licenses/actions/validate-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
            },
            body: JSON.stringify({
                meta: {
                    key: key,
                    scope: { product: productId, policy: policyId, fingerprint: deviceId },
                },
            }),
        });
        return response.json();
    };

    try {
        let data = await validate();

        // If machine is not activated (fingerprint mismatch), try to activate it
        if (data.meta?.code === 'FINGERPRINT_SCOPE_MISMATCH') {
            console.log('Machine not activated. Attempting activation...');

            const activateResponse = await fetch(`https://api.keygen.sh/v1/accounts/${accountId}/machines`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json',
                    'Authorization': `License ${key}` // Authenticate with the license key
                },
                body: JSON.stringify({
                    data: {
                        type: 'machines',
                        attributes: {
                            fingerprint: deviceId,
                            platform: 'Tauri/Windows', // You could make this dynamic
                            name: 'Fixary POS Device'
                        },
                        relationships: {
                            license: {
                                data: { type: 'licenses', id: data.data?.id } // We might not have the ID here if validation completely failed, but let's see. 
                                // Actually, validate-key response usually doesn't return the ID if invalid.
                                // We typically need to lookup the license first or just rely on the 'Authorization: License key' header to implicitly associate it.
                                // Keygen 'Authorization: License <key>' allows creating a machine FOR that license.
                            }
                        }
                    }
                })
            });

            const activationData = await activateResponse.json();

            if (activationData.errors) {
                console.error('Machine activation failed:', activationData.errors);
                const errorDetail = activationData.errors[0]?.detail || 'Machine activation failed';

                if (errorDetail.includes('not allowed by policy')) {
                    throw new Error(
                        "Activation Policy Error: Your license policy does not allow machine activation using the license key. " +
                        "Please go to your Keygen Dashboard > Policies > Edit > Authentication and enable 'Allow license keys to create machines'."
                    );
                }

                throw new Error(errorDetail);
            }

            console.log('Machine activated successfully. Retrying validation...');
            // Wait a moment for propagation
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Retry validation
            data = await validate();
        }

        if (data.errors) {
            console.error('License validation errors:', data.errors);
            throw new Error(data.errors[0]?.detail || 'Validation failed');
        }

        if (data.meta.valid) {
            localStorage.setItem(LICENSE_KEY_STORAGE, key);
            return true;
        } else {
            console.warn('License invalid:', data.meta.detail, 'Code:', data.meta.code);
            throw new Error(`Activation failed: ${data.meta.detail} (Code: ${data.meta.code})`);
        }

    } catch (error) {
        console.error('License validation error:', error);
        throw error;
    }
}
