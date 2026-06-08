import { ObjectId, type Collection, type MongoClient, type WithId } from "mongodb";
import type { IPatternsRepository, PatternDocument } from "./types.js";

/**
 * MongoDB-backed {@link IPatternsRepository}. Mirrors the .NET MongoDbPersistence:
 * same database/collection, generated ObjectId ids, and `replace` that matches on
 * both id and name.
 */
export class MongoPatternsRepository implements IPatternsRepository {
    private readonly collection: Collection<PatternDocument>;

    public constructor(client: MongoClient, dbName: string = "CrosslyDb", collectionName: string = "DataModels") {
        this.collection = client.db(dbName).collection<PatternDocument>(collectionName);
    }

    public async getAllIds(): Promise<string[]> {
        const documents = await this.collection.find({}, { projection: { _id: 1 } }).toArray();
        return documents.map((document) => document._id.toHexString());
    }

    public async getById(id: string): Promise<PatternDocument | undefined> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return undefined;
        }

        const document = await this.collection.findOne({ _id: objectId });
        return document ? this.stripId(document) : undefined;
    }

    public async create(document: PatternDocument): Promise<string> {
        const result = await this.collection.insertOne(document);
        return result.insertedId.toHexString();
    }

    public async replace(id: string, name: string, document: PatternDocument): Promise<boolean> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return false;
        }

        const result = await this.collection.replaceOne({ _id: objectId, name }, document);
        return result.modifiedCount === 1;
    }

    public async rename(id: string, newName: string): Promise<boolean> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return false;
        }

        const result = await this.collection.updateOne({ _id: objectId }, { $set: { name: newName } });
        return result.modifiedCount === 1;
    }

    public async delete(id: string): Promise<boolean> {
        const objectId = this.toObjectId(id);
        if (!objectId) {
            return false;
        }

        const result = await this.collection.deleteOne({ _id: objectId });
        return result.deletedCount === 1;
    }

    private toObjectId(id: string): ObjectId | undefined {
        return ObjectId.isValid(id) ? new ObjectId(id) : undefined;
    }

    private stripId(document: WithId<PatternDocument>): PatternDocument {
        const { _id, ...body } = document;
        return body as PatternDocument;
    }
}
