import type {
  UserAgentSelect,
  UserAgentInsert,
} from "@mirai-app/frameworks/drizzle/schema";

/**
 * UserAgent telemetry record structure
 */
export interface UserAgentRecord {
  id: string;
  userAgent: string;
  platform: string | null;
  userId: string | null;
  endpoint: string | null;
  timestamp: Date;
  createdAt: Date;
}

/**
 * UserAgentDrizzleMapper
 *
 * Maps between telemetry data and UserAgent database records using Drizzle.
 * This is a simple mapper for telemetry persistence.
 */
export class UserAgentDrizzleMapper {
  /**
   * Convert a Drizzle UserAgent record to a UserAgentRecord
   */
  static toDomain(record: UserAgentSelect): UserAgentRecord {
    return {
      id: record.id,
      userAgent: record.userAgent,
      platform: record.platform ?? null,
      userId: record.userId ?? null,
      endpoint: record.endpoint ?? null,
      timestamp: record.timestamp,
      createdAt: record.createdAt,
    };
  }

  /**
   * Convert telemetry data to Drizzle insert input
   */
  static toInsert(data: {
    userAgent: string;
    platform: string | null;
    userId: string | null;
    endpoint: string | null;
    timestamp: Date;
  }): UserAgentInsert {
    return {
      userAgent: data.userAgent,
      platform: data.platform,
      userId: data.userId,
      endpoint: data.endpoint,
      timestamp: data.timestamp,
    };
  }
}
