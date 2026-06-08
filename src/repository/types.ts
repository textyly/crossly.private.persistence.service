import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";

/** Stored pattern body — structurally the data model; Mongo manages the `_id`. */
export type PatternDocument = CrosslyDataModel;

/**
 * Persistence boundary (the .NET `IPersistence` role). Works with hex ObjectId
 * strings and returns `undefined`/`false` when a pattern is not found.
 */
export interface IPatternsRepository {
    /** All stored pattern ids (hex ObjectId strings). */
    getAllIds(): Promise<string[]>;

    /** A single stored pattern body, or `undefined` if none exists for `id`. */
    getById(id: string): Promise<PatternDocument | undefined>;

    /** Insert a new pattern; returns its generated id. */
    create(document: PatternDocument): Promise<string>;

    /** Replace the pattern matching `id` AND `name`; `false` if no match. */
    replace(id: string, name: string, document: PatternDocument): Promise<boolean>;

    /** Rename the pattern with `id`; `false` if not found. */
    rename(id: string, newName: string): Promise<boolean>;

    /** Delete the pattern with `id`; `false` if not found. */
    delete(id: string): Promise<boolean>;
}
