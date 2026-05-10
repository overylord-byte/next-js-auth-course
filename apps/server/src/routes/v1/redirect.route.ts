/**
 * Here I'm researching the CORS issue with different access control origin and location where
 * it will be redirected
 */
import {Router} from "express";

export const redirectRouter = Router();

//GET /api/v1/redirect/broken
redirectRouter.get('/broken', (_req, res) => {
    res.redirect(302, 'http://localhost:3001/api/v1/hello')
})
