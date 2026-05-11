export type StubCustomer = {
  id: string;
  displayName: string;
  tier: string;
};

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base || base.length === 0) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

/** POST /update-account — Bearer = current Keycloak access token */
export async function updateAccount(accessToken: string): Promise<{ customerId: string }> {
  const res = await fetch(`${getApiBaseUrl()}/update-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  try {
    return JSON.parse(text) as { customerId: string };
  } catch {
    throw new Error(text || "Invalid JSON from POST /update-account");
  }
}

/** GET /customer — Bearer must include customer_id claim */
export async function getCustomer(accessToken: string): Promise<StubCustomer> {
  const res = await fetch(`${getApiBaseUrl()}/customer`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  try {
    return JSON.parse(text) as StubCustomer;
  } catch {
    throw new Error(text || "Invalid JSON from GET /customer");
  }
}
