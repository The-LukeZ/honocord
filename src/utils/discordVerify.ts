import type { APIInteraction, APIWebhookEvent } from "discord-api-types/v10";
import { cloneRawRequest, type HonoRequest } from "hono/request";
import { BufferSource } from "../types";

export const subtleCrypto = crypto.subtle;

/**
 * Converts different types to Uint8Array.
 *
 * @param value - Value to convert. Strings are parsed as hex.
 * @param format - Format of value. Valid options: 'hex'. Defaults to utf-8.
 * @returns Value in Uint8Array form.
 */
export function valueToUint8Array(value: Uint8Array | ArrayBuffer | Buffer | string, format?: string): Uint8Array {
  if (value == null) {
    return new Uint8Array();
  }
  if (typeof value === "string") {
    if (format === "hex") {
      const matches = value.match(/.{1,2}/g);
      if (matches == null) {
        throw new Error("Value is not a valid hex string");
      }
      const hexVal = matches.map((byte: string) => Number.parseInt(byte, 16));
      return new Uint8Array(hexVal);
    }

    return new TextEncoder().encode(value);
  }
  try {
    if (Buffer.isBuffer(value)) {
      return new Uint8Array(value);
    }
  } catch (_ex) {
    // Runtime doesn't have Buffer
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  throw new Error("Unrecognized value type, must be one of: string, Buffer, ArrayBuffer, Uint8Array");
}

/**
 * Merge two arrays.
 *
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Concatenated arrays
 */
export function concatUint8Arrays(arr1: Uint8Array, arr2: Uint8Array): Uint8Array {
  const merged = new Uint8Array(arr1.length + arr2.length);
  merged.set(arr1);
  merged.set(arr2, arr1.length);
  return merged;
}

/**
 * Validates a payload from Discord against its signature and key.
 *
 * @param rawBody - The raw payload data
 * @param signature - The signature from the `X-Signature-Ed25519` header
 * @param timestamp - The timestamp from the `X-Signature-Timestamp` header
 * @param clientPublicKey - The public key from the Discord developer dashboard
 * @returns Whether or not validation was successful
 */
export async function verifyKey(
  rawBody: Uint8Array | ArrayBuffer | Buffer | string,
  signature: string | null,
  timestamp: string | null,
  clientPublicKey: string | CryptoKey
): Promise<boolean> {
  if (!signature || !timestamp) return false;
  try {
    const timestampData = valueToUint8Array(timestamp);
    const bodyData = valueToUint8Array(rawBody);
    const message = concatUint8Arrays(timestampData, bodyData);
    const publicKey =
      typeof clientPublicKey === "string"
        ? await subtleCrypto.importKey(
            "raw",
            valueToUint8Array(clientPublicKey, "hex").buffer as BufferSource,
            {
              name: "ed25519",
            },
            false,
            ["verify"]
          )
        : clientPublicKey;
    const isValid = await subtleCrypto.verify(
      {
        name: "ed25519",
      },
      publicKey,
      valueToUint8Array(signature, "hex").buffer as ArrayBuffer,
      message.buffer as ArrayBuffer
    );
    return isValid;
  } catch (_ex) {
    return false;
  }
}

export async function verifyDiscordRequest<T extends APIInteraction | APIWebhookEvent = APIInteraction>(
  req: HonoRequest,
  discordPublicKey: string | CryptoKey
) {
  const signature = req.header("x-signature-ed25519");
  const timestamp = req.header("x-signature-timestamp");
  const body = await (await cloneRawRequest(req)).text();
  const isValidRequest = signature && timestamp && (await verifyKey(body, signature, timestamp, discordPublicKey));
  if (!isValidRequest) {
    return { isValid: false } as const;
  }

  return { interaction: JSON.parse(body) as T, isValid: true } as const;
}
