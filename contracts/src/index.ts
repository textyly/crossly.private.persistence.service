/**
 * Shared contracts for the Crossly Private Persistence service.
 *
 * These types describe the cross-stitch pattern data model exchanged over the
 * service's API (gzip-compressed on the wire) plus the HATEOAS links it returns.
 * They mirror the data model of crossly.persistence.service (the .NET app this
 * service replaces) and are meant to be consumed by clients such as crossly.ui.
 * Keep this module free of runtime/server dependencies.
 */

/** Dots styling of the fabric. */
export interface DotsDataModel {
    color: string;
}

/** Thread styling of the fabric (the rendered grid threads). */
export interface FabricThreadsDataModel {
    color: string;
}

/** The fabric a pattern is stitched on. */
export interface FabricDataModel {
    name: string;
    columns: number;
    rows: number;
    color: string;
    dots: DotsDataModel;
    threads: FabricThreadsDataModel;
}

/** A thread (floss) used by the pattern. */
export interface ThreadDataModel {
    name: string;
    color: string;
    width: number;
}

/** An ordered needle path as parallel X/Y index arrays. */
export interface NeedlePathDataModel {
    indexesX: number[];
    indexesY: number[];
}

/** A single thread's path through the fabric. */
export interface ThreadPathDataModel {
    threadIndex: number;
    needlePath: NeedlePathDataModel;
}

/** The full cross-stitch pattern data model. */
export interface CrosslyDataModel {
    version: string;
    name: string;
    fabric: FabricDataModel;
    threads: ThreadDataModel[];
    pattern: ThreadPathDataModel[];
}

/** HATEOAS links returned for a stored pattern. */
export interface Link {
    getById: string;
    replace: string;
    rename: string;
    delete: string;
}

/** Response body of `GET /api/v1/patterns`. */
export interface GetAllResponse {
    links: Link[];
}

/** Response body of `POST /api/v1/patterns`. */
export interface CreateResponse {
    link: Link;
}

/** Request body of `PATCH /api/v1/patterns/{id}/rename`. */
export interface RenameRequest {
    newName: string;
}
