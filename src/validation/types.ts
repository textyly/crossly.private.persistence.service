import type { CrosslyDataModel } from "@textyly/crossly-private-persistence-contracts";

/** Validates client input and pattern data models. Mirrors the .NET Validator. */
export interface IValidator {
    isValidId(id: string | undefined): boolean;
    isValidName(name: string | undefined): boolean;
    isValidDataModel(dataModel: CrosslyDataModel | undefined): boolean;
}
