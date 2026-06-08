import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";

/**
 * Converts between the domain data model and the stored document body, gating on
 * the data-model version (mirrors the .NET Converter). The document body is
 * structurally the data model; Mongo adds the `_id`.
 */
export interface IConverter {
    /** Validate version and produce the storable document body. */
    toDocument(dataModel: CrosslyDataModel): CrosslyDataModel;

    /** Validate version and produce the domain data model from a stored body. */
    toDataModel(document: CrosslyDataModel): CrosslyDataModel;
}
