import { Router } from 'express';
import { setKeycloakUserCustomerId } from '@/keycloak/setUserCustomerId';
import { requireBearerToken } from '@/middlewares/requireBearerToken.middleware';
import { generateCustomerId } from '@/utils/randomCustomerId';

export const updateAccountRouter = Router();

/**
 * Simulates: create customer in an external system → persist linkage on the Keycloak user.
 * The real claim appears only after the client obtains a fresh access token.
 */
updateAccountRouter.post('/update-account', requireBearerToken, async (req, res) => {
    const sub = req.accessTokenPayload?.sub;
    if (!sub) {
        res.status(401).json({ error: 'Unauthorized', message: 'Access token is missing sub (Keycloak user id)' });
        return;
    }

    try {
        const customerId = generateCustomerId();
        await setKeycloakUserCustomerId(sub, customerId);
        res.status(200).json({ customerId });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(502).json({
            error: 'Bad Gateway',
            message: 'Failed to update Keycloak user attributes',
            details: message,
        });
    }
});
