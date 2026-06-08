import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";
import type { IConverter } from "./types.js";

/** Bump on a breaking data-model change; must match the data model's `version`. */
export const CONVERTER_VERSION: string = "0.0.0.1";

/**
 * Default {@link IConverter}. Validates the data-model version on the way in and
 * out (throwing on mismatch, exactly like the .NET Converter) and copies the
 * document body. No `_id` mapping is needed — Mongo manages `_id` itself.
 */
export class Converter implements IConverter {
    public toDocument(dataModel: CrosslyDataModel): CrosslyDataModel {
        this.assertVersion(dataModel.version);
        return this.copy(dataModel);
    }

    public toDataModel(document: CrosslyDataModel): CrosslyDataModel {
        this.assertVersion(document.version);
        return this.copy(document);
    }

    private assertVersion(version: string): void {
        if (version !== CONVERTER_VERSION) {
            throw new Error(
                `version mismatch, converter version is ${CONVERTER_VERSION} whereas data model version is ${version}`,
            );
        }
    }

    private copy(model: CrosslyDataModel): CrosslyDataModel {
        return {
            version: model.version,
            name: model.name,
            fabric: model.fabric,
            threads: model.threads,
            pattern: model.pattern,
        };
    }
}
