import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// TripParticipant uses CUID
export const TripParticipantId = createBrandedId("TripParticipantId", {
  validate: isValidCUID,
});
export type TripParticipantId = BrandedId<"TripParticipantId">;
