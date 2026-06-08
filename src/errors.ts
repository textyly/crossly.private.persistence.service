/** Thrown for client input that fails validation; mapped to HTTP 400 by the controller. */
export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BadRequestError";
    }
}
