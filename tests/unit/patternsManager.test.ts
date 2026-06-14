import { expect } from "chai";
import { gzipSync } from "node:zlib";
import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";
import { PatternsManager } from "../../src/managers/patternsManager.js";
import { Validator } from "../../src/validation/validator.js";
import { Converter } from "../../src/conversion/converter.js";
import { GzipCompressor } from "../../src/compression/gzipCompressor.js";
import { ApiGenerator } from "../../src/hateoas/apiGenerator.js";
import { BadRequestError } from "../../src/errors.js";
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

const OWNER = "owner-1";

describe("PatternsManager", () => {
    const compressor = new GzipCompressor();
    let manager: PatternsManager;

    beforeEach(() => {
        manager = new PatternsManager(new InMemoryPatternsRepository(), new Validator(), new Converter(), compressor, new ApiGenerator());
    });

    it("creates a pattern and returns its link", async () => {
        const link = await manager.create(gzipOf(sample), OWNER);

        expect(link.getById).to.match(/^\/api\/v1\/patterns\//);
        expect(await manager.getAll(OWNER)).to.have.length(1);
    });

    it("round-trips the data model through create + getById (gzip)", async () => {
        const link = await manager.create(gzipOf(sample), OWNER);
        const id = link.getById.split("/").pop() as string;

        const compressed = await manager.getById(id, OWNER);
        expect(compressed).to.be.instanceOf(Buffer);

        const decoded = await compressor.decompressToDataModel(compressed as Buffer);
        expect(decoded).to.deep.equal(sample);
    });

    it("rejects an invalid data model with BadRequestError", async () => {
        let error: unknown;
        try {
            await manager.create(gzipOf({ ...sample, name: "" }), OWNER);
        } catch (caught) {
            error = caught;
        }
        expect(error).to.be.instanceOf(BadRequestError);
    });

    it("returns undefined for an unknown id", async () => {
        expect(await manager.getById("missing", OWNER)).to.equal(undefined);
    });

    it("renames and deletes", async () => {
        const link = await manager.create(gzipOf(sample), OWNER);
        const id = link.getById.split("/").pop() as string;

        expect(await manager.rename(id, "new name", OWNER)).to.equal(true);
        expect(await manager.delete(id, OWNER)).to.equal(true);
        expect(await manager.delete(id, OWNER)).to.equal(false);
    });

    it("scopes patterns by owner — another owner cannot see or mutate them", async () => {
        const link = await manager.create(gzipOf(sample), OWNER);
        const id = link.getById.split("/").pop() as string;

        expect(await manager.getAll("other-owner")).to.have.length(0);
        expect(await manager.getById(id, "other-owner")).to.equal(undefined);
        expect(await manager.rename(id, "hijacked", "other-owner")).to.equal(false);
        expect(await manager.delete(id, "other-owner")).to.equal(false);

        // The real owner is unaffected.
        expect(await manager.getAll(OWNER)).to.have.length(1);
    });
});
