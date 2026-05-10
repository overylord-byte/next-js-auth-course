export type StubCustomer = {
    id: string;
    displayName: string;
    tier: 'free' | 'pro';
};

/** Fake profile returned by our API once the token carries a provisioned `customer_id`. */
export function getStubCustomer(customerId: string): StubCustomer {
    return {
        id: customerId,
        displayName: 'Acme Learning Co.',
        tier: 'free',
    };
}
