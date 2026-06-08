import { expect } from "chai";
import request from "supertest";
import { gzipSync } from "node:zlib";
import type { CrosslyDataModel, CreateResponse, GetAllResponse } from "@textyly/crossly-private-persistence-contracts";
import { createApp } from "../../src/createApp.js";
import type { IPatternsRepository, PatternDocument } from "../../src/repository/types.js";

class InMemoryPatternsRepository implements IPatternsRepository {
    private readonly store: Map<string, PatternDocument> = new Map();
    private seq: number = 0;

    public async getAllIds(): Promise<string[]> { return [...this.store.keys()]; }
    public async getById(id: string): Promise<PatternDocument | undefined> { const d = this.store.get(id); return d ? { ...d } : undefined; }
    public async create(document: PatternDocument): Promise<string> { const id = `id-${++this.seq}`; this.store.set(id, { ...document }); return id; }
    public async replace(id: string, name: string, document: PatternDocument): Promise<boolean> { const e = this.store.get(id); if (!e || e.name !== name) return false; this.store.set(id, { ...document }); return true; }
    public async rename(id: string, newName: string): Promise<boolean> { const e = this.store.get(id); if (!e) return false; this.store.set(id, { ...e, name: newName }); return true; }
    public async delete(id: string): Promise<boolean> { return this.store.delete(id); }
}

const sample: CrosslyDataModel = {
    version: "0.0.0.1",
    name: "test pattern",
    fabric: { name: "Aida 14", columns: 50, rows: 50, color: "#F5F5DC", dots: { color: "#d1d1d1" }, threads: { color: "#e5e5e5" } },
    threads: [{ name: "DMC 321", color: "#FF0000", width: 1 }],
    pattern: [{ threadIndex: 0, needlePath: { indexesX: [4, 5, 4], indexesY: [4, 5, 6] } }],
};

const gzipOf = (model: CrosslyDataModel): Buffer => gzipSync(Buffer.from(JSON.stringify(model), "utf8"));

// Integration tests drive the full HTTP stack (controller -> manager -> repository)
// through supertest, using an in-memory repository so no database is required.
describe("patterns API (integration)", () => {
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        app = createApp(new InMemoryPatternsRepository());
    });

    const createOne = () =>
        request(app).post("/api/v1/patterns").set("Content-Type", "application/octet-stream").send(gzipOf(sample));

    it("GET /health returns ok", async () => {
        const response = await request(app).get("/health");
        expect(response.status).to.equal(200);
    });

    it("POST creates a pattern (201 + Location + link)", async () => {
        const response = await createOne();

        expect(response.status).to.equal(201);
        const body = response.body as CreateResponse;
        expect(body.link.getById).to.match(/^\/api\/v1\/patterns\//);
        expect(response.headers["location"]).to.equal(body.link.getById);
    });

    it("GET / lists one link per stored pattern", async () => {
        await createOne();
        const response = await request(app).get("/api/v1/patterns");

        expect(response.status).to.equal(200);
        expect((response.body as GetAllResponse).links).to.have.length(1);
    });

    it("GET /:id returns 200 with a gzip octet-stream body", async () => {
        const created = await createOne();
        const path = (created.body as CreateResponse).link.getById;

        const response = await request(app).get(path);

        expect(response.status).to.equal(200);
        expect(response.headers["content-type"]).to.contain("application/octet-stream");
    });

    it("PATCH /:id/rename renames an existing pattern", async () => {
        const created = await createOne();
        const id = (created.body as CreateResponse).link.getById.split("/").pop();

        const response = await request(app).patch(`/api/v1/patterns/${id}/rename`).send({ newName: "renamed" });
        expect(response.status).to.equal(200);
    });

    it("DELETE /:id deletes, then GET /:id is 404", async () => {
        const created = await createOne();
        const id = (created.body as CreateResponse).link.getById.split("/").pop();

        expect((await request(app).delete(`/api/v1/patterns/${id}`)).status).to.equal(204);
        expect((await request(app).get(`/api/v1/patterns/${id}`)).status).to.equal(404);
    });

    it("GET /:id returns 404 for an unknown id", async () => {
        expect((await request(app).get("/api/v1/patterns/missing")).status).to.equal(404);
    });

    it("POST with an invalid data model returns 400", async () => {
        const response = await request(app)
            .post("/api/v1/patterns")
            .set("Content-Type", "application/octet-stream")
            .send(gzipOf({ ...sample, name: "" }));

        expect(response.status).to.equal(400);
    });
});
