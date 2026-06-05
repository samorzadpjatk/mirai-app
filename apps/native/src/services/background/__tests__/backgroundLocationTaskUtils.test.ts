import {
  calculateDistance,
  shouldSendLocationUpdate,
  toFiniteNumberOrUndefined,
  toHeadingOrUndefined,
  toNonNegativeOrUndefined,
} from "../../../services/background/backgroundLocationTaskUtils";

describe("toFiniteNumberOrUndefined", () => {
  it("should return number for valid finite number", () => {
    expect(toFiniteNumberOrUndefined(42)).toBe(42);
    expect(toFiniteNumberOrUndefined(0)).toBe(0);
    expect(toFiniteNumberOrUndefined(-1)).toBe(-1);
  });

  it("should return undefined for non-number values", () => {
    expect(toFiniteNumberOrUndefined("42")).toBeUndefined();
    expect(toFiniteNumberOrUndefined(null)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(undefined)).toBeUndefined();
    expect(toFiniteNumberOrUndefined({})).toBeUndefined();
  });

  it("should return undefined for non-finite numbers", () => {
    expect(toFiniteNumberOrUndefined(NaN)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(Infinity)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(-Infinity)).toBeUndefined();
  });
});

describe("toNonNegativeOrUndefined", () => {
  it("should return number for non-negative values", () => {
    expect(toNonNegativeOrUndefined(42)).toBe(42);
    expect(toNonNegativeOrUndefined(0)).toBe(0);
  });

  it("should return undefined for negative values", () => {
    expect(toNonNegativeOrUndefined(-1)).toBeUndefined();
  });

  it("should return undefined for non-number values", () => {
    expect(toNonNegativeOrUndefined("42")).toBeUndefined();
  });
});

describe("toHeadingOrUndefined", () => {
  it("should return number for valid heading", () => {
    expect(toHeadingOrUndefined(0)).toBe(0);
    expect(toHeadingOrUndefined(180)).toBe(180);
    expect(toHeadingOrUndefined(360)).toBe(360);
  });

  it("should return undefined for out of range values", () => {
    expect(toHeadingOrUndefined(-1)).toBeUndefined();
    expect(toHeadingOrUndefined(361)).toBeUndefined();
  });

  it("should return undefined for non-number values", () => {
    expect(toHeadingOrUndefined("180")).toBeUndefined();
  });
});

describe("calculateDistance", () => {
  it("should calculate distance between two points", () => {
    const distance = calculateDistance(52.2297, 21.0122, 52.4064, 16.9252);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeGreaterThan(200000);
    expect(distance).toBeLessThan(300000);
  });

  it("should return 0 for same coordinates", () => {
    expect(calculateDistance(52.2297, 21.0122, 52.2297, 21.0122)).toBe(0);
  });

  it("should calculate distance between Warsaw and Krakow", () => {
    const distance = calculateDistance(52.2297, 21.0122, 50.0647, 19.945);
    expect(distance).toBeGreaterThan(250000);
    expect(distance).toBeLessThan(300000);
  });
});

describe("shouldSendLocationUpdate", () => {
  it("should return true when no last sent location", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 10 } },
      null,
    );
    expect(result).toBe(true);
  });

  it("should return true when distance exceeds threshold", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 10 } },
      { coords: { latitude: 50.0647, longitude: 19.945 } },
      100,
    );
    expect(result).toBe(true);
  });

  it("should return true when distance exceeds accuracy-based threshold", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 10 } },
      { coords: { latitude: 52.4064, longitude: 16.9252 } },
      10,
    );
    expect(result).toBe(true);
  });

  it("should return false when distance is within threshold", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 10 } },
      { coords: { latitude: 52.2297, longitude: 21.0122 } },
      100000,
    );
    expect(result).toBe(false);
  });

  it("should handle null accuracy", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: null } },
      { coords: { latitude: 52.2297, longitude: 21.0122 } },
      100000,
    );
    expect(result).toBe(false);
  });

  it("should return true when accuracy=5m and delta=15m", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 5 } },
      { coords: { latitude: 52.2297, longitude: 21.0125 } },
      15,
    );
    expect(result).toBe(true);
  });

  it("should return false when accuracy=100m and delta=150m", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 100 } },
      { coords: { latitude: 52.2297, longitude: 21.0132 } },
      15,
    );
    expect(result).toBe(false);
  });

  it("should return true when accuracy=100m and delta=250m", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 100 } },
      { coords: { latitude: 52.2297, longitude: 21.0165 } },
      15,
    );
    expect(result).toBe(true);
  });

  it("should return false when accuracy=null and delta=10m", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: null } },
      { coords: { latitude: 52.2297, longitude: 21.0123 } },
      15,
    );
    expect(result).toBe(false);
  });

  it("should return true when accuracy=null and delta=20m", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: null } },
      { coords: { latitude: 52.2297, longitude: 21.0125 } },
      15,
    );
    expect(result).toBe(true);
  });

  it("should return false when accuracy=5m and delta=8m", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 5 } },
      { coords: { latitude: 52.2297, longitude: 21.01218 } },
      15,
    );
    expect(result).toBe(false);
  });

  it("should return true when accuracy=0 and delta=10m", () => {
    const result = shouldSendLocationUpdate(
      { coords: { latitude: 52.2297, longitude: 21.0122, accuracy: 0 } },
      { coords: { latitude: 52.2297, longitude: 21.0125 } },
      15,
    );
    expect(result).toBe(true);
  });
});
