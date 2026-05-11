import {
    getKeycloakAdminPasswordCredentials,
    getKeycloakAdminRealm,
    getKeycloakPublicConfig,
    getKeycloakTargetRealm,
} from '@/keycloak/env';

type KcAdminClientCtor = (typeof import('@keycloak/keycloak-admin-client'))['default'];

/** v26+ admin client is ESM-only; ts-node-dev runs as CJS — lazy dynamic import avoids require(ESM). */
let kcAdminClientClassPromise: Promise<KcAdminClientCtor> | undefined;

function loadKcAdminClientClass(): Promise<KcAdminClientCtor> {
    if (!kcAdminClientClassPromise) {
        kcAdminClientClassPromise = import('@keycloak/keycloak-admin-client').then((m) => m.default);
    }
    return kcAdminClientClassPromise;
}

/**
 * Writes `customer_id` as a Keycloak user attribute.
 * After refresh, a protocol mapper can surface the same name as a JWT claim for GET /customer.
 */
export async function setKeycloakUserCustomerId(keycloakUserId: string, customerId: string): Promise<void> {
    const KcAdminClient = await loadKcAdminClientClass();
    const { baseUrl } = getKeycloakPublicConfig();
    const adminAuthRealm = getKeycloakAdminRealm();
    const targetRealm = getKeycloakTargetRealm();
    const { clientId, username, password } = getKeycloakAdminPasswordCredentials();

    const admin = new KcAdminClient({
        baseUrl,
        realmName: adminAuthRealm,
    });

    console.log('[keycloak-admin] auth started (password grant)', { adminAuthRealm, clientId, username });
    // Admin access token — separate from the end-user Bearer token.
    // In production, cache the service admin token and refresh before expiry instead of logging in every request.
    await admin.auth({
        grantType: 'password',
        clientId,
        username,
        password,
    });
    console.log('[keycloak-admin] auth success');

    admin.setConfig({ realmName: targetRealm });
    console.log('[keycloak-admin] target realm for user API', targetRealm, 'keycloak user id', keycloakUserId);

    const user = await admin.users.findOne({ id: keycloakUserId });
    if (!user?.id) {
        console.log('[keycloak-admin] user not found', { keycloakUserId, targetRealm });
        throw new Error(`Keycloak user ${keycloakUserId} was not found`);
    }
    console.log('[keycloak-admin] user found', { id: user.id });

    const attributes = {
        ...(user.attributes ?? {}),
        customer_id: [customerId],
    };
    console.log('[keycloak-admin] customer_id generated (persisting)', { customerId });

    await admin.users.update({ id: user.id }, { ...user, attributes });
    console.log('[keycloak-admin] user update success', { id: user.id });
}
