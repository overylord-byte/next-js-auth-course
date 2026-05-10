import { customerRouter } from '@/routes/customer.route';
import { updateAccountRouter } from '@/routes/updateAccount.route';
import type { Express } from 'express';

export function registerRoutes(app: Express) {
    app.use(customerRouter);
    app.use(updateAccountRouter);
}