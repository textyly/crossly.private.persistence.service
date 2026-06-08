import { expect } from "chai";
import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";
import { Converter, CONVERTER_VERSION } from "../../src/conversion/converter.js";

const model: CrosslyDataModel = {
    version: CONVERTER_VERSION,
    name: "pattern",
    fabric: { name: "f", columns: 1, rows: 1, color: "#fff", dots: { color: "#ccc" }, threads: { color: "#eee" } },
    threads: [],
    pattern: [],
};

describe("Converter", () => {
    const converter = new Converter();

    it("round-trips a model with the matching version", () => {
        expect(converter.toDocument(model)).to.deep.equal(model);
        expect(converter.toDataModel(model)).to.deep.equal(model);
    });

    it("throws on a version mismatch (toDocument)", () => {
        expect(() => converter.toDocument({ ...model, version: "9.9.9.9" })).to.throw();
    });

    it("throws on a version mismatch (toDataModel)", () => {
        expect(() => converter.toDataModel({ ...model, version: "9.9.9.9" })).to.throw();
    });
});
