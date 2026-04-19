import {
  createBrandedId,
  type BrandedId,
  isValidUUID,
} from "../../shared/value-objects/branded-id";

// ImageId uses UUID (for media storage references)
export const ImageId = createBrandedId("ImageId", {
  validate: isValidUUID,
});
export type ImageId = BrandedId<"ImageId">;

// VideoId uses UUID (for media storage references)
export const VideoId = createBrandedId("VideoId", {
  validate: isValidUUID,
});
export type VideoId = BrandedId<"VideoId">;
