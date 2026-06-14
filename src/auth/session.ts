import { jwtVerify } from "jose";

/** Session cookie name — MUST match the one set by crossly.client.auth.service. */
export const SESSION_COOKIE = "crossly_session";

// Shared HS256 secret with the auth service. The default matches the auth
// service's default so local dev works with zero configuration; override via
// AUTH_JWT_SECRET in any real environment (the same value across all services).
const secret = new TextEncoder().encode(
    process.env.AUTH_JWT_SECRET ?? "dev-only-insecure-secret-change-me",
);

/**
 * Verify a session JWT and return the caller's clientId (the token's subject).
 * Throws if the token is invalid or expired.
 *
 * This service is identity-agnostic: it only needs WHO the caller is (clientId),
 * never HOW they authenticated. The guest/login distinction and the
 * guest->account promotion live entirely in the auth service, and the clientId is
 * stable across that transition — so there is nothing for this service to know
 * about guests.
 *
 * Interim shared-secret model; becomes an RS256/JWKS check once a gateway
 * validates tokens — nothing else here changes.
 */
export async function verifySession(token: string): Promise<string> {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub as string;
}
