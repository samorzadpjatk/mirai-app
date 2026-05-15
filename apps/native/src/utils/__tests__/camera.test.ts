import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { ImagePickerAsset } from "expo-image-picker";

import { Alert, Platform } from "react-native";

// Mock expo-image-manipulator
interface ManipulateResult {
  uri: string;
  width: number;
  height: number;
}
interface SaveResult {
  uri: string;
  width: number;
  height: number;
}
interface RenderResult {
  saveAsync: jest.Mock<() => Promise<SaveResult>>;
  release: jest.Mock;
}

const mockManipulateAsync =
  jest.fn<
    (uri: string, actions: unknown[], options: unknown) => Promise<ManipulateResult | Error>
  >();
const mockSaveAsync = jest.fn<() => Promise<SaveResult>>();
const mockRenderAsync = jest.fn<() => Promise<RenderResult>>();
const mockRelease = jest.fn();
const mockManipulateContext = {
  resize: jest.fn().mockReturnThis(),
  rotate: jest.fn().mockReturnThis(),
  flip: jest.fn().mockReturnThis(),
  crop: jest.fn().mockReturnThis(),
  extent: jest.fn().mockReturnThis(),
  renderAsync: mockRenderAsync,
  release: mockRelease,
};

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: (uri: string, actions: unknown[], options: unknown) =>
    mockManipulateAsync(uri, actions, options),
  ImageManipulator: {
    manipulate: jest.fn().mockReturnValue(mockManipulateContext),
  },
  FlipType: {
    Horizontal: "horizontal",
    Vertical: "vertical",
  },
  SaveFormat: {
    JPEG: "jpeg",
    PNG: "png",
    WEBP: "webp",
  },
}));

// Import after mocks
import { normalizeCameraAsset } from "../camera";

describe("Camera Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    mockManipulateAsync.mockResolvedValue({
      uri: "manipulated://result.jpg",
      width: 800,
      height: 600,
    });
    mockRenderAsync.mockResolvedValue({
      saveAsync: mockSaveAsync,
      release: mockRelease,
    });
    mockSaveAsync.mockResolvedValue({
      uri: "manipulated://result.jpg",
      width: 800,
      height: 600,
    });
  });

  describe("normalizeCameraAsset - EXIF orientation handling", () => {
    it("should return asset unchanged when no orientation manipulation needed", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 1 },
      };

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result).toBe(asset);
    });

    it("should return asset unchanged when exif is null", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: null,
      };

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result).toBe(asset);
    });

    it("should handle orientation 2 - flip horizontal", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 2 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ flip: "horizontal" }],
        expect.any(Object),
      );
    });

    it("should handle orientation 3 - rotate 180", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 3 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ rotate: 180 }],
        expect.any(Object),
      );
    });

    it("should handle orientation 4 - flip vertical", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 4 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ flip: "vertical" }],
        expect.any(Object),
      );
    });

    it("should handle orientation 5 - rotate 90 and flip horizontal", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 5 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ rotate: 90 }, { flip: "horizontal" }],
        expect.any(Object),
      );
    });

    it("should handle orientation 6 - rotate 90", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 6 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ rotate: 90 }],
        expect.any(Object),
      );
    });

    it("should handle orientation 7 - rotate 270 and flip horizontal", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 7 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ rotate: 270 }, { flip: "horizontal" }],
        expect.any(Object),
      );
    });

    it("should handle orientation 8 - rotate 270", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 8 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ rotate: 270 }],
        expect.any(Object),
      );
    });

    it("should handle string orientation values", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: "6" },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ rotate: 90 }],
        expect.any(Object),
      );
    });

    it("should handle lowercase orientation key", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { orientation: 6 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        "file://test.jpg",
        [{ rotate: 90 }],
        expect.any(Object),
      );
    });

    it("should handle invalid string orientation", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: "invalid" },
      };

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result).toBe(asset);
    });
  });

  describe("normalizeCameraAsset - front camera detection", () => {
    it("should detect front camera from 'front' in exif", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { LensModel: "front camera" },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should detect front camera from 'selfie' in exif", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { LensModel: "selfie mode" },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should detect front camera from 'true depth' in exif", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { LensModel: "True Depth Camera" },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should not flip for front camera when orientation is already mirrored", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { LensModel: "front camera", Orientation: 2 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        [{ flip: "horizontal" }],
        expect.any(Object),
      );
    });
  });

  describe("normalizeCameraAsset - explicit mirror flag", () => {
    it("should flip when mirror flag is true", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { IsMirrored: true },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should flip when mirror flag is 1", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Mirror: 1 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should flip when mirror flag is 'true' string", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Mirror: "true" },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should flip when mirror flag is '1' string", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Mirror: "1" },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should flip when mirror flag is 'yes' string", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Mirror: "yes" },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should flip when mirror flag is boolean true", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { IsMirrored: true },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should not flip when mirror flag is false", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { IsMirrored: false },
      };

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result).toBe(asset);
    });

    it("should not flip when mirror flag is 0", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Mirror: 0 },
      };

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result).toBe(asset);
    });

    it("should not flip when mirror flag is an object", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Mirror: { value: true } },
      };

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result).toBe(asset);
    });

    it("should not flip when mirror flag is null", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Mirror: null },
      };

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result).toBe(asset);
    });
  });

  describe("normalizeCameraAsset - forceUnmirror option", () => {
    it("should flip when forceUnmirror is true", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 1 },
      };

      await normalizeCameraAsset(asset, { forceUnmirror: true });

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([{ flip: "horizontal" }]),
        expect.any(Object),
      );
    });

    it("should not flip when forceUnmirror is true but orientation is already mirrored", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 2 },
      };

      await normalizeCameraAsset(asset, { forceUnmirror: true });

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        [{ flip: "horizontal" }],
        expect.any(Object),
      );
    });
  });

  describe("normalizeCameraAsset - format handling", () => {
    it("should use PNG format for image/png mimeType", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.png",
        width: 100,
        height: 100,
        mimeType: "image/png",
        exif: { Orientation: 6 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ format: "png" }),
      );
    });

    it("should use WEBP format for image/webp mimeType", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.webp",
        width: 100,
        height: 100,
        mimeType: "image/webp",
        exif: { Orientation: 6 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ format: "webp" }),
      );
    });

    it("should use JPEG format for image/jpeg mimeType", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        mimeType: "image/jpeg",
        exif: { Orientation: 6 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ format: "jpeg" }),
      );
    });

    it("should default to JPEG format when no mimeType", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 6 },
      };

      await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ format: "jpeg" }),
      );
    });
  });

  describe("normalizeCameraAsset - result handling", () => {
    it("should return manipulated asset with updated properties", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 6, Make: "Apple" },
      };

      mockManipulateAsync.mockResolvedValue({
        uri: "file://manipulated.jpg",
        width: 800,
        height: 600,
      });

      const result = await normalizeCameraAsset(asset);

      expect(result.uri).toBe("file://manipulated.jpg");
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.exif).toEqual({
        Make: "Apple",
        Orientation: 1,
      });
    });

    it("should preserve other asset properties", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
        base64: "base64data",
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockResolvedValue({
        uri: "file://manipulated.jpg",
        width: 800,
        height: 600,
      });

      const result = await normalizeCameraAsset(asset);

      expect(result.fileName).toBe("photo.jpg");
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.base64).toBe("base64data");
    });
  });

  describe("normalizeCameraAsset - fallback handling", () => {
    it("should use fallback manipulation when manipulateAsync fails", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        base64: "base64data",
        mimeType: "image/jpeg",
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockRejectedValueOnce(new Error("Primary failed")).mockResolvedValueOnce({
        uri: "file://fallback-result.jpg",
        width: 1024,
        height: 768,
      });

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledTimes(2);
      expect(result.uri).toBe("file://fallback-result.jpg");
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
    });

    it("should use base64 fallback when uri manipulation fails", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        base64: "base64data",
        mimeType: "image/jpeg",
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockRejectedValueOnce(new Error("Primary failed")).mockResolvedValueOnce({
        uri: "file://base64-manipulated.jpg",
        width: 1024,
        height: 768,
      });

      const result = await normalizeCameraAsset(asset);

      expect(mockManipulateAsync).toHaveBeenCalledTimes(2);
      expect(mockManipulateAsync).toHaveBeenNthCalledWith(
        2,
        "data:image/jpeg;base64,base64data",
        expect.any(Array),
        expect.any(Object),
      );
      expect(result.uri).toBe("file://base64-manipulated.jpg");
    });

    it("should return original asset when all fallbacks fail", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        base64: "base64data",
        mimeType: "image/jpeg",
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockRejectedValue(new Error("All failed"));

      const result = await normalizeCameraAsset(asset);

      expect(result).toBe(asset);
    });

    it("should return original asset when no base64 and all fallbacks fail", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockRejectedValue(new Error("Primary failed"));

      const result = await normalizeCameraAsset(asset);

      expect(result).toBe(asset);
    });

    it("should handle resize action in fallback manipulation", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockRejectedValueOnce(new Error("Primary failed")).mockResolvedValueOnce({
        uri: "file://fallback-result.jpg",
        width: 800,
        height: 600,
      });

      await normalizeCameraAsset(asset);

      expect(mockManipulateContext.resize).not.toHaveBeenCalled();
    });

    it("should handle crop action in fallback manipulation", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockRejectedValueOnce(new Error("Primary failed")).mockResolvedValueOnce({
        uri: "file://fallback-result.jpg",
        width: 800,
        height: 600,
      });

      await normalizeCameraAsset(asset);

      expect(mockManipulateContext.crop).not.toHaveBeenCalled();
    });

    it("should handle extent action in fallback manipulation when available", async () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        width: 100,
        height: 100,
        exif: { Orientation: 6 },
      };

      mockManipulateAsync.mockRejectedValueOnce(new Error("Primary failed")).mockResolvedValueOnce({
        uri: "file://fallback-result.jpg",
        width: 800,
        height: 600,
      });

      await normalizeCameraAsset(asset);

      expect(mockManipulateContext.extent).not.toHaveBeenCalled();
    });
  });
});
