import { describe, it, expect } from "bun:test";
import { colors } from "./design-tokens/colors";
import { spacing } from "./design-tokens/spacing";
import { typography } from "./design-tokens/typography";
import { borderRadius } from "./design-tokens/borderRadius";

describe("[UNIT] Shared Design Tokens", () => {
  it("should export color tokens", () => {
    expect(colors).toBeDefined();
    expect(typeof colors).toBe("object");
  });

  it("should export spacing tokens", () => {
    expect(spacing).toBeDefined();
    expect(typeof spacing).toBe("object");
  });

  it("should export typography tokens", () => {
    expect(typography).toBeDefined();
    expect(typeof typography).toBe("object");
  });

  it("should export borderRadius tokens", () => {
    expect(borderRadius).toBeDefined();
    expect(typeof borderRadius).toBe("object");
  });
});
