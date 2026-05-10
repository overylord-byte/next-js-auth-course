import KcAdminClient from '@keycloak/keycloak-admin-client';
import {
    getKeycloakAdminClientCredentials,
    getKeycloakAdminRealm,
    getKeycloakPublicConfig,
} from '@/keycloak/env';

/**
 * Writes `customer_id` as a Keycloak user attribute.
 * After refresh, a protocol mapper can surface the same name as a JWT claim for GET /customer.
 */
export async function setKeycloakUserCustomerId(keycloakUserId: string, customerId: string): Promise<void> {
    const { baseUrl, realm: userRealm } = getKeycloakPublicConfig();
    const adminRealm = getKeycloakAdminRealm();
    const { clientId, clientSecret } = getKeycloakAdminClientCredentials();

    const admin = new KcAdminClient({
        baseUrl,
        realmName: adminRealm,
    });

    // Service account token — separate from the end-user access token on the wire.
    await admin.auth({
        grantType: 'client_credentials',
        clientId,
        clientSecret,
    });

    // User CRUD endpoints target the realm that owns the users, not necessarily the admin client's realm.
    admin.setConfig({ realmName: userRealm });

    const user = await admin.users.findOne({ id: keycloakUserId });
    if (!user?.id) {
        throw new Error(`Keycloak user ${keycloakUserId} was not found`);
    }

    const attributes = {
        ...(user.attributes ?? {}),
        customer_id: [customerId],
    };

    await admin.users.update({ id: user.id }, { ...user, attributes });
}
