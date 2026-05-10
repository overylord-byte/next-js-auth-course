import { Router, type Request, type Response } from "express";

export const searchRouter = Router();

type SearchItem = {
    id: string;
    title: string;
};

const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

// GET /api/v1/search?query=...
searchRouter.get(
    "/",
    async (
        req: Request<{}, SearchItem | { message: string }, {}, { query?: string }>,
        res: Response
    ) => {
        const query = String(req.query.query ?? "").trim();

        if (!query) {
            return res.status(400).json({ message: "Query param is required" });
        }

        await sleep(2000);

        if (query.toLowerCase().includes("test")) {
            const result: SearchItem = {
                id: "1",
                title: "Test item",
            };

            return res.status(200).json(result);
        }

        return res.status(404).json({ message: "No results found" });
    }
);