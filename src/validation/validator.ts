import type {
    CrosslyDataModel,
    FabricDataModel,
    ThreadDataModel,
    ThreadPathDataModel,
} from "@textyly/crossly-private-persistence-contracts";
import type { IValidator } from "./types.js";

/**
 * Default {@link IValidator}. Replicates the validation rules of
 * crossly.persistence.service's .NET `Validator`.
 */
export class Validator implements IValidator {
    public isValidId(id: string | undefined): boolean {
        return typeof id === "string" && id.trim().length > 0;
    }

    public isValidName(name: string | undefined): boolean {
        return typeof name === "string" && name.trim().length > 0;
    }

    public isValidDataModel(dataModel: CrosslyDataModel | undefined): boolean {
        if (!dataModel || !this.isValidName(dataModel.name)) {
            return false;
        }

        return (
            this.isValidFabric(dataModel.fabric) &&
            this.isValidThreads(dataModel.threads) &&
            this.isValidPattern(dataModel.pattern)
        );
    }

    private isValidFabric(fabric: FabricDataModel | undefined): boolean {
        return (
            !!fabric &&
            !!fabric.name && fabric.name.length > 0 &&
            fabric.columns > 0 &&
            fabric.rows > 0 &&
            !!fabric.color && fabric.color.length > 0 &&
            !!fabric.dots && !!fabric.dots.color && fabric.dots.color.length > 0 &&
            !!fabric.threads && !!fabric.threads.color && fabric.threads.color.length > 0
        );
    }

    private isValidThreads(threads: ThreadDataModel[] | undefined): boolean {
        if (!Array.isArray(threads)) {
            return false;
        }

        for (const thread of threads) {
            if (
                !thread ||
                !thread.name || thread.name.length <= 0 ||
                !thread.color || thread.color.length <= 0 ||
                !(thread.width > 0)
            ) {
                return false;
            }
        }

        return true;
    }

    private isValidPattern(pattern: ThreadPathDataModel[] | undefined): boolean {
        if (!Array.isArray(pattern)) {
            return false;
        }

        for (const path of pattern) {
            const needlePath = path?.needlePath;
            if (
                !path ||
                path.threadIndex < 0 ||
                !needlePath ||
                !Array.isArray(needlePath.indexesX) ||
                !Array.isArray(needlePath.indexesY) ||
                needlePath.indexesX.length !== needlePath.indexesY.length
            ) {
                return false;
            }

            for (let i = 0; i < needlePath.indexesX.length; i++) {
                if (needlePath.indexesX[i] < 0 || needlePath.indexesY[i] < 0) {
                    return false;
                }
            }
        }

        return true;
    }
}
