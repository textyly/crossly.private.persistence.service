import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PatternsController } from "./controllers/patternsController.js";
import { PatternsManager } from "./managers/patternsManager.js";
import { Validator } from "./validation/validator.js";
import { GzipCompressor } from "./compression/gzipCompressor.js";
import { Converter } from "./conversion/converter.js";
import { ApiGenerator } from "./hateoas/apiGenerator.js";
import { requireClient } from "./auth/requireClient.js";
import type { IPatternsRepository } from "./repository/types.js";

// Browser origin allowed to send the credentialed (cookie-bearing) requests.
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5000";

/**
 * Builds the configured Express application (credentialed CORS, cookie parsing,
 * /health, and the cookie-protected patterns API) for a given repository, WITHOUT
 * binding a port. The entry point (app.ts) and the integration tests share this
 * factory; only the injected repository differs.
 *
 * Body parsing is intentionally per-route (in the controller): create/replace take
 * raw gzip bytes, rename takes JSON — so there is no global JSON parser here.
 */
export function createApp(repository: IPatternsRepository): Express {
    const app = express();

    // Credentialed CORS so the browser sends the httpOnly session cookie.
    app.use(cors({ origin: corsOrigin, credentials: true }));
    app.use(cookieParser());

    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    const validator = new Validator();
    const compressor = new GzipCompressor();
    const converter = new Converter();
    const apiGenerator = new ApiGenerator();

    const manager = new PatternsManager(repository, validator, converter, compressor, apiGenerator);
    const controller = new PatternsController(manager, validator);

    // requireClient verifies the session cookie and sets req.clientId for every
    // pattern route, so handlers only ever act on the caller's own patterns.
    app.use("/api/v1/patterns", requireClient, controller.router);

    return app;
}
