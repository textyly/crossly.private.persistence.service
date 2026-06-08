import { expect } from "chai";
import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";
import { Validator } from "../../src/validation/validator.js";

const valid: CrosslyDataModel = {
    version: "0.0.0.1",
    name: "pattern",
    fabric: { name: "Aida 14", columns: 50, rows: 50, color: "#F5F5DC", dots: { color: "#d1d1d1" }, threads: { color: "#e5e5e5" } },
    threads: [{ name: "DMC 321", color: "#FF0000", width: 1 }],
    pattern: [{ threadIndex: 0, needlePath: { indexesX: [1, 2], indexesY: [3, 4] } }],
};

describe("Validator", () => {
    const validator = new Validator();

    it("accepts a valid data model", () => {
        expect(validator.isValidDataModel(valid)).to.equal(true);
    });

    it("rejects a missing name", () => {
        expect(validator.isValidDataModel({ ...valid, name: "" })).to.equal(false);
    });

    it("rejects a fabric with zero columns", () => {
        expect(validator.isValidDataModel({ ...valid, fabric: { ...valid.fabric, columns: 0 } })).to.equal(false);
    });

    it("rejects a thread with zero width", () => {
        expect(validator.isValidDataModel({ ...valid, threads: [{ name: "t", color: "#f00", width: 0 }] })).to.equal(false);
    });

    it("rejects mismatched needle path lengths", () => {
        expect(validator.isValidDataModel({ ...valid, pattern: [{ threadIndex: 0, needlePath: { indexesX: [1, 2], indexesY: [1] } }] })).to.equal(false);
    });

    it("rejects negative indexes", () => {
        expect(validator.isValidDataModel({ ...valid, pattern: [{ threadIndex: 0, needlePath: { indexesX: [-1], indexesY: [1] } }] })).to.equal(false);
    });

    it("accepts empty threads and pattern arrays", () => {
        expect(validator.isValidDataModel({ ...valid, threads: [], pattern: [] })).to.equal(true);
    });

    it("validates ids and names", () => {
        expect(validator.isValidId("x")).to.equal(true);
        expect(validator.isValidId(" ")).to.equal(false);
        expect(validator.isValidId(undefined)).to.equal(false);
        expect(validator.isValidName("")).to.equal(false);
    });
});
