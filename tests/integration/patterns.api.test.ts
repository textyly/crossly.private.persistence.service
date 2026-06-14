import { expect } from "chai";
import request from "supertest";
import { gzipSync } from "node:zlib";
import { SignJWT } from "jose";
import type { CrosslyDataModel, CreateResponse, GetAllResponse } from "@textyly/crossly-private-persistence-contracts";
import { createApp } from "../../src/createApp.js";
import type { IPatternsRepository, PatternDocument } from "../../src/repository/types.js";

class InMemoryPatternsRepository implements IPatternsRepository {
    private readonly store: Map<string, { owner: string; document: PatternDocument }> = new Map();
    private seq: number = 0;

    public async getAllIds(owner: string): Promise<string[]> {
        return [...this.store.entries()].filter(([, v]) => v.owner === owner).map(([id]) => id);
    }
    public async getById(id: string, owner: string): Promise<PatternDocument | undefined> {
        const e = this.store.get(id);
        return e && e.owner === owner ? { ...e.document } : undefined;
    }
    public async create(document: PatternDocument, owner: string): Promise<string> {
        const id = `id-${++this.seq}`;
        this.store.set(id, { owner, document: { ...document } });
        return id;
    }
    public async replace(id: string, document: PatternDocument, owner: string): Promise<boolean> {
        const e = this.store.get(id);
        if (!e || e.owner !== owner) return false;
        this.store.set(id, { owner, document: { ...document } });
        return true;
    }
    public async rename(id: string, newName: string, owner: string): Promise<boolean> {
        const e = this.store.get(id);
        if (!e || e.owner !== owner) return false;
        this.store.set(id, { owner, document: { ...e.document, name: newName } });
        return true;
    }
    public async delete(id: string, owner: string): Promise<boolean> {
        const e = this.store.get(id);
        if (!e || e.owner !== owner) return false;
        return this.store.delete(id);
    }
}

const sample: CrosslyDataModel = {
    version: "0.0.0.1",
    name: "test pattern",
    fabric: { name: "Aida 14", columns: 50, rows: 50, color: "#F5F5DC", dots: { color: "#d1d1d1" }, threads: { color: "#e5e5e5" } },
    threads: [{ name: "DMC 321", color: "#FF0000", width: 1 }],
    pattern: [{ threadIndex: 0, needlePath: { indexesX: [4, 5, 4], indexesY: [4, 5, 6] } }],
};

const gzipOf = (model: CrosslyDataModel): Buffer => gzipSync(Buffer.from(JSON.stringify(model), "utf8"));

// Mint a session cookie with the shared dev secret — exactly what the auth service issues.
const secret = new TextEncoder().encode("dev-only-insecure-secret-change-me");
async function sessionCookie(clientId: string, guest = false): Promise<string> {
    const token = await new SignJWT({ guest })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(clientId)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secret);
    return `crossly_session=${token}`;
}

// Integration tests drive the full HTTP stack (requireClient -> controller -> manager
// -> repository) through supertest, using an in-memory repository so no database is
// required. Identity comes from a session cookie; patterns are scoped to its clientId.
describe("patterns API (integration, cookie auth)", () => {
    let app: ReturnType<typeof createApp>;
    let cookieA: string;
    let cookieB: string;

    before(async () => {
        cookieA = await sessionCookie("owner-1");
        cookieB = await sessionCookie("owner-2");
    });

    beforeEach(() => {
        app = createApp(new InMemoryPatternsRepository());
    });

    const createOne = (cookie: string = cookieA) =>
        request(app)
            .post("/api/v1/patterns")
            .set("Cookie", cookie)
            .set("Content-Type", "application/octet-stream")
            .send(gzipOf(sample));

    const idOf = (created: request.Response): string =>
        (created.body as CreateResponse).link.getById.split("/").pop() as string;

    it("GET /health returns ok (no auth required)", async () => {
        const response = await request(app).get("/health");
        expect(response.status).to.equal(200);
    });

    it("rejects pattern routes with no session cookie (401)", async () => {
        expect((await request(app).get("/api/v1/patterns")).status).to.equal(401);
        expect(
            (await request(app).post("/api/v1/patterns").set("Content-Type", "application/octet-stream").send(gzipOf(sample))).status,
        ).to.equal(401);
    });

    it("POST creates a pattern (201 + Location + link)", async () => {
        const response = await createOne();

        expect(response.status).to.equal(201);
        const body = response.body as CreateResponse;
        expect(body.link.getById).to.match(/^\/api\/v1\/patterns\//);
        expect(response.headers["location"]).to.equal(body.link.getById);
    });

    it("GET / lists one link per stored pattern (for this client)", async () => {
        await createOne();
        const response = await request(app).get("/api/v1/patterns").set("Cookie", cookieA);

        expect(response.status).to.equal(200);
        expect((response.body as GetAllResponse).links).to.have.length(1);
    });

    it("GET /:id returns 200 with a gzip octet-stream body", async () => {
        const created = await createOne();
        const path = (created.body as CreateResponse).link.getById;

        const response = await request(app).get(path).set("Cookie", cookieA);

        expect(response.status).to.equal(200);
        expect(response.headers["content-type"]).to.contain("application/octet-stream");
    });

    it("PATCH /:id/rename renames an existing pattern", async () => {
        const created = await createOne();
        const id = idOf(created);

        const response = await request(app)
            .patch(`/api/v1/patterns/${id}`)
            .set("Cookie", cookieA)
            .send({ name: "renamed" });
        expect(response.status).to.equal(200);
    });

    it("DELETE /:id deletes, then GET /:id is 404", async () => {
        const created = await createOne();
        const id = idOf(created);

        expect((await request(app).delete(`/api/v1/patterns/${id}`).set("Cookie", cookieA)).status).to.equal(204);
        expect((await request(app).get(`/api/v1/patterns/${id}`).set("Cookie", cookieA)).status).to.equal(404);
    });

    it("GET /:id returns 404 for an unknown id", async () => {
        expect((await request(app).get("/api/v1/patterns/missing").set("Cookie", cookieA)).status).to.equal(404);
    });

    it("accepts a create that declares Content-Encoding: gzip (as the UI does)", async () => {
        const response = await request(app)
            .post("/api/v1/patterns")
            .set("Cookie", cookieA)
            .set("Content-Type", "application/octet-stream")
            .set("Content-Encoding", "gzip")
            .send(gzipOf(sample));

        expect(response.status).to.equal(201);
    });

    it("POST with an invalid data model returns 400", async () => {
        const response = await request(app)
            .post("/api/v1/patterns")
            .set("Cookie", cookieA)
            .set("Content-Type", "application/octet-stream")
            .send(gzipOf({ ...sample, name: "" }));

        expect(response.status).to.equal(400);
    });

    it("scopes patterns to the caller — another client cannot see or touch them", async () => {
        const created = await createOne(cookieA);
        const id = idOf(created);

        // owner-2 sees no patterns and cannot read/delete owner-1's.
        expect((await request(app).get("/api/v1/patterns").set("Cookie", cookieB)).body.links).to.have.length(0);
        expect((await request(app).get(`/api/v1/patterns/${id}`).set("Cookie", cookieB)).status).to.equal(404);
        expect((await request(app).delete(`/api/v1/patterns/${id}`).set("Cookie", cookieB)).status).to.equal(404);

        // owner-1 still has it.
        expect((await request(app).get("/api/v1/patterns").set("Cookie", cookieA)).body.links).to.have.length(1);
    });
});
