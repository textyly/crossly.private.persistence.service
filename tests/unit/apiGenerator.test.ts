import { expect } from "chai";
import { ApiGenerator } from "../../src/hateoas/apiGenerator.js";

describe("ApiGenerator", () => {
    const generator = new ApiGenerator();

    it("builds the link set for an id", () => {
        expect(generator.generateLink("abc")).to.deep.equal({
            getById: "/api/v1/patterns/abc",
            replace: "/api/v1/patterns/abc",
            rename: "/api/v1/patterns/abc",
            delete: "/api/v1/patterns/abc",
        });
    });

    it("builds one link per id", () => {
        expect(generator.generateLinks(["a", "b"])).to.have.length(2);
    });
});
