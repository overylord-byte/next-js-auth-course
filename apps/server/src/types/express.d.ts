import type { JWTPayload } from 'jose';

declare global {
    namespace Express {
        interface Request {
            /** Payload of a verified Keycloak access token (after Bearer middleware). */
            accessTokenPayload?: JWTPayload;
        }
    }
}

export {};
