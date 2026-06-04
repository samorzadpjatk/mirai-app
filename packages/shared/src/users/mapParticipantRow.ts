export interface ParticipantRow {
  trip_participants: {
    id: string;
    userId: string;
    tripId: string;
    groupId: string | null;
    wristNumber: string | null;
    houseNumber: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
  users: {
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  groups: {
    id: string;
    name: string;
  } | null;
}

export interface MappedParticipant {
  user: {
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  wristNumber: string | null;
  houseNumber: string | null;
  tripId: string;
}

export function mapParticipantRow(row: ParticipantRow): MappedParticipant {
  return {
    user: {
      id: row.users.id,
      authUserId: row.users.authUserId,
      firstName: row.users.firstName,
      lastName: row.users.lastName,
      role: row.users.role,
    },
    group: row.groups ? { id: row.groups.id, name: row.groups.name } : null,
    wristNumber: row.trip_participants.wristNumber,
    houseNumber: row.trip_participants.houseNumber,
    tripId: row.trip_participants.tripId,
  };
}
