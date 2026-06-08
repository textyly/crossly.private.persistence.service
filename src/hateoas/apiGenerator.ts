import type { Link } from "@textyly/crossly-private-persistence-contracts";
import type { IApiGenerator } from "./types.js";

/** Base path of the patterns API; link paths mirror the controller routes exactly. */
const BASE_PATH: string = "/api/v1/patterns";

/**
 * Default {@link IApiGenerator}. Produces the same link set as the .NET
 * ApiGenerator: getById/replace/delete point at `/{id}`, rename at `/{id}/rename`.
 */
export class ApiGenerator implements IApiGenerator {
    public generateLink(id: string): Link {
        return {
            getById: `${BASE_PATH}/${id}`,
            replace: `${BASE_PATH}/${id}`,
            rename: `${BASE_PATH}/${id}/rename`,
            delete: `${BASE_PATH}/${id}`,
        };
    }

    public generateLinks(ids: string[]): Link[] {
        return ids.map((id) => this.generateLink(id));
    }
}
