import { expect } from "chai";
import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";
import { GzipCompressor } from "../../src/compression/gzipCompressor.js";

const model: CrosslyDataModel = {
    version: "0.0.0.1",
    name: "pattern",
    fabric: { name: "f", columns: 2, rows: 3, color: "#fff", dots: { color: "#ccc" }, threads: { color: "#eee" } },
    threads: [{ name: "t", color: "#f00", width: 1 }],
    pattern: [{ threadIndex: 0, needlePath: { indexesX: [1], indexesY: [2] } }],
};

describe("GzipCompressor", () => {
    const compressor = new GzipCompressor();

    it("round-trips a data model through gzip", async () => {
        const buffer = await compressor.compressToBuffer(model);

        expect(buffer).to.be.instanceOf(Buffer);
        expect(buffer.length).to.be.greaterThan(0);

        const decoded = await compressor.decompressToDataModel(buffer);
        expect(decoded).to.deep.equal(model);
    });
});
