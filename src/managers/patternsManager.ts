import type { Link } from "@textyly/crossly-private-persistence-contracts";
import { BadRequestError } from "../errors.js";
import type { ICompressor } from "../compression/types.js";
import type { IConverter } from "../conversion/types.js";
import type { IApiGenerator } from "../hateoas/types.js";
import type { IValidator } from "../validation/types.js";
import type { IPatternsRepository } from "../repository/types.js";
import type { IPatternsManager } from "./types.js";

/**
 * Default {@link IPatternsManager}. Mirrors the .NET `Repository`: it decompresses
 * and validates incoming data models, converts (version-gated) to the stored body,
 * persists, and compresses outgoing models — wiring together validator, compressor,
 * converter, persistence and the HATEOAS link generator.
 */
export class PatternsManager implements IPatternsManager {
    public constructor(
        private readonly repository: IPatternsRepository,
        private readonly validator: IValidator,
        private readonly converter: IConverter,
        private readonly compressor: ICompressor,
        private readonly apiGenerator: IApiGenerator,
    ) {}

    public async getAll(): Promise<Link[]> {
        const ids = await this.repository.getAllIds();
        return this.apiGenerator.generateLinks(ids);
    }

    public async getById(id: string): Promise<Buffer | undefined> {
        const document = await this.repository.getById(id);
        if (!document) {
            return undefined;
        }

        const dataModel = this.converter.toDataModel(document);
        if (!this.validator.isValidDataModel(dataModel)) {
            // A stored model should always be valid; surfacing as an internal error mirrors the .NET behavior.
            throw new Error("the retrieved data model is invalid");
        }

        return this.compressor.compressToBuffer(dataModel);
    }

    public async create(gzipBody: Buffer): Promise<Link> {
        const dataModel = await this.compressor.decompressToDataModel(gzipBody);
        if (!this.validator.isValidDataModel(dataModel)) {
            throw new BadRequestError("data model is invalid");
        }

        const document = this.converter.toDocument(dataModel);
        const id = await this.repository.create(document);
        return this.apiGenerator.generateLink(id);
    }

    public async replace(id: string, gzipBody: Buffer): Promise<boolean> {
        const dataModel = await this.compressor.decompressToDataModel(gzipBody);
        if (!this.validator.isValidDataModel(dataModel)) {
            throw new BadRequestError("data model is invalid");
        }

        const document = this.converter.toDocument(dataModel);
        return this.repository.replace(id, dataModel.name, document);
    }

    public rename(id: string, newName: string): Promise<boolean> {
        return this.repository.rename(id, newName);
    }

    public delete(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }
}
