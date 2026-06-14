import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";

/** Stored pattern body — structurally the data model; Mongo manages the `_id`. */
export type PatternDocument = CrosslyDataModel;

/**
 * Persistence boundary (the .NET `IPersistence` role). Works with hex ObjectId
 * strings and returns `undefined`/`false` when a pattern is not found.
 *
 * Every operation is scoped to an `owner` (the caller's clientId): a client only
 * ever sees and mutates its own patterns. `owner` is server-side metadata stored
 * alongside the document and never exposed in the returned {@link PatternDocument}.
 */
export interface IPatternsRepository {
    /** Ids (hex ObjectId strings) of the patterns owned by `owner`. */
    getAllIds(owner: string): Promise<string[]>;

    /** A single pattern body owned by `owner`, or `undefined` if none matches `id`. */
    getById(id: string, owner: string): Promise<PatternDocument | undefined>;

    /** Insert a new pattern owned by `owner`; returns its generated id. */
    create(document: PatternDocument, owner: string): Promise<string>;

    /** Replace the pattern `id` owned by `owner`; `false` if not found. */
    replace(id: string, document: PatternDocument, owner: string): Promise<boolean>;

    /** Rename the pattern `id` owned by `owner`; `false` if not found. */
    rename(id: string, newName: string, owner: string): Promise<boolean>;

    /** Delete the pattern `id` owned by `owner`; `false` if not found. */
    delete(id: string, owner: string): Promise<boolean>;
}
