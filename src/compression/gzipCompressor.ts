import { gunzip, gzip } from "node:zlib";
import { promisify } from "node:util";
import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";
import type { ICompressor } from "./types.js";

const gunzipAsync = promisify(gunzip);
const gzipAsync = promisify(gzip);

/**
 * Default {@link ICompressor} backed by Node's zlib. The wire format is a
 * gzip-compressed JSON serialization of the data model.
 */
export class GzipCompressor implements ICompressor {
    public async decompressToDataModel(gzipData: Buffer): Promise<CrosslyDataModel> {
        const json = await gunzipAsync(gzipData);
        return JSON.parse(json.toString("utf8")) as CrosslyDataModel;
    }

    public async compressToBuffer(dataModel: CrosslyDataModel): Promise<Buffer> {
        const json = JSON.stringify(dataModel);
        return await gzipAsync(Buffer.from(json, "utf8"));
    }
}
