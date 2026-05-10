import { randomBytes } from 'node:crypto';

/** Simulates an id returned by an external CRM / billing system after account creation. */
export function generateCustomerId(): string {
    return `cust_${randomBytes(8).toString('hex')}`;
}
