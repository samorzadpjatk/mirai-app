/**
 * @jest-environment node
 */

// Tests for storage services

describe("[UNIT] authStorage", () => {
  test("exports authStorage object", async () => {
    const { authStorage } = await import("../../storage/storage");
    expect(authStorage).toBeDefined();
    expect(typeof authStorage).toBe("object");
  });

  test("authStorage has getItem method", async () => {
    const { authStorage } = await import("../../storage/storage");
    expect(authStorage.getItem).toBeDefined();
    expect(typeof authStorage.getItem).toBe("function");
  });

  test("authStorage has setItem method", async () => {
    const { authStorage } = await import("../../storage/storage");
    expect(authStorage.setItem).toBeDefined();
    expect(typeof authStorage.setItem).toBe("function");
  });

  test("authStorage has removeItem method", async () => {
    const { authStorage } = await import("../../storage/storage");
    expect(authStorage.removeItem).toBeDefined();
    expect(typeof authStorage.removeItem).toBe("function");
  });
});

describe("[UNIT] tusUrlStorage", () => {
  test("exports tusUrlStorage factory function", async () => {
    const { tusUrlStorage } = await import("../../storage/tusUrlStorage");
    expect(tusUrlStorage).toBeDefined();
    expect(typeof tusUrlStorage).toBe("function");
  });

  test("tusUrlStorage returns UrlStorage object", async () => {
    const { tusUrlStorage } = await import("../../storage/tusUrlStorage");
    const storage = tusUrlStorage();
    expect(storage).toBeDefined();
    expect(typeof storage).toBe("object");
  });

  test("returned storage has findAllUploads method", async () => {
    const { tusUrlStorage } = await import("../../storage/tusUrlStorage");
    const storage = tusUrlStorage();
    expect(storage.findAllUploads).toBeDefined();
    expect(typeof storage.findAllUploads).toBe("function");
  });

  test("returned storage has findUploadsByFingerprint method", async () => {
    const { tusUrlStorage } = await import("../../storage/tusUrlStorage");
    const storage = tusUrlStorage();
    expect(storage.findUploadsByFingerprint).toBeDefined();
    expect(typeof storage.findUploadsByFingerprint).toBe("function");
  });

  test("returned storage has addUpload method", async () => {
    const { tusUrlStorage } = await import("../../storage/tusUrlStorage");
    const storage = tusUrlStorage();
    expect(storage.addUpload).toBeDefined();
    expect(typeof storage.addUpload).toBe("function");
  });

  test("returned storage has removeUpload method", async () => {
    const { tusUrlStorage } = await import("../../storage/tusUrlStorage");
    const storage = tusUrlStorage();
    expect(storage.removeUpload).toBeDefined();
    expect(typeof storage.removeUpload).toBe("function");
  });
});

describe("[UNIT] selectedTripStorage", () => {
  test("exports getSelectedTripIdFromStorage function", async () => {
    const { getSelectedTripIdFromStorage } =
      await import("../../storage/selectedTripStorage");
    expect(getSelectedTripIdFromStorage).toBeDefined();
    expect(typeof getSelectedTripIdFromStorage).toBe("function");
  });

  test("exports setSelectedTripIdInStorage function", async () => {
    const { setSelectedTripIdInStorage } =
      await import("../../storage/selectedTripStorage");
    expect(setSelectedTripIdInStorage).toBeDefined();
    expect(typeof setSelectedTripIdInStorage).toBe("function");
  });

  test("exports clearSelectedTripIdInStorage function", async () => {
    const { clearSelectedTripIdInStorage } =
      await import("../../storage/selectedTripStorage");
    expect(clearSelectedTripIdInStorage).toBeDefined();
    expect(typeof clearSelectedTripIdInStorage).toBe("function");
  });

  test("exports getCachedTrips function", async () => {
    const { getCachedTrips } =
      await import("../../storage/selectedTripStorage");
    expect(getCachedTrips).toBeDefined();
    expect(typeof getCachedTrips).toBe("function");
  });

  test("exports setCachedTrips function", async () => {
    const { setCachedTrips } =
      await import("../../storage/selectedTripStorage");
    expect(setCachedTrips).toBeDefined();
    expect(typeof setCachedTrips).toBe("function");
  });

  test("exports getCachedTripById function", async () => {
    const { getCachedTripById } =
      await import("../../storage/selectedTripStorage");
    expect(getCachedTripById).toBeDefined();
    expect(typeof getCachedTripById).toBe("function");
  });

  test("exports setCachedTripById function", async () => {
    const { setCachedTripById } =
      await import("../../storage/selectedTripStorage");
    expect(setCachedTripById).toBeDefined();
    expect(typeof setCachedTripById).toBe("function");
  });

  test("exports upsertCachedTripListItem function", async () => {
    const { upsertCachedTripListItem } =
      await import("../../storage/selectedTripStorage");
    expect(upsertCachedTripListItem).toBeDefined();
    expect(typeof upsertCachedTripListItem).toBe("function");
  });
});
