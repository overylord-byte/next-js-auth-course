"use client";

import { getSession, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCustomer, updateAccount, type StubCustomer } from "@/lib/auth-lab/api";
import { accessTokenHasCustomerId } from "@/lib/auth-lab/decodeAccessToken";

export default function UsersPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [customer, setCustomer] = useState<StubCustomer | null>(null);
  const [busy, setBusy] = useState(false);

  const accessToken = session?.accessToken;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (!session?.accessToken) {
      setErrors(["Missing access token — redirecting to login."]);
      router.replace("/login");
    }
  }, [status, session, router]);

  const loadCustomer = useCallback(async (token: string) => {
    setErrors([]);
    try {
      const data = await getCustomer(token);
      setCustomer(data);
    } catch (e) {
      setCustomer(null);
      setErrors([
        "Get customer failed.",
        e instanceof Error ? e.message : String(e),
      ]);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    if (!accessTokenHasCustomerId(accessToken)) {
      setCustomer(null);
      return;
    }
    void loadCustomer(accessToken);
  }, [status, accessToken, loadCustomer]);

  const handleUpdateCustomer = async () => {
    setErrors([]);
    setCustomer(null);
    if (!accessToken) {
      setErrors(["Missing access token."]);
      return;
    }
    setBusy(true);
    try {
      await updateAccount(accessToken);
    } catch (e) {
      setErrors([
        "Update-account failed.",
        e instanceof Error ? e.message : String(e),
      ]);
      setBusy(false);
      return;
    }

    await update();

    const newSession = await getSession();
    const newToken = newSession?.accessToken;
    if (!newToken) {
      setErrors(["Session update did not provide new access token."]);
      setBusy(false);
      return;
    }

    if (!accessTokenHasCustomerId(newToken)) {
      setErrors([
        "customer_id is still missing in the access token after update().",
        "The backend updated Keycloak; NextAuth only replaces the access token when its normal JWT callback refresh path runs (typically after expiry), not because update() was called.",
      ]);
      setBusy(false);
      return;
    }

    try {
      const data = await getCustomer(newToken);
      setCustomer(data);
    } catch (e) {
      setErrors([
        "Get customer failed.",
        e instanceof Error ? e.message : String(e),
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <main style={{ padding: 24 }}>
        <p>Loading session…</p>
      </main>
    );
  }

  if (status === "unauthenticated" || !accessToken) {
    return (
      <main style={{ padding: 24 }}>
        <p>Redirecting to login…</p>
      </main>
    );
  }

  const hasCustomerId = accessTokenHasCustomerId(accessToken);

  return (
    <main style={{ padding: 24 }}>
      <h1>Users</h1>

      {session.error ? (
        <p style={{ color: "crimson" }}>Token/session error: {session.error}</p>
      ) : null}

      {errors.length > 0 ? (
        <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{errors.join("\n")}</pre>
      ) : null}

      {!hasCustomerId ? (
        <p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer" type="button" disabled={busy} onClick={() => void handleUpdateCustomer()}>
            Update customer with id
          </button>{" "}
          <button
            type="button"
            className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer"
            disabled={busy}
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            Logout
          </button>
        </p>
      ) : (
        <p>
          <button
            type="button"
            className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer"
            disabled={busy}
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            Logout
          </button>
        </p>
      )}

      {hasCustomerId && customer ? (
        <section style={{ marginTop: 16 }}>
          <p>Customer ID: {customer.id}</p>
          <p>First name: {session.user?.name?.split(/\s+/)[0] ?? "—"}</p>
          <p>
            Last name:{" "}
            {session.user?.name?.split(/\s+/).slice(1).join(" ") || "—"}
          </p>
          <p>Phone number: —</p>
          <p>Display name (stub): {customer.displayName}</p>
          <p>Tier: {customer.tier}</p>
        </section>
      ) : null}

      {hasCustomerId && !customer && errors.length === 0 ? (
        <p>Loading customer…</p>
      ) : null}
    </main>
  );
}
