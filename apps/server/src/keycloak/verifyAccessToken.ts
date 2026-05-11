import * as jose from 'jose';
import { getKeycloakIssuer, getKeycloakJwksUri, getOptionalJwtAudience } from '@/keycloak/env';

let jwks: ReturnType<typeof jose.createRemoteJWKSet> | undefined;

function getJwks(): ReturnType<typeof jose.createRemoteJWKSet> {
    if (!jwks) {
        // Cached JWKS fetch — mirrors how production APIs validate Keycloak-issued JWTs.
        jwks = jose.createRemoteJWKSet(new URL(getKeycloakJwksUri()));
    }
    return jwks;
}

/**
 * Validates signature + issuer (+ optional audience) for an access token from Keycloak.
 * This is the gate for every protected route in the learning flow.
 */
export async function verifyKeycloakAccessToken(token: string): Promise<jose.JWTPayload> {
    try {
      console.log('Before verifyKeycloakAccessToken');
  
      const issuer = getKeycloakIssuer();
      const audience = getOptionalJwtAudience();
  
      console.log('issuer', issuer);
      console.log('audience', audience);
      console.log('jwksUri', getKeycloakJwksUri());
  
      const { payload } = await jose.jwtVerify(token, getJwks(), {
        issuer,
        ...(audience ? { audience } : {}),
      });
  
      return payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      throw error;
    }
  }