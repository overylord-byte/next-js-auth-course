import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { refreshKeycloakAccessToken } from "@/auth/keycloakRefresh";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: {
        params: {
          scope: "openid email profile offline_access",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, trigger }) {
      if (account?.access_token) {
        const expiresAt =
          typeof account.expires_at === "number"
            ? account.expires_at
            : Math.floor(Date.now() / 1000 + 300);

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt,
        };
      }

      /**
       * Previous implementation:
       *
       * const expiresAtSec = token.expiresAt;
       * if (typeof expiresAtSec === "number" && Date.now() < expiresAtSec * 1000) {
       *   return token;
       * }
       *
       * if (!token.refreshToken) {
       *   return { ...token, error: "MissingRefreshToken" };
       * }
       *
       * return refreshKeycloakAccessToken(token);
       */

      if (!token.refreshToken) {
        return { ...token, error: "MissingRefreshToken" };
      }

      /**
       * Manual session update.
       *
       * This is needed for the learning case:
       * 1. backend updates customer_id in Keycloak
       * 2. current access token is still valid, but old
       * 3. client calls useSession().update()
       * 4. NextAuth should force refresh access token
       */
      if (trigger === "update") {
        return refreshKeycloakAccessToken(token);
      }

      const expiresAtSec = token.expiresAt;

      if (typeof expiresAtSec === "number" && Date.now() < expiresAtSec * 1000) {
        return token;
      }

      return refreshKeycloakAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;

      session.error = typeof token.error === "string" ? token.error : undefined;

      return session;
    },
  },
};
