import { ObjectId, type Collection, type MongoClient, type WithId } from "mongodb";
import type { IPatternsRepository, PatternDocument } from "./types.js";

/** Stored document: the pattern body plus the owning clientId (server-side metadata). */
type StoredPattern = PatternDocument & { owner: string };

/**
 * MongoDB-backed {@link IPatternsRepository}. Mirrors the .NET MongoDbPersistence
 * (same database/collection, generated ObjectId ids, `replace` matching id + name)
 * with one addition: every document carries an `owner` (the caller's clientId) and
 * every query is filtered by it, so a client only ever touches its own patterns.
 * `owner` is stripped from results, so the data model returned to clients is unchanged.
 */
export class MongoPatternsRepository implements IPatternsRepository {
    private readonly collection: Collection<StoredPattern>;

    public constructor(client: MongoClient, dbName: string = "CrosslyDb", collectionName: string = "DataModels") {
        this.collection = client.db(dbName).collection<StoredPattern>(collectionName);
    }

    public async getAllIds(owner: string): Promise<string[]> {
        const documents = await this.collection.find({ owner }, { projection: { _id: 1 } }).toArray();
        return documents.map((document) => document._id.toHexString());
    }

    public async getById(id: string, owner: string): Promise<PatternDocument | undefined> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return undefined;
        }

        const document = await this.collection.findOne({ _id: objectId, owner });
        return document ? this.stripInternal(document) : undefined;
    }

    public async create(document: PatternDocument, owner: string): Promise<string> {
        const result = await this.collection.insertOne({ ...document, owner });
        return result.insertedId.toHexString();
    }

    public async replace(id: string, document: PatternDocument, owner: string): Promise<boolean> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return false;
        }

        const result = await this.collection.replaceOne({ _id: objectId, owner }, { ...document, owner });
        return result.modifiedCount === 1;
    }

    public async rename(id: string, newName: string, owner: string): Promise<boolean> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return false;
        }

        const result = await this.collection.updateOne({ _id: objectId, owner }, { $set: { name: newName } });
        return result.modifiedCount === 1;
    }

    public async delete(id: string, owner: string): Promise<boolean> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return false;
        }

        const result = await this.collection.deleteOne({ _id: objectId, owner });
        return result.deletedCount === 1;
    }

    private toObjectId(id: string): ObjectId | undefined {
        return ObjectId.isValid(id) ? new ObjectId(id) : undefined;
    }

    private stripInternal(document: WithId<StoredPattern>): PatternDocument {
        const { _id, owner, ...body } = document;
        return body as PatternDocument;
    }
}
