import { challenges } from "@mirai-app/db";
import type { DB, TransactionDB } from "@mirai-app/db";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const parseClock = (value?: string | null) => {
  if (!value) return null;
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return { hours, minutes };
};

const toDailyBounds = (params: {
  baseDate: Date;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
}) => {
  const startClock = parseClock(params.dailyStartTime);
  const endClock = parseClock(params.dailyEndTime);
  if (!startClock || !endClock) return null;

  const start = new Date(params.baseDate);
  start.setHours(startClock.hours, startClock.minutes, 0, 0);

  const end = new Date(params.baseDate);
  end.setHours(endClock.hours, endClock.minutes, 0, 0);
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
};

const resolveInstanceStatus = (now: Date, start: Date, end: Date) => {
  if (now.getTime() < start.getTime()) return "VISIBLE";
  if (now.getTime() >= end.getTime()) return "COMPLETED";
  return "ACTIVE";
};

export interface RecurringTemplate {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  basePoints: number;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  status: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED";
  startTime: Date | null;
  endTime: Date | null;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
  createdAt: Date;
  isRecurring: boolean;
}

const toInstanceName = (templateName: string, dayIndex: number) =>
  `${templateName} #${dayIndex}`;

const shouldGenerateFromTemplate = (template: RecurringTemplate) =>
  template.isRecurring &&
  (template.status === "VISIBLE" || template.status === "ACTIVE");

export const ensureRecurringInstanceForTemplate = async (params: {
  tx: DB | TransactionDB;
  template: RecurringTemplate;
  now?: Date;
}) => {
  const now = params.now ?? new Date();
  const template = params.template;
  if (!shouldGenerateFromTemplate(template)) {
    return null;
  }

  const anchorDay = startOfDay(template.startTime ?? template.createdAt);
  const today = startOfDay(now);
  if (today.getTime() < anchorDay.getTime()) {
    return null;
  }

  if (template.endTime) {
    const endDay = startOfDay(template.endTime);
    if (today.getTime() > endDay.getTime()) {
      return null;
    }
  }

  const dailyBounds = toDailyBounds({
    baseDate: today,
    dailyStartTime: template.dailyStartTime,
    dailyEndTime: template.dailyEndTime,
  });
  if (!dailyBounds) {
    return null;
  }

  const dayIndex = Math.floor((today.getTime() - anchorDay.getTime()) / DAY_MS) + 1;
  const instanceName = toInstanceName(template.name, dayIndex);

  const existing = await params.tx.query.challenges.findFirst({
    where: (c, { eq, and }) => and(
      eq(c.tripId, template.tripId),
      eq(c.isRecurring, false),
      eq(c.name, instanceName),
      eq(c.startTime, dailyBounds.start),
      eq(c.endTime, dailyBounds.end),
    ),
  });

  if (existing) {
    return { id: existing.id, status: existing.status, created: false };
  }

  const created = await params.tx.insert(challenges).values({
    tripId: template.tripId,
    name: instanceName,
    description: template.description,
    image: template.image,
    submissionType: template.submissionType,
    scoringCategory: template.scoringCategory,
    isRecurring: false,
    dailyStartTime: null,
    dailyEndTime: null,
    basePoints: template.basePoints,
    firstPlacePoints: template.firstPlacePoints,
    secondPlacePoints: template.secondPlacePoints,
    thirdPlacePoints: template.thirdPlacePoints,
    status: resolveInstanceStatus(now, dailyBounds.start, dailyBounds.end),
    startTime: dailyBounds.start,
    endTime: dailyBounds.end,
    votingStartTime: null,
    votingEndTime: null,
    targetLatitude: template.targetLatitude,
    targetLongitude: template.targetLongitude,
    expectedValue: template.expectedValue,
    autoApprove: template.autoApprove,
  }).returning({ id: challenges.id, status: challenges.status });

  if (!created[0]) {
    return null;
  }

  return { id: created[0].id, status: created[0].status, created: true };
};

export const precreateRecurringInstancesForTemplate = async (params: {
  tx: DB | TransactionDB;
  template: RecurringTemplate;
  now?: Date;
}) => {
  const template = params.template;
  if (!shouldGenerateFromTemplate(template)) {
    return [];
  }

  const anchorDay = startOfDay(template.startTime ?? template.createdAt);
  const endDay = startOfDay(template.endTime ?? template.startTime ?? template.createdAt);
  if (endDay.getTime() < anchorDay.getTime()) {
    return [];
  }

  const daysCount =
    Math.floor((endDay.getTime() - anchorDay.getTime()) / DAY_MS) + 1;
  const now = params.now ?? new Date();
  const results: { id: string; status: string; created: boolean }[] = [];

  for (let offset = 0; offset < daysCount; offset += 1) {
    const targetDay = addDays(anchorDay, offset);
    const dayIndex = offset + 1;
    const instanceName = toInstanceName(template.name, dayIndex);
    const dailyBounds = toDailyBounds({
      baseDate: targetDay,
      dailyStartTime: template.dailyStartTime,
      dailyEndTime: template.dailyEndTime,
    });
    if (!dailyBounds) {
      continue;
    }

    const existing = await params.tx.query.challenges.findFirst({
      where: (c, { eq, and }) => and(
        eq(c.tripId, template.tripId),
        eq(c.isRecurring, false),
        eq(c.name, instanceName),
        eq(c.startTime, dailyBounds.start),
        eq(c.endTime, dailyBounds.end),
      ),
    });

    if (existing) {
      results.push({ id: existing.id, status: existing.status, created: false });
      continue;
    }

    const created = await params.tx.insert(challenges).values({
      tripId: template.tripId,
      name: instanceName,
      description: template.description,
      image: template.image,
      submissionType: template.submissionType,
      scoringCategory: template.scoringCategory,
      isRecurring: false,
      dailyStartTime: null,
      dailyEndTime: null,
      basePoints: template.basePoints,
      firstPlacePoints: template.firstPlacePoints,
      secondPlacePoints: template.secondPlacePoints,
      thirdPlacePoints: template.thirdPlacePoints,
      status: resolveInstanceStatus(now, dailyBounds.start, dailyBounds.end),
      startTime: dailyBounds.start,
      endTime: dailyBounds.end,
      votingStartTime: null,
      votingEndTime: null,
      targetLatitude: template.targetLatitude,
      targetLongitude: template.targetLongitude,
      expectedValue: template.expectedValue,
      autoApprove: template.autoApprove,
    }).returning({ id: challenges.id, status: challenges.status });

    if (created[0]) {
      results.push({ id: created[0].id, status: created[0].status, created: true });
    }
  }

  return results;
};

export const ensureRecurringInstancesForTrip = async (params: {
  tx: DB | TransactionDB;
  tripId: string;
  now?: Date;
}) => {
  const templates = await params.tx.query.challenges.findMany({
    where: (c, { eq, and }) => and(eq(c.tripId, params.tripId), eq(c.isRecurring, true)),
  });

  const results: { id: string; status: string; created: boolean }[] = [];
  for (const template of templates) {
    const ensured = await precreateRecurringInstancesForTemplate({
      tx: params.tx,
      template,
      now: params.now,
    });
    if (ensured.length > 0) {
      results.push(...ensured);
    }
  }
  return results;
};

export const resolveRecurringChallengeIdForTrip = async (params: {
  tx: DB | TransactionDB;
  tripId: string;
  challengeId: string;
  now?: Date;
}) => {
  const challenge = await params.tx.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, params.challengeId), eq(c.tripId, params.tripId)),
  });

  if (!challenge) {
    return null;
  }

  if (!challenge.isRecurring) {
    return challenge.id;
  }

  const ensured = await ensureRecurringInstanceForTemplate({
    tx: params.tx,
    template: challenge,
    now: params.now,
  });

  return ensured?.id ?? challenge.id;
};
