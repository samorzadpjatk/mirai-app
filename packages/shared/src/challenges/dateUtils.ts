export const MAX_RECURRING_DAYS = 30;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const MAX_PEER_VOTING_DURATION_HOURS = 24 * 30;

export const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const endOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

export const inferRecurringDaysFromWindow = (startTime?: Date | null, endTime?: Date | null) => {
  if (!startTime || !endTime) return null;
  const start = startOfDay(startTime);
  const end = startOfDay(endTime);
  if (end.getTime() < start.getTime()) return null;
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
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
