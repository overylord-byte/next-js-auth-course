/**
 * Central place for Keycloak-related environment variables.
 *
 * Setup checklist (realm that issues tokens for your SPA/API):
 * - Create a confidential client for Admin API (service account ON).
 * - Grant it realm-management roles (at least manage-users) OR use a narrower custom role policy.
 * - Add user attribute `customer_id` and a "User Attribute" protocol mapper so fresh tokens include the claim.
 */

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export type KeycloakPublicConfig = {
  baseUrl: string;
  realm: string;
};

export function getKeycloakPublicConfig(): KeycloakPublicConfig {
  const baseUrlRaw = process.env.KEYCLOAK_BASE_URL;
  const realm = process.env.KEYCLOAK_REALM;

  if (!baseUrlRaw || !realm) {
    throw new Error("KEYCLOAK_BASE_URL and KEYCLOAK_REALM must be set");
  }

  return { baseUrl: trimTrailingSlash(baseUrlRaw), realm };
}

/** Issuer and audience checks must match what Keycloak puts in access tokens. */
export function getKeycloakIssuer(): string {
  const { baseUrl, realm } = getKeycloakPublicConfig();
  return `${baseUrl}/realms/${realm}`;
}

export function getKeycloakJwksUri(): string {
  return `${getKeycloakIssuer()}/protocol/openid-connect/certs`;
}

/**
 * Realm used for client_credentials (service account). Defaults to the same realm as tokens
 * so a single-realm dev setup stays simple.
 */
export function getKeycloakAdminRealm(): string {
  return process.env.KEYCLOAK_ADMIN_REALM ?? getKeycloakPublicConfig().realm;
}

export function getKeycloakAdminClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "KEYCLOAK_ADMIN_CLIENT_ID and KEYCLOAK_ADMIN_CLIENT_SECRET must be set for POST /update-account",
    );
  }

  return { clientId, clientSecret };
}

/** Optional: set to your API resource client_id if you want strict `aud` validation. */
export function getOptionalJwtAudience(): string | undefined {
  const aud = process.env.KEYCLOAK_JWT_AUDIENCE;
  return aud && aud.length > 0 ? aud : undefined;
}
