function isCryptoWebCrypto(value: unknown): value is Crypto {
  return value !== null && typeof value === "object" && "getRandomValues" in value;
}

export function randomUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else if (typeof crypto !== "undefined" && "webcrypto" in crypto && isCryptoWebCrypto(crypto.webcrypto)) {
    crypto.webcrypto.getRandomValues(bytes);
  } else {
    throw new Error("No secure random source available");
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
