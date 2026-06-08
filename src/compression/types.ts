import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";

/**
 * Gzip transport (de)compression. Request bodies arrive gzip-compressed and
 * `getById` responses are returned gzip-compressed, mirroring the .NET service.
 */
export interface ICompressor {
    decompressToDataModel(gzipData: Buffer): Promise<CrosslyDataModel>;
    compressToBuffer(dataModel: CrosslyDataModel): Promise<Buffer>;
}
