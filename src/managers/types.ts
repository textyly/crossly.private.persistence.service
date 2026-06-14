import type { Link } from "@textyly/crossly-private-persistence-contracts";

/**
 * Pattern operations — the .NET `Repository` orchestration role: validation,
 * gzip (de)compression, version conversion, persistence and HATEOAS links.
 *
 * Every operation is scoped to an `owner` (the caller's clientId), so a client
 * only ever sees and mutates its own patterns.
 *
 * Throws `BadRequestError` for invalid client input (mapped to 400 by the
 * controller); other failures surface as errors (mapped to 500).
 */
export interface IPatternsManager {
    /** Links for every pattern owned by `owner`. */
    getAll(owner: string): Promise<Link[]>;

    /** The gzip-compressed data model for `id` owned by `owner`, or `undefined`. */
    getById(id: string, owner: string): Promise<Buffer | undefined>;

    /** Store a new pattern (owned by `owner`) from a gzip body; returns its link. */
    create(gzipBody: Buffer, owner: string): Promise<Link>;

    /** Replace the pattern `id` owned by `owner` from a gzip body; `false` if not found. */
    replace(id: string, gzipBody: Buffer, owner: string): Promise<boolean>;

    /** Rename the pattern `id` owned by `owner`; `false` if not found. */
    rename(id: string, newName: string, owner: string): Promise<boolean>;

    /** Delete the pattern `id` owned by `owner`; `false` if not found. */
    delete(id: string, owner: string): Promise<boolean>;
}
