import type { Link } from "@textyly/crossly-private-persistence-contracts";

/**
 * Pattern operations — the .NET `Repository` orchestration role: validation,
 * gzip (de)compression, version conversion, persistence and HATEOAS links.
 *
 * Throws `BadRequestError` for invalid client input (mapped to 400 by the
 * controller); other failures surface as errors (mapped to 500).
 */
export interface IPatternsManager {
    /** Links for every stored pattern. */
    getAll(): Promise<Link[]>;

    /** The gzip-compressed data model for `id`, or `undefined` if not found. */
    getById(id: string): Promise<Buffer | undefined>;

    /** Store a new pattern from a gzip body; returns its link. */
    create(gzipBody: Buffer): Promise<Link>;

    /** Replace the pattern `id` from a gzip body; `false` if not found. */
    replace(id: string, gzipBody: Buffer): Promise<boolean>;

    /** Rename the pattern `id`; `false` if not found. */
    rename(id: string, newName: string): Promise<boolean>;

    /** Delete the pattern `id`; `false` if not found. */
    delete(id: string): Promise<boolean>;
}
