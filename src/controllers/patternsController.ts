import express, { Router, type Request, type Response } from "express";
import { BadRequestError } from "../errors.js";
import type { IValidator } from "../validation/types.js";
import type { IPatternsManager } from "../managers/types.js";

/** Upper bound for gzip request bodies. */
const MAX_BODY: string = "16mb";

/**
 * HTTP surface mirroring crossly.persistence.service's REST API, mounted under
 * `/api/v1/patterns`:
 *   GET    /                -> list HATEOAS links
 *   GET    /:id             -> gzip data model (application/octet-stream)
 *   POST   /                -> create from gzip body (201 + Location + { link })
 *   PUT    /:id             -> replace from gzip body (200/404)
 *   PATCH  /:id/rename       -> rename ({ newName }) (200/404)
 *   DELETE /:id             -> delete (204/404)
 */
export class PatternsController {
    public readonly router: Router;

    public constructor(
        private readonly manager: IPatternsManager,
        private readonly validator: IValidator,
    ) {
        this.router = Router();
        this.registerRoutes();
    }

    private registerRoutes(): void {
        // Per-route body parsers: create/replace receive raw gzip bytes; rename is JSON.
        const raw = express.raw({ type: "*/*", limit: MAX_BODY });
        const json = express.json();

        this.router.get("/", this.getAll);
        this.router.get("/:id", this.getById);
        this.router.post("/", raw, this.create);
        this.router.put("/:id", raw, this.replace);
        this.router.patch("/:id/rename", json, this.rename);
        this.router.delete("/:id", this.delete);
    }

    private readonly getAll = async (_req: Request, res: Response): Promise<void> => {
        const links = await this.manager.getAll();
        res.status(200).json({ links });
    };

    private readonly getById = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id;
        if (!this.validator.isValidId(id)) {
            res.status(400).json({ error: "id is not valid" });
            return;
        }

        const compressed = await this.manager.getById(id);
        if (!compressed) {
            res.status(404).end();
            return;
        }

        res.status(200).type("application/octet-stream").send(compressed);
    };

    private readonly create = async (req: Request, res: Response): Promise<void> => {
        const body = this.requireBuffer(req);
        if (!body) {
            res.status(400).json({ error: "data model is invalid" });
            return;
        }

        try {
            const link = await this.manager.create(body);
            res.status(201).location(link.getById).json({ link });
        } catch (error) {
            this.handleError(error, res);
        }
    };

    private readonly replace = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id;
        if (!this.validator.isValidId(id)) {
            res.status(400).json({ error: "id is not valid" });
            return;
        }

        const body = this.requireBuffer(req);
        if (!body) {
            res.status(400).json({ error: "data model is invalid" });
            return;
        }

        try {
            const replaced = await this.manager.replace(id, body);
            res.status(replaced ? 200 : 404).end();
        } catch (error) {
            this.handleError(error, res);
        }
    };

    private readonly rename = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id;
        const newName = req.body?.newName as string | undefined;

        if (!this.validator.isValidId(id) || !this.validator.isValidName(newName)) {
            res.status(400).json({ error: "id or newName is not valid" });
            return;
        }

        const renamed = await this.manager.rename(id, newName as string);
        res.status(renamed ? 200 : 404).end();
    };

    private readonly delete = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id;
        if (!this.validator.isValidId(id)) {
            res.status(400).json({ error: "id is not valid" });
            return;
        }

        const deleted = await this.manager.delete(id);
        res.status(deleted ? 204 : 404).end();
    };

    private requireBuffer(req: Request): Buffer | undefined {
        return Buffer.isBuffer(req.body) && req.body.length > 0 ? req.body : undefined;
    }

    private handleError(error: unknown, res: Response): void {
        if (error instanceof BadRequestError) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).end();
    }
}
