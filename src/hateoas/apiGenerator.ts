import type { Link } from "@textyly/crossly-private-persistence-contracts";
import type { IApiGenerator } from "./types.js";

/** Base path of the patterns API; link paths mirror the controller routes exactly. */
const BASE_PATH: string = "/api/v1/patterns";

/**
 * Default {@link IApiGenerator}. All operations on a pattern share the `/{id}`
 * path, differentiated by HTTP method: GET/PUT/PATCH/DELETE (rename is a PATCH of
 * the `name`, so it no longer has its own `/rename` sub-path).
 */
export class ApiGenerator implements IApiGenerator {
    public generateLink(id: string): Link {
        return {
            getById: `${BASE_PATH}/${id}`,
            replace: `${BASE_PATH}/${id}`,
            rename: `${BASE_PATH}/${id}`,
            delete: `${BASE_PATH}/${id}`,
        };
    }

    public generateLinks(ids: string[]): Link[] {
        return ids.map((id) => this.generateLink(id));
    }
}
