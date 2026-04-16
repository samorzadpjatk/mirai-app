/**
 * Event DTOs
 *
 * Data Transfer Objects for Event domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";

/**
 * Event type enumeration
 */
export enum EventType {
  ACTIVITY = "ACTIVITY",
  MEAL = "MEAL",
  TRANSPORT = "TRANSPORT",
  ACCOMMODATION = "ACCOMMODATION",
  MEETING = "MEETING",
  OTHER = "OTHER",
}

/**
 * Event status enumeration
 */
export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

/**
 * EventDTO - Lightweight representation of an event
 */
export interface EventDTO {
  id: string;
  tripId: string;
  groupId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date | null;
  type: EventType;
  status: EventStatus;
  maxParticipants: number | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * EventParticipantDTO - Representation of an event participant
 */
export interface EventParticipantDTO {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  registeredAt: Date;
}

/**
 * Paginated result for event queries
 */
export type EventPaginatedResult = PaginatedResult<EventDTO>;
