import { describe, it, expect } from "vitest";
import { challengeSubmissions } from "@mirai-app/db";

describe("debug", () => {
  it("should get table name", () => {
    const obj = challengeSubmissions as Record<string | symbol, unknown>;
    const sym = Object.getOwnPropertySymbols(obj).find(
      (s) => s.description === "drizzle:Name"
    );
    console.log("sym:", sym);
    console.log("sym value:", sym ? obj[sym] : undefined);
    expect(sym).toBeDefined();
    expect(obj[sym!]).toBe("challenge_submissions");
  });
});
