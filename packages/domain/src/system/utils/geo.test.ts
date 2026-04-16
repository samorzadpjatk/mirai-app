import { describe, it, expect } from "bun:test";
import { calculateDistance, isWithinRadius } from "./geo";

describe("[UNIT] Geo Utils", () => {
  // ============================================================================
  // Coordinate Constants for Reference
  // ============================================================================

  // Major cities for known distance tests
  const NYC_LAT = 40.7128;
  const NYC_LON = -74.006;
  const LA_LAT = 34.0522;
  const LA_LON = -118.2437;
  const LONDON_LAT = 51.5074;
  const LONDON_LON = -0.1278;
  const PARIS_LAT = 48.8566;
  const PARIS_LON = 2.3522;
  const TOKYO_LAT = 35.6762;
  const TOKYO_LON = 139.6503;
  const SYDNEY_LAT = -33.8688;
  const SYDNEY_LON = 151.2093;

  // Known distances (approximate, for verification)
  // NYC to LA: ~3936 km
  // London to Paris: ~344 km
  // Tokyo to Sydney: ~7826 km

  // Edge case locations
  const EQUATOR_LAT = 0;
  const PRIME_MERIDON_LON = 0;
  const NORTH_POLE_LAT = 90;
  const SOUTH_POLE_LAT = -90;
  const DATE_LINE_LON = 180;
  const NEGATIVE_DATE_LINE_LON = -180;

  // ============================================================================
  // calculateDistance Tests
  // ============================================================================

  describe("[UNIT] calculateDistance", () => {
    describe("same point", () => {
      it("returns 0 for identical coordinates", () => {
        const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
        expect(distance).toBe(0);
      });

      it("returns 0 for same point at equator", () => {
        const distance = calculateDistance(0, 0, 0, 0);
        expect(distance).toBe(0);
      });

      it("returns 0 for same point at north pole", () => {
        const distance = calculateDistance(90, 0, 90, 45);
        // Haversine formula has floating point precision issues at poles
        expect(distance).toBeCloseTo(0, 10);
      });

      it("returns 0 for same point at south pole", () => {
        const distance = calculateDistance(-90, 0, -90, -45);
        // Haversine formula has floating point precision issues at poles
        expect(distance).toBeCloseTo(0, 10);
      });
    });

    describe("known distances", () => {
      it("calculates NYC to LA distance correctly", () => {
        const distance = calculateDistance(NYC_LAT, NYC_LON, LA_LAT, LA_LON);
        expect(distance).not.toBeNull();
        // NYC to LA is approximately 3936 km
        // Allow 1% tolerance for calculation differences
        expect(distance).toBeGreaterThan(3900);
        expect(distance).toBeLessThan(3970);
      });

      it("calculates London to Paris distance correctly", () => {
        const distance = calculateDistance(
          LONDON_LAT,
          LONDON_LON,
          PARIS_LAT,
          PARIS_LON,
        );
        expect(distance).not.toBeNull();
        // London to Paris is approximately 344 km
        expect(distance).toBeGreaterThan(340);
        expect(distance).toBeLessThan(350);
      });

      it("calculates Tokyo to Sydney distance correctly", () => {
        const distance = calculateDistance(
          TOKYO_LAT,
          TOKYO_LON,
          SYDNEY_LAT,
          SYDNEY_LON,
        );
        expect(distance).not.toBeNull();
        // Tokyo to Sydney is approximately 7826 km
        expect(distance).toBeGreaterThan(7800);
        expect(distance).toBeLessThan(7850);
      });

      it("returns same distance regardless of point order", () => {
        const distance1 = calculateDistance(NYC_LAT, NYC_LON, LA_LAT, LA_LON);
        const distance2 = calculateDistance(LA_LAT, LA_LON, NYC_LAT, NYC_LON);
        expect(distance1).toBe(distance2);
      });
    });

    describe("short distances", () => {
      it("calculates short distance in meters correctly", () => {
        // Two points ~100 meters apart in Manhattan
        const lat1 = 40.7489; // Near Empire State Building
        const lon1 = -73.968;
        const lat2 = 40.7493; // ~100m north
        const lon2 = -73.968;

        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        expect(distance).not.toBeNull();
        // Should be approximately 0.04-0.05 km (40-50 meters)
        expect(distance).toBeGreaterThan(0.03);
        expect(distance).toBeLessThan(0.06);
      });

      it("calculates very short distance (1 meter scale)", () => {
        // Points 1 meter apart (approximately 0.00001 degrees latitude)
        const lat1 = 40.7128;
        const lon1 = -74.006;
        const lat2 = 40.71281;
        const lon2 = -74.006;

        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        expect(distance).not.toBeNull();
        // 0.00001 degrees latitude is roughly 1.11 meters
        expect(distance).toBeGreaterThan(0.0001);
        expect(distance).toBeLessThan(0.002);
      });
    });

    describe("long distances", () => {
      it("calculates distance to antipode correctly", () => {
        // Point and its antipode (opposite side of Earth)
        // Madrid approx antipode is near Wellington, NZ area
        const madridLat = 40.4168;
        const madridLon = -3.7038;
        const antipodeLat = -40.4168;
        const antipodeLon = 176.2962;

        const distance = calculateDistance(
          madridLat,
          madridLon,
          antipodeLat,
          antipodeLon,
        );
        expect(distance).not.toBeNull();
        // Should be approximately half Earth's circumference
        // Earth's circumference is ~40075 km, half is ~20037 km
        expect(distance).toBeGreaterThan(19900);
        expect(distance).toBeLessThan(20100);
      });

      it("calculates maximum possible distance (antipodes at equator)", () => {
        const distance = calculateDistance(0, 0, 0, 180);
        expect(distance).not.toBeNull();
        // Should be approximately half Earth's circumference
        expect(distance).toBeGreaterThan(19900);
        expect(distance).toBeLessThan(20100);
      });
    });

    describe("edge cases - equator", () => {
      it("calculates distance along equator", () => {
        const distance = calculateDistance(0, 0, 0, 90);
        expect(distance).not.toBeNull();
        // Distance at equator for 90 degrees longitude
        // Earth's radius at equator is ~6378 km
        // Distance = (90/360) * 2 * pi * 6378 km ~ 10007 km
        expect(distance).toBeGreaterThan(9900);
        expect(distance).toBeLessThan(10100);
      });

      it("calculates distance from equator to pole", () => {
        const distance = calculateDistance(0, 0, 90, 0);
        expect(distance).not.toBeNull();
        // Should be quarter circumference ~10019 km
        expect(distance).toBeGreaterThan(9950);
        expect(distance).toBeLessThan(10100);
      });
    });

    describe("edge cases - poles", () => {
      it("calculates distance between points at north pole (any longitude is same point)", () => {
        const distance = calculateDistance(90, 0, 90, 180);
        // At north pole, all longitudes converge - should be 0 (with floating point tolerance)
        expect(distance).toBeCloseTo(0, 10);
      });

      it("calculates distance between points at south pole", () => {
        const distance = calculateDistance(-90, 0, -90, -180);
        // At south pole, all longitudes converge - should be 0 (with floating point tolerance)
        expect(distance).toBeCloseTo(0, 10);
      });

      it("calculates distance from north pole to nearby point", () => {
        const distance = calculateDistance(90, 0, 89, 0);
        expect(distance).not.toBeNull();
        // 1 degree from pole is ~111 km
        expect(distance).toBeGreaterThan(110);
        expect(distance).toBeLessThan(113);
      });

      it("calculates distance from south pole to nearby point", () => {
        const distance = calculateDistance(-90, 0, -89, 0);
        expect(distance).not.toBeNull();
        expect(distance).toBeGreaterThan(110);
        expect(distance).toBeLessThan(113);
      });
    });

    describe("edge cases - prime meridian", () => {
      it("calculates distance across prime meridian", () => {
        const distance = calculateDistance(51.5074, -0.1, 51.5074, 0.1);
        expect(distance).not.toBeNull();
        // Small distance across 0 longitude
        expect(distance).toBeGreaterThan(10);
        expect(distance).toBeLessThan(20);
      });

      it("handles points on prime meridian", () => {
        const distance = calculateDistance(51.5074, 0, 48.8566, 0);
        expect(distance).not.toBeNull();
        // London to Paris both on prime meridian line
        // This is north-south distance
        expect(distance).toBeGreaterThan(290);
        expect(distance).toBeLessThan(310);
      });
    });

    describe("edge cases - date line", () => {
      it("calculates distance across date line", () => {
        // Point at 179E and -179E (same as 179W) are 2 degrees apart
        // At the equator that would be ~222 km, at 35.6762N it's less due to latitude
        const distance = calculateDistance(35.6762, 179, 35.6762, -179);
        expect(distance).not.toBeNull();
        // At 35.67N, 2 degrees longitude is ~182 km (cos(35.67) * 222 km)
        expect(distance).toBeGreaterThan(170);
        expect(distance).toBeLessThan(200);
      });

      it("handles 180 and -180 as same longitude line", () => {
        const distance = calculateDistance(0, 180, 0, -180);
        // 180 and -180 are the same meridian, distance should be 0
        expect(distance).toBeCloseTo(0, 10);
      });
    });

    describe("invalid coordinates - null and undefined", () => {
      it("returns null when first latitude is null", () => {
        expect(calculateDistance(null, 0, 0, 0)).toBeNull();
      });

      it("returns null when first latitude is undefined", () => {
        expect(calculateDistance(undefined, 0, 0, 0)).toBeNull();
      });

      it("returns null when first longitude is null", () => {
        expect(calculateDistance(0, null, 0, 0)).toBeNull();
      });

      it("returns null when first longitude is undefined", () => {
        expect(calculateDistance(0, undefined, 0, 0)).toBeNull();
      });

      it("returns null when second latitude is null", () => {
        expect(calculateDistance(0, 0, null, 0)).toBeNull();
      });

      it("returns null when second latitude is undefined", () => {
        expect(calculateDistance(0, 0, undefined, 0)).toBeNull();
      });

      it("returns null when second longitude is null", () => {
        expect(calculateDistance(0, 0, 0, null)).toBeNull();
      });

      it("returns null when second longitude is undefined", () => {
        expect(calculateDistance(0, 0, 0, undefined)).toBeNull();
      });

      it("returns null when all parameters are null", () => {
        expect(calculateDistance(null, null, null, null)).toBeNull();
      });
    });

    describe("invalid coordinates - out of bounds", () => {
      it("returns null when latitude is less than -90", () => {
        expect(calculateDistance(-91, 0, 0, 0)).toBeNull();
      });

      it("returns null when latitude is greater than 90", () => {
        expect(calculateDistance(91, 0, 0, 0)).toBeNull();
      });

      it("returns null when second latitude is less than -90", () => {
        expect(calculateDistance(0, 0, -91, 0)).toBeNull();
      });

      it("returns null when second latitude is greater than 90", () => {
        expect(calculateDistance(0, 0, 91, 0)).toBeNull();
      });

      it("returns null when longitude is less than -180", () => {
        expect(calculateDistance(0, -181, 0, 0)).toBeNull();
      });

      it("returns null when longitude is greater than 180", () => {
        expect(calculateDistance(0, 181, 0, 0)).toBeNull();
      });

      it("returns null when second longitude is less than -180", () => {
        expect(calculateDistance(0, 0, 0, -181)).toBeNull();
      });

      it("returns null when second longitude is greater than 180", () => {
        expect(calculateDistance(0, 0, 0, 181)).toBeNull();
      });

      it("returns null when latitude is exactly -90.1", () => {
        expect(calculateDistance(-90.1, 0, 0, 0)).toBeNull();
      });

      it("returns null when latitude is exactly 90.1", () => {
        expect(calculateDistance(90.1, 0, 0, 0)).toBeNull();
      });
    });

    describe("boundary values", () => {
      it("accepts minimum valid latitude (-90)", () => {
        expect(calculateDistance(-90, 0, 0, 0)).not.toBeNull();
      });

      it("accepts maximum valid latitude (90)", () => {
        expect(calculateDistance(90, 0, 0, 0)).not.toBeNull();
      });

      it("accepts minimum valid longitude (-180)", () => {
        expect(calculateDistance(0, -180, 0, 0)).not.toBeNull();
      });

      it("accepts maximum valid longitude (180)", () => {
        expect(calculateDistance(0, 180, 0, 0)).not.toBeNull();
      });

      it("accepts coordinates at all boundary extremes", () => {
        expect(calculateDistance(-90, -180, 90, 180)).not.toBeNull();
      });
    });

    describe("NaN and Infinity", () => {
      it("returns NaN when latitude is NaN (NaN propagates through calculation)", () => {
        // NaN is not explicitly handled, so it propagates through the calculation
        const result = calculateDistance(NaN, 0, 0, 0);
        expect(result).toBeNaN();
      });

      it("returns NaN when longitude is NaN", () => {
        const result = calculateDistance(0, NaN, 0, 0);
        expect(result).toBeNaN();
      });

      it("returns null when latitude is Infinity (fails bounds check)", () => {
        // Infinity > 90, so it fails the bounds check
        expect(calculateDistance(Infinity, 0, 0, 0)).toBeNull();
      });

      it("returns null when longitude is Infinity", () => {
        // Infinity > 180, so it fails the bounds check
        expect(calculateDistance(0, Infinity, 0, 0)).toBeNull();
      });

      it("returns null when latitude is -Infinity", () => {
        // -Infinity < -90, so it fails the bounds check
        expect(calculateDistance(-Infinity, 0, 0, 0)).toBeNull();
      });
    });
  });

  // ============================================================================
  // isWithinRadius Tests
  // ============================================================================

  describe("[UNIT] isWithinRadius", () => {
    describe("point exactly at center", () => {
      it("returns true when point is exactly at center", () => {
        expect(isWithinRadius(40.7128, -74.006, 40.7128, -74.006, 10)).toBe(
          true,
        );
      });

      it("returns true when point is at center with zero radius", () => {
        expect(isWithinRadius(40.7128, -74.006, 40.7128, -74.006, 0)).toBe(
          true,
        );
      });

      it("returns true when point is at center with large radius", () => {
        expect(isWithinRadius(40.7128, -74.006, 40.7128, -74.006, 10000)).toBe(
          true,
        );
      });
    });

    describe("point within radius", () => {
      it("returns true when point is within radius", () => {
        // NYC to point ~5km away
        const nearbyLat = 40.75;
        const nearbyLon = -74.0;
        expect(isWithinRadius(NYC_LAT, NYC_LON, nearbyLat, nearbyLon, 10)).toBe(
          true,
        );
      });

      it("returns true for point just inside radius boundary", () => {
        // Create a point that is definitely within 100km radius
        // 0.5 degrees latitude is ~55 km
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, NYC_LAT + 0.4, NYC_LON, 100),
        ).toBe(true);
      });

      it("returns true for point within large radius", () => {
        // NYC to LA is ~3936 km, check if within 4000 km
        expect(isWithinRadius(NYC_LAT, NYC_LON, LA_LAT, LA_LON, 4000)).toBe(
          true,
        );
      });
    });

    describe("point outside radius", () => {
      it("returns false when point is outside radius", () => {
        // NYC to LA is ~3936 km, check if within 100 km
        expect(isWithinRadius(NYC_LAT, NYC_LON, LA_LAT, LA_LON, 100)).toBe(
          false,
        );
      });

      it("returns false when point is far outside radius", () => {
        // NYC to Tokyo is ~10850 km, check if within 1000 km
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, TOKYO_LAT, TOKYO_LON, 1000),
        ).toBe(false);
      });

      it("returns false for point just outside radius boundary", () => {
        // Create a point that is definitely outside 10km radius
        // 0.2 degrees latitude is ~22 km
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, NYC_LAT + 0.2, NYC_LON, 10),
        ).toBe(false);
      });
    });

    describe("point exactly on radius boundary", () => {
      it("returns true when point is exactly on radius boundary", () => {
        // Test with a known calculation
        // Point 1 degree north is approximately 111 km
        // Let's use a precise calculation
        const distance = calculateDistance(0, 0, 1, 0);
        expect(distance).not.toBeNull();
        if (distance !== null) {
          // Point at 1 degree north should be at exactly 'distance' km
          expect(isWithinRadius(0, 0, 1, 0, distance)).toBe(true);
        }
      });

      it("handles boundary with tolerance for floating point", () => {
        // Due to floating point precision, points calculated to be exactly
        // on the boundary should still be considered within
        const distance = calculateDistance(NYC_LAT, NYC_LON, LA_LAT, LA_LON);
        expect(distance).not.toBeNull();
        if (distance !== null) {
          expect(
            isWithinRadius(NYC_LAT, NYC_LON, LA_LAT, LA_LON, distance),
          ).toBe(true);
        }
      });
    });

    describe("invalid point coordinates", () => {
      it("returns false when point latitude is null", () => {
        expect(isWithinRadius(40.7128, -74.006, null, -74.006, 10)).toBe(false);
      });

      it("returns false when point longitude is null", () => {
        expect(isWithinRadius(40.7128, -74.006, 40.75, null, 10)).toBe(false);
      });

      it("returns false when both point coordinates are null", () => {
        expect(isWithinRadius(40.7128, -74.006, null, null, 10)).toBe(false);
      });

      it("returns false when point has out of bounds latitude", () => {
        expect(isWithinRadius(40.7128, -74.006, 91, -74.006, 10)).toBe(false);
      });

      it("returns false when point has out of bounds longitude", () => {
        expect(isWithinRadius(40.7128, -74.006, 40.75, 181, 10)).toBe(false);
      });
    });

    describe("different radius values", () => {
      it("returns true with very small radius for same point", () => {
        expect(isWithinRadius(NYC_LAT, NYC_LON, NYC_LAT, NYC_LON, 0.001)).toBe(
          true,
        );
      });

      it("returns true with zero radius for same point", () => {
        expect(isWithinRadius(NYC_LAT, NYC_LON, NYC_LAT, NYC_LON, 0)).toBe(
          true,
        );
      });

      it("returns true with very large radius for any earth point", () => {
        // 20000 km radius should cover entire Earth (half circumference)
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, TOKYO_LAT, TOKYO_LON, 20000),
        ).toBe(true);
      });

      it("handles negative radius correctly", () => {
        // Negative radius: distance (0) <= radius (-1) is false
        // So same point with negative radius returns false
        expect(isWithinRadius(NYC_LAT, NYC_LON, NYC_LAT, NYC_LON, -1)).toBe(
          false,
        );
        // Any other point also returns false
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, NYC_LAT + 0.001, NYC_LON, -1),
        ).toBe(false);
      });

      it("handles extremely large radius values", () => {
        // 40000 km is roughly Earth's circumference
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, SYDNEY_LAT, SYDNEY_LON, 40000),
        ).toBe(true);
      });
    });

    describe("edge cases - equator and poles", () => {
      it("correctly checks radius from equator", () => {
        // Points on equator, 1 degree apart
        expect(isWithinRadius(0, 0, 0, 1, 200)).toBe(true); // ~111 km
        expect(isWithinRadius(0, 0, 0, 1, 100)).toBe(false);
      });

      it("correctly checks radius from north pole", () => {
        // From north pole, any longitude at same latitude is same distance
        expect(isWithinRadius(90, 0, 89, 0, 200)).toBe(true); // ~111 km
        expect(isWithinRadius(90, 0, 89, 180, 200)).toBe(true); // Same distance
      });

      it("correctly checks radius across date line", () => {
        // Points on opposite sides of date line
        expect(isWithinRadius(0, 179, 0, -179, 300)).toBe(true); // ~222 km
      });
    });

    describe("antipode points", () => {
      it("returns false for antipode with radius less than half circumference", () => {
        const antipodeLat = -NYC_LAT;
        const antipodeLon = NYC_LON + 180;
        // Should be ~20015 km away
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, antipodeLat, antipodeLon, 20000),
        ).toBe(false);
      });

      it("returns true for antipode with radius greater than half circumference", () => {
        const antipodeLat = -NYC_LAT;
        const antipodeLon = NYC_LON + 180;
        expect(
          isWithinRadius(NYC_LAT, NYC_LON, antipodeLat, antipodeLon, 25000),
        ).toBe(true);
      });
    });
  });

  // ============================================================================
  // Haversine Formula Accuracy Tests
  // ============================================================================

  describe("[UNIT] Haversine formula accuracy", () => {
    it("matches known Earth radius (6371 km)", () => {
      // Distance from center to pole should be quarter circumference
      // which verifies our Earth radius constant
      const distance = calculateDistance(0, 0, 90, 0);
      expect(distance).not.toBeNull();
      // Quarter of 2 * pi * 6371 = ~10007 km
      expect(distance).toBeGreaterThan(9950);
      expect(distance).toBeLessThan(10100);
    });

    it("calculates consistent distances for same degree separation at equator", () => {
      // At equator, 1 degree longitude should be consistent
      const d1 = calculateDistance(0, 0, 0, 1);
      const d2 = calculateDistance(0, 10, 0, 11);
      const d3 = calculateDistance(0, -50, 0, -49);
      expect(d1).not.toBeNull();
      expect(d2).not.toBeNull();
      expect(d3).not.toBeNull();
      if (d1 !== null && d2 !== null && d3 !== null) {
        // Should be approximately equal (within floating point tolerance)
        expect(Math.abs(d1 - d2)).toBeLessThan(0.1);
        expect(Math.abs(d1 - d3)).toBeLessThan(0.1);
      }
    });

    it("calculates shorter east-west distances at higher latitudes", () => {
      // 1 degree at equator vs 1 degree at 60N
      const atEquator = calculateDistance(0, 0, 0, 1);
      const at60Lat = calculateDistance(60, 0, 60, 1);
      expect(atEquator).not.toBeNull();
      expect(at60Lat).not.toBeNull();
      if (atEquator !== null && at60Lat !== null) {
        // At 60 degrees, cos(60) = 0.5, so distance should be roughly half
        expect(at60Lat).toBeLessThan(atEquator);
        expect(at60Lat * 2).toBeGreaterThan(atEquator * 0.9);
        expect(at60Lat * 2).toBeLessThan(atEquator * 1.1);
      }
    });

    it("produces accurate results for known aviation distances", () => {
      // JFK to LHR (New York to London) ~5570 km
      const jfkLat = 40.6413;
      const jfkLon = -73.7781;
      const lhrLat = 51.47;
      const lhrLon = -0.4543;

      const distance = calculateDistance(jfkLat, jfkLon, lhrLat, lhrLon);
      expect(distance).not.toBeNull();
      expect(distance).toBeGreaterThan(5500);
      expect(distance).toBeLessThan(5650);
    });

    it("produces accurate results for trans-Pacific route", () => {
      // LAX to NRT (Los Angeles to Tokyo Narita) ~8770 km
      const laxLat = 33.9425;
      const laxLon = -118.4081;
      const nrtLat = 35.7647;
      const nrtLon = 140.3864;

      const distance = calculateDistance(laxLat, laxLon, nrtLat, nrtLon);
      expect(distance).not.toBeNull();
      expect(distance).toBeGreaterThan(8700);
      expect(distance).toBeLessThan(8850);
    });
  });

  // ============================================================================
  // Coordinate Bounds Validation Tests
  // ============================================================================

  describe("[UNIT] coordinate bounds validation", () => {
    describe("latitude bounds", () => {
      it("accepts valid positive latitude", () => {
        expect(calculateDistance(45, 0, 0, 0)).not.toBeNull();
      });

      it("accepts valid negative latitude", () => {
        expect(calculateDistance(-45, 0, 0, 0)).not.toBeNull();
      });

      it("accepts zero latitude", () => {
        expect(calculateDistance(0, 0, 0, 0)).not.toBeNull();
      });

      it("accepts maximum latitude (90)", () => {
        expect(calculateDistance(90, 0, 0, 0)).not.toBeNull();
      });

      it("accepts minimum latitude (-90)", () => {
        expect(calculateDistance(-90, 0, 0, 0)).not.toBeNull();
      });

      it("rejects latitude slightly above 90", () => {
        expect(calculateDistance(90.0001, 0, 0, 0)).toBeNull();
      });

      it("rejects latitude slightly below -90", () => {
        expect(calculateDistance(-90.0001, 0, 0, 0)).toBeNull();
      });

      it("rejects very large positive latitude", () => {
        expect(calculateDistance(1000, 0, 0, 0)).toBeNull();
      });

      it("rejects very large negative latitude", () => {
        expect(calculateDistance(-1000, 0, 0, 0)).toBeNull();
      });
    });

    describe("longitude bounds", () => {
      it("accepts valid positive longitude", () => {
        expect(calculateDistance(0, 90, 0, 0)).not.toBeNull();
      });

      it("accepts valid negative longitude", () => {
        expect(calculateDistance(0, -90, 0, 0)).not.toBeNull();
      });

      it("accepts zero longitude", () => {
        expect(calculateDistance(0, 0, 0, 0)).not.toBeNull();
      });

      it("accepts maximum longitude (180)", () => {
        expect(calculateDistance(0, 180, 0, 0)).not.toBeNull();
      });

      it("accepts minimum longitude (-180)", () => {
        expect(calculateDistance(0, -180, 0, 0)).not.toBeNull();
      });

      it("rejects longitude slightly above 180", () => {
        expect(calculateDistance(0, 180.0001, 0, 0)).toBeNull();
      });

      it("rejects longitude slightly below -180", () => {
        expect(calculateDistance(0, -180.0001, 0, 0)).toBeNull();
      });

      it("rejects very large positive longitude", () => {
        expect(calculateDistance(0, 1000, 0, 0)).toBeNull();
      });

      it("rejects very large negative longitude", () => {
        expect(calculateDistance(0, -1000, 0, 0)).toBeNull();
      });
    });

    describe("combined validation", () => {
      it("validates all four coordinates simultaneously", () => {
        // All valid
        expect(calculateDistance(0, 0, 0, 0)).not.toBeNull();

        // One invalid - lat1
        expect(calculateDistance(91, 0, 0, 0)).toBeNull();

        // One invalid - lon1
        expect(calculateDistance(0, 181, 0, 0)).toBeNull();

        // One invalid - lat2
        expect(calculateDistance(0, 0, -91, 0)).toBeNull();

        // One invalid - lon2
        expect(calculateDistance(0, 0, 0, -181)).toBeNull();

        // Multiple invalid
        expect(calculateDistance(91, 181, -91, -181)).toBeNull();
      });

      it("validates coordinates for isWithinRadius through calculateDistance", () => {
        // Valid coordinates
        expect(isWithinRadius(0, 0, 0, 0, 100)).toBe(true);

        // Invalid point coordinates should return false
        expect(isWithinRadius(0, 0, 91, 0, 100)).toBe(false);
        expect(isWithinRadius(0, 0, 0, 181, 100)).toBe(false);
      });
    });
  });
});
