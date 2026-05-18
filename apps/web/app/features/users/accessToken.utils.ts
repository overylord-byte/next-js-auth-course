/**
 * Decodes JWT payload on the client for UI only — not a security check.
 */
export function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.split(".");
  const payloadSegment = parts[1];
  if (parts.length < 2 || !payloadSegment) return null;
  try {
    const payload = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCustomerIdFromAccessToken(accessToken: string): string | undefined {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return undefined;
  const raw = payload.customer_id;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return undefined;
}

export function accessTokenHasCustomerId(accessToken: string): boolean {
  return getCustomerIdFromAccessToken(accessToken) !== undefined;
}
