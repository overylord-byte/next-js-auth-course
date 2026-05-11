"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main style={{ padding: 24 }}>
      <p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer" type="button" onClick={() => void signIn("keycloak", { callbackUrl: "/users" })}>
          Login
        </button>
      </p>
    </main>
  );
}
