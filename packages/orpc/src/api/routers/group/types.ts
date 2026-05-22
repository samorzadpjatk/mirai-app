import { z } from "zod";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";
import { isValidHttpUrl } from "../../../utils/url-validation";

export const GROUP_IMAGE_SIGNED_URL_SECONDS = 60 * 60 * 24;

export const joinRequestDecisionSchema = z.enum(["ACCEPT", "REJECT"]);

export const groupImageSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (normalizeSupabaseStoragePath(value)) {
      return true;
    }

    return isValidHttpUrl(value);
  }, "Image must be a valid HTTP/HTTPS URL or storage path")
  .optional();
