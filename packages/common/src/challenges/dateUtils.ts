import { addZonedDays, zonedDayNumber, zonedEndOfDay, zonedStartOfDay } from "../utils/timezone";

export const MAX_RECURRING_DAYS = 30;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const MAX_PEER_VOTING_DURATION_HOURS = 24 * 30;

/**
 * Day boundaries are the ones an admin in Poland sees on a calendar, not the
 * ones the server's own clock happens to be on. `Date#setHours` would read the
 * process time zone, which is UTC in the deployed image — a recurring window
 * anchored on "today" would then start at 02:00 Polish time in summer.
 */
export const startOfDay = (date: Date) => zonedStartOfDay(date);

export const endOfDay = (date: Date) => zonedEndOfDay(date);

export const addDays = (date: Date, days: number) => addZonedDays(date, days);

export const inferRecurringDaysFromWindow = (startTime?: Date | null, endTime?: Date | null) => {
  if (!startTime || !endTime) return null;
  // Counted as calendar days rather than elapsed milliseconds: a Polish day is
  // 23 or 25 hours long on the two DST changeovers.
  const days = zonedDayNumber(endTime) - zonedDayNumber(startTime);
  if (days < 0) return null;
  return days + 1;
};

export const resolveRecurringDays = (params: {
  isRecurring?: boolean | null;
  recurringDays?: number | null;
  fallbackDays?: number | null;
}) => {
  if (!params.isRecurring) return null;
  const value = params.recurringDays ?? params.fallbackDays;
  if (!value || value < 1) {
    return null;
  }
  if (!Number.isInteger(value) || value > MAX_RECURRING_DAYS) {
    return null;
  }
  return value;
};

export const resolveRecurringTemplateWindow = (params: {
  anchorDate: Date;
  recurringDays: number;
}) => {
  const anchorDay = startOfDay(params.anchorDate);
  const endDay = addDays(anchorDay, params.recurringDays - 1);
  return {
    startTime: anchorDay,
    endTime: endOfDay(endDay),
  };
};

export const inferPeerVotingDurationHours = (input: {
  votingDurationHours?: number | null;
  votingStartTime?: Date | null;
  votingEndTime?: Date | null;
  fallbackVotingStartTime?: Date | null;
  fallbackVotingEndTime?: Date | null;
}) => {
  if (input.votingDurationHours != null) {
    return input.votingDurationHours;
  }

  const start = input.votingStartTime ?? input.fallbackVotingStartTime;
  const end = input.votingEndTime ?? input.fallbackVotingEndTime;

  if (!start || !end) {
    return null;
  }

  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0) {
    return null;
  }

  return Math.max(1, Math.ceil(durationMs / HOUR_MS));
};

export const resolvePeerVotingTemplateWindow = (params: {
  submissionEndTime: Date;
  votingDurationHours: number;
}) => {
  const votingStartTime = new Date(params.submissionEndTime);
  const votingEndTime = new Date(votingStartTime.getTime() + params.votingDurationHours * HOUR_MS);

  return {
    votingStartTime,
    votingEndTime,
  };
};
