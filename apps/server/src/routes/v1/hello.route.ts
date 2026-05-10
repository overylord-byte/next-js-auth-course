import { Router } from 'express';

export const helloRouter = Router();

// GET /api/v1/hello
helloRouter.get('/', (_req, res) => {
    res.json({
        message: 'Hello from mock server',
        version: 'v1'
    });
});