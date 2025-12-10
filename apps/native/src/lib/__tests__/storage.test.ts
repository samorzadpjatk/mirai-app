import { authStorage } from "~/lib/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

let mockPlatformOS: "ios" | "android" | "web" = "ios";

jest.mock("react-native", () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
    select: jest.fn(),
  },
}));

describe("authStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS = "ios";
  });

  describe("Native Platform (iOS/Android)", () => {
    it("should get item from AsyncStorage on native", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("test-value");

      const result = await authStorage.getItem("test-key");

      expect(AsyncStorage.getItem).toHaveBeenCalledWith("test-key");
      expect(result).toBe("test-value");
    });

    it("should set item in AsyncStorage on native", async () => {
      await authStorage.setItem("test-key", "test-value");

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "test-key",
        "test-value",
      );
    });

    it("should remove item from AsyncStorage on native", async () => {
      await authStorage.removeItem("test-key");

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should return null when AsyncStorage returns null", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authStorage.getItem("non-existent-key");

      expect(result).toBeNull();
    });
  });

  describe("Web Platform", () => {
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };

    beforeEach(() => {
      mockPlatformOS = "web";

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });

      jest.clearAllMocks();
    });

    it("should get item from localStorage on web", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-value");

      const result = await authStorage.getItem("test-key");

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("test-key");
      expect(result).toBe("test-value");
    });

    it("should set item in localStorage on web", async () => {
      await authStorage.setItem("test-key", "test-value");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "test-key",
        "test-value",
      );
    });

    it("should remove item from localStorage on web", async () => {
      await authStorage.removeItem("test-key");

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should return null when localStorage returns null", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await authStorage.getItem("non-existent-key");

      expect(result).toBeNull();
    });

    it("should handle undefined window on web SSR", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const originalWindow = (globalThis as any).window;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      delete (globalThis as any).window;

      const result = await authStorage.getItem("test-key");

      expect(result).toBeNull();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (globalThis as any).window = originalWindow;
    });

    it("should handle missing localStorage on web", async () => {
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await authStorage.getItem("test-key");

      expect(result).toBeNull();

      // Restore
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
    });

    it("should not throw when setting item with no localStorage", async () => {
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(
        authStorage.setItem("test-key", "test-value"),
      ).resolves.not.toThrow();

      // Restore
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
    });

    it("should not throw when removing item with no localStorage", async () => {
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(authStorage.removeItem("test-key")).resolves.not.toThrow();

      // Restore
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
    });
  });

  describe("Android Platform", () => {
    beforeEach(() => {
      mockPlatformOS = "android";
    });

    it("should use AsyncStorage on Android", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("android-value");

      const result = await authStorage.getItem("test-key");

      expect(AsyncStorage.getItem).toHaveBeenCalledWith("test-key");
      expect(result).toBe("android-value");
    });

    it("should set item in AsyncStorage on Android", async () => {
      await authStorage.setItem("test-key", "android-value");

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "test-key",
        "android-value",
      );
    });
  });
});
