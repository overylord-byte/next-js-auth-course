/**
 * Central place for Keycloak-related environment variables.
 *
 * Setup checklist (realm that issues tokens for your SPA/API):
 * - Local dev: admin password grant (`admin-cli` in `master`) updates users in `KEYCLOAK_TARGET_REALM` (or `KEYCLOAK_REALM`).
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
 * Realm used for the admin login request (password grant with `admin-cli` is usually `master`).
 */
export function getKeycloakAdminRealm(): string {
  return process.env.KEYCLOAK_ADMIN_REALM ?? "master";
}

/**
 * Realm that contains application users for Admin API CRUD (`users.findOne`, `users.update`).
 * Defaults to the same realm as access-token issuer (`KEYCLOAK_REALM`).
 */
export function getKeycloakTargetRealm(): string {
  return process.env.KEYCLOAK_TARGET_REALM ?? getKeycloakPublicConfig().realm;
}

/** Client id for direct-access grant (local dev: `admin-cli`). Separate from confidential SPA clients. */
export function getKeycloakAdminPasswordClientId(): string {
  return process.env.KEYCLOAK_ADMIN_AUTH_CLIENT_ID?.trim() || "admin-cli";
}

export function getKeycloakAdminPasswordCredentials(): {
  clientId: string;
  username: string;
  password: string;
} {
  const clientId = getKeycloakAdminPasswordClientId();
  const username = process.env.KEYCLOAK_ADMIN_USERNAME;
  const password = process.env.KEYCLOAK_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "KEYCLOAK_ADMIN_USERNAME and KEYCLOAK_ADMIN_PASSWORD must be set for POST /update-account",
    );
  }

  return { clientId, username, password };
}

/** Optional: set to your API resource client_id if you want strict `aud` validation. */
export function getOptionalJwtAudience(): string | undefined {
  const aud = process.env.KEYCLOAK_JWT_AUDIENCE;
  return aud && aud.length > 0 ? aud : undefined;
}
