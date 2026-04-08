/**
 * @jest-environment node
 */

// Tests for trips hooks - verify module structure and exports

describe("useTrips", () => {
  test("module exports useTrips function", async () => {
    const { useTrips } = await import("../useTrips");
    expect(useTrips).toBeDefined();
    expect(typeof useTrips).toBe("function");
  });

  test("hook accepts no parameters", async () => {
    const { useTrips } = await import("../useTrips");
    expect(useTrips.length).toBe(0);
  });
});

describe("useTripDetails", () => {
  test("module exports useTripDetails function", async () => {
    const { useTripDetails } = await import("../useTripDetails");
    expect(useTripDetails).toBeDefined();
    expect(typeof useTripDetails).toBe("function");
  });

  test("hook accepts tripId parameter", async () => {
    const { useTripDetails } = await import("../useTripDetails");
    expect(useTripDetails.length).toBe(1);
  });
});

describe("useTripResources", () => {
  test("module exports useTripResources function", async () => {
    const { useTripResources } = await import("../useTripResources");
    expect(useTripResources).toBeDefined();
    expect(typeof useTripResources).toBe("function");
  });

  test("hook accepts tripId parameter", async () => {
    const { useTripResources } = await import("../useTripResources");
    expect(useTripResources.length).toBe(1);
  });
});

describe("useSelectedTrip", () => {
  test("module exports useSelectedTrip function", async () => {
    const { useSelectedTrip } = await import("../useSelectedTrip");
    expect(useSelectedTrip).toBeDefined();
    expect(typeof useSelectedTrip).toBe("function");
  });

  test("hook accepts no parameters", async () => {
    const { useSelectedTrip } = await import("../useSelectedTrip");
    expect(useSelectedTrip.length).toBe(0);
  });
});

describe("useTripBackgroundImageDownload", () => {
  test("module exports useTripBackgroundImageDownload function", async () => {
    const { useTripBackgroundImageDownload } =
      await import("../useTripBackgroundImageDownload");
    expect(useTripBackgroundImageDownload).toBeDefined();
    expect(typeof useTripBackgroundImageDownload).toBe("function");
  });

  test("hook accepts backgroundImagePath parameter", async () => {
    const { useTripBackgroundImageDownload } =
      await import("../useTripBackgroundImageDownload");
    expect(useTripBackgroundImageDownload.length).toBe(1);
  });
});

describe("Trips Hooks Index", () => {
  test("main hooks exported from index", async () => {
    const index = await import("../index");
    expect(index.useTrips).toBeDefined();
    expect(index.useTripDetails).toBeDefined();
    expect(index.useTripResources).toBeDefined();
    expect(index.useSelectedTrip).toBeDefined();
    // Note: useTripBackgroundImageDownload is not exported from index (available directly)
  });

  test("main exports are functions", async () => {
    const index = await import("../index");
    expect(typeof index.useTrips).toBe("function");
    expect(typeof index.useTripDetails).toBe("function");
    expect(typeof index.useTripResources).toBe("function");
    expect(typeof index.useSelectedTrip).toBe("function");
  });
});
