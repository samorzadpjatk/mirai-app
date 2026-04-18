import { Context } from "effect";
import type {
  ITripParticipantPort,
  TripParticipant,
} from "@mirai-app/domain/trip";

/**
 * TripParticipant Port - Context.Tag for Effect DI
 */
export class TripParticipantPortTag extends Context.Tag("TripParticipantPort")<
  TripParticipantPortTag,
  ITripParticipantPort
>() {}

export type { ITripParticipantPort, TripParticipant };

/**
 * @deprecated Use TripParticipantPortTag instead. Kept for backward compatibility.
 */
export const TripParticipantPort = TripParticipantPortTag;

/**
 * @deprecated Use ITripParticipantPort instead. Kept for backward compatibility.
 */
export type TripParticipantPort = typeof TripParticipantPortTag;
