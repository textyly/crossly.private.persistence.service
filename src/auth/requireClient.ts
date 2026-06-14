import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE, verifySession } from "./session.js";

// Attach the verified clientId to the Express request so route handlers can read
// `req.clientId` after this middleware has run. (No guest flag — this service is
// identity-agnostic; how the caller authenticated is the auth service's concern.)
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            clientId?: string;
        }
    }
}

/**
 * Require a valid session cookie. Verifies the JWT (shared secret with the auth
 * service) and attaches `req.clientId`; responds 401 if the cookie is missing or
 * invalid. Every pattern route then scopes its work to `req.clientId`, so a client
 * can only ever read/write its own patterns.
 */
export async function requireClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== "string" || token.length === 0) {
        res.status(401).json({ error: "no session" });
        return;
    }

    try {
        req.clientId = await verifySession(token);
        next();
    } catch {
        res.status(401).json({ error: "invalid or expired session" });
    }
}
