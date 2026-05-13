import type { ImagePickerAsset } from "expo-image-picker";
import { ImageManipulator, FlipType, SaveFormat, manipulateAsync } from "expo-image-manipulator";
import { Platform } from "react-native";

const MIRRORED_ORIENTATIONS = new Set([2, 4, 5, 7]);
type ExifRecord = Record<string, unknown>;

const asExifRecord = (exif: ImagePickerAsset["exif"]): ExifRecord | null => {
  if (!exif || typeof exif !== "object") return null;
  return exif;
};

const readOrientation = (exif: ImagePickerAsset["exif"]): number | null => {
  const exifRecord = asExifRecord(exif);
  if (!exifRecord) return null;

  const directOrientation = exifRecord.Orientation ?? exifRecord.orientation;
  if (typeof directOrientation === "number") return directOrientation;
  if (typeof directOrientation === "string") {
    const parsed = Number.parseInt(directOrientation, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const hasExplicitMirroredFlag = (exif: ImagePickerAsset["exif"]): boolean => {
  const exifRecord = asExifRecord(exif);
  if (!exifRecord) return false;

  return Object.entries(exifRecord).some(([key, value]) => {
    if (!key.toLowerCase().includes("mirror")) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      return normalized === "true" || normalized === "1" || normalized === "yes";
    }
    return false;
  });
};

const isLikelyFrontCamera = (exif: ImagePickerAsset["exif"]): boolean => {
  const exifRecord = asExifRecord(exif);
  if (!exifRecord) return false;

  const hints = ["front", "selfie", "true depth"];
  return Object.values(exifRecord).some((value) => {
    if (typeof value !== "string") return false;
    const normalized = value.toLowerCase();
    return hints.some((hint) => normalized.includes(hint));
  });
};

const resolveFormat = (mimeType?: string | null): SaveFormat => {
  switch (mimeType) {
    case "image/png":
      return SaveFormat.PNG;
    case "image/webp":
      return SaveFormat.WEBP;
    default:
      return SaveFormat.JPEG;
  }
};

const runManipulation = async (
  uri: string,
  actions: Parameters<typeof manipulateAsync>[1],
  format: SaveFormat,
) => {
  try {
    return await manipulateAsync(uri, actions, {
      compress: 0.9,
      format,
    });
  } catch {
    const context = ImageManipulator.manipulate(uri);
    for (const action of actions ?? []) {
      if ("resize" in action) {
        context.resize(action.resize);
      } else if ("rotate" in action) {
        context.rotate(action.rotate);
      } else if ("flip" in action) {
        context.flip(action.flip);
      } else if ("crop" in action) {
        context.crop(action.crop);
      } else if ("extent" in action && context.extent) {
        context.extent(action.extent);
      }
    }

    const image = await context.renderAsync();
    const result = await image.saveAsync({
      compress: 0.9,
      format,
    });
    context.release();
    image.release();
    return result;
  }
};

export const normalizeCameraAsset = async (
  asset: ImagePickerAsset,
  options?: {
    forceUnmirror?: boolean;
  },
): Promise<ImagePickerAsset> => {
  const orientation = readOrientation(asset.exif);
  const actions: Parameters<typeof manipulateAsync>[1] = [];

  switch (orientation) {
    case 2:
      actions.push({ flip: FlipType.Horizontal });
      break;
    case 3:
      actions.push({ rotate: 180 });
      break;
    case 4:
      actions.push({ flip: FlipType.Vertical });
      break;
    case 5:
      actions.push({ rotate: 90 }, { flip: FlipType.Horizontal });
      break;
    case 6:
      actions.push({ rotate: 90 });
      break;
    case 7:
      actions.push({ rotate: 270 }, { flip: FlipType.Horizontal });
      break;
    case 8:
      actions.push({ rotate: 270 });
      break;
    default:
      break;
  }

  const shouldForceUnmirrorFrontCamera =
    Platform.OS === "ios" &&
    isLikelyFrontCamera(asset.exif) &&
    !MIRRORED_ORIENTATIONS.has(orientation ?? 1) &&
    (orientation === null || orientation === 1);

  if (options?.forceUnmirror && !MIRRORED_ORIENTATIONS.has(orientation ?? 1)) {
    actions.push({ flip: FlipType.Horizontal });
  } else if (
    (hasExplicitMirroredFlag(asset.exif) || shouldForceUnmirrorFrontCamera) &&
    !MIRRORED_ORIENTATIONS.has(orientation ?? 1)
  ) {
    actions.push({ flip: FlipType.Horizontal });
  }

  if (actions.length === 0) return asset;

  const saveFormat = resolveFormat(asset.mimeType);
  try {
    const manipulated = await runManipulation(asset.uri, actions, saveFormat);

    return {
      ...asset,
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
      exif: {
        ...(asset.exif ?? {}),
        Orientation: 1,
      },
    };
  } catch {
    if (asset.base64) {
      try {
        const mimeType = asset.mimeType ?? "image/jpeg";
        const dataUri = `data:${mimeType};base64,${asset.base64}`;
        const manipulated = await runManipulation(dataUri, actions, saveFormat);
        return {
          ...asset,
          uri: manipulated.uri,
          width: manipulated.width,
          height: manipulated.height,
          exif: {
            ...(asset.exif ?? {}),
            Orientation: 1,
          },
        };
      } catch {
        return asset;
      }
    }
    return asset;
  }
};
