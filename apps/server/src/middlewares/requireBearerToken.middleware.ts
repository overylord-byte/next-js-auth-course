import type { NextFunction, Request, Response } from 'express';
import { verifyKeycloakAccessToken } from '@/keycloak/verifyAccessToken';

/**
 * Extracts `Authorization: Bearer <jwt>`, verifies it against Keycloak JWKS,
 * and attaches the payload to `req.accessTokenPayload` for downstream handlers.
 */
export async function requireBearerToken(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer access token' });
        return;
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
        res.status(401).json({ error: 'Unauthorized', message: 'Empty Bearer access token' });
        return;
    }

    try {
        req.accessTokenPayload = await verifyKeycloakAccessToken(token);
        next();
    } catch {
        // Intentionally generic — avoids leaking whether the token was malformed vs expired vs wrong issuer.
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired access token' });
    }
}
