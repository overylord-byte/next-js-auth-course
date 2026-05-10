import express from 'express';
import {registerRoutes} from '@/routes';
import {loggerMiddleware} from "@/middleware/logger.middleware";
import cors from "cors";

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        })
    )

    app.use(express.json());
    app.use(loggerMiddleware);

    registerRoutes(app);

    app.get('/health', (_req, res) => res.json({ok: true}));

    return app;
}