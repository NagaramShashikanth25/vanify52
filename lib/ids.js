/**
 * Server-only id generation. Kept out of lib/format.js because that file is
 * imported by client components, and node:crypto cannot be bundled for a browser.
 */
import { randomInt, randomUUID } from "node:crypto";

/** Unguessable row id — booking ids appear in URLs. */
export const uid = (prefix = "") => prefix + randomUUID().replace(/-/g, "").slice(0, 18);

/**
 * The start code is the only thing between a professional and marking a job
 * started without reaching the door, so it comes from the CSPRNG. Math.random
 * is predictable from a handful of earlier outputs.
 */
export const makeOtp = () => String(randomInt(1000, 10000));

export const makeRef = () => "VN" + randomInt(100000, 1000000);
