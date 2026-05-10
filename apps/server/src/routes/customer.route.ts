import { Router } from 'express';
import { requireBearerToken } from '@/middlewares/requireBearerToken.middleware';
import { getStubCustomer } from '@/stubs/customer.stub';
import { getCustomerIdFromPayload } from '@/utils/jwtClaims';

export const customerRouter = Router();

/**
 * Learning flow (happy path):
 * 1) First token after login often has no `customer_id` yet → 403 here.
 * 2) Client calls POST /update-account to provision the attribute in Keycloak.
 * 3) After refresh, the mapper puts `customer_id` on the token → 200 with stub profile.
 */
customerRouter.get('/customer', requireBearerToken, (req, res) => {
    const customerId = getCustomerIdFromPayload(req.accessTokenPayload);

    if (!customerId) {
        res.status(403).json({
            error: 'Forbidden',
            message:
                'Access token is missing customer_id. Call POST /update-account, refresh the token, then retry.',
        });
        return;
    }

    res.json(getStubCustomer(customerId));
});
