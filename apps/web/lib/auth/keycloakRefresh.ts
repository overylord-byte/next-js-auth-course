import type { JWT } from "next-auth/jwt";

/**
 * Standard refresh-token exchange against Keycloak OIDC token endpoint.
 */
export async function refreshKeycloakAccessToken(token: JWT): Promise<JWT> {
  const issuer = process.env.KEYCLOAK_ISSUER?.replace(/\/$/, "");
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!issuer || !clientId || !clientSecret) {
    return { ...token, error: "RefreshMisconfigured" };
  }

  const refreshToken = token.refreshToken;
  if (!refreshToken || typeof refreshToken !== "string") {
    return { ...token, error: "MissingRefreshToken" };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }

  const accessToken = json.access_token;
  const newRefresh = json.refresh_token;
  const expiresIn = json.expires_in;

  if (typeof accessToken !== "string") {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const expiresInSec = typeof expiresIn === "number" ? expiresIn : 60;
  const expiresAt = Math.floor(Date.now() / 1000 + expiresInSec);

  return {
    ...token,
    accessToken,
    refreshToken: typeof newRefresh === "string" ? newRefresh : refreshToken,
    expiresAt,
    error: undefined,
  };
}
