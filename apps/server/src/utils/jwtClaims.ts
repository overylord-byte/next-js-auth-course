import type { JWTPayload } from 'jose';

/**
 * Reads `customer_id` from the access token.
 * Keycloak usually exposes user attributes as string claims once a protocol mapper is configured.
 */
export function getCustomerIdFromPayload(payload: JWTPayload | undefined): string | undefined {
    if (!payload) return undefined;

    const raw = payload['customer_id'];
    if (typeof raw === 'string' && raw.length > 0) return raw;
    if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].length > 0) return raw[0];

    return undefined;
}
