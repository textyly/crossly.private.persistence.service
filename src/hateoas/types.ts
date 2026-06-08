import type { Link } from "@textyly/crossly-private-persistence-contracts";

/** Generates HATEOAS links for stored patterns (mirrors the .NET ApiGenerator). */
export interface IApiGenerator {
    generateLink(id: string): Link;
    generateLinks(ids: string[]): Link[];
}
