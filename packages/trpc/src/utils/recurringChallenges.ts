import { type Prisma } from "@mirai-app/db";

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

interface RecurringTemplate {
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

const recurringTemplateSelect: Prisma.ChallengeSelect = {
  id: true,
  tripId: true,
  name: true,
  description: true,
  image: true,
  submissionType: true,
  scoringCategory: true,
  basePoints: true,
  firstPlacePoints: true,
  secondPlacePoints: true,
  thirdPlacePoints: true,
  status: true,
  startTime: true,
  endTime: true,
  dailyStartTime: true,
  dailyEndTime: true,
  targetLatitude: true,
  targetLongitude: true,
  expectedValue: true,
  autoApprove: true,
  createdAt: true,
  isRecurring: true,
} as const;

const toInstanceName = (templateName: string, dayIndex: number) =>
  `${templateName} #${dayIndex}`;

const shouldGenerateFromTemplate = (template: RecurringTemplate) =>
  template.isRecurring &&
  (template.status === "VISIBLE" || template.status === "ACTIVE");

export const ensureRecurringInstanceForTemplate = async (params: {
  tx: Prisma.TransactionClient;
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

  const existing = await params.tx.challenge.findFirst({
    where: {
      tripId: template.tripId,
      isRecurring: false,
      name: instanceName,
      startTime: dailyBounds.start,
      endTime: dailyBounds.end,
    },
    select: { id: true, status: true },
  });

  if (existing) {
    return { id: existing.id, status: existing.status, created: false };
  }

  const created = await params.tx.challenge.create({
    data: {
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
    },
    select: { id: true, status: true },
  });

  return { id: created.id, status: created.status, created: true };
};

export const precreateRecurringInstancesForTemplate = async (params: {
  tx: Prisma.TransactionClient;
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

    const existing = await params.tx.challenge.findFirst({
      where: {
        tripId: template.tripId,
        isRecurring: false,
        name: instanceName,
        startTime: dailyBounds.start,
        endTime: dailyBounds.end,
      },
      select: { id: true, status: true },
    });

    if (existing) {
      results.push({ id: existing.id, status: existing.status, created: false });
      continue;
    }

    const created = await params.tx.challenge.create({
      data: {
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
      },
      select: { id: true, status: true },
    });

    results.push({ id: created.id, status: created.status, created: true });
  }

  return results;
};

export const ensureRecurringInstancesForTrip = async (params: {
  tx: Prisma.TransactionClient;
  tripId: string;
  now?: Date;
}) => {
  const templates = await params.tx.challenge.findMany({
    where: {
      tripId: params.tripId,
      isRecurring: true,
    },
    select: recurringTemplateSelect,
  });

  const results: { id: string; status: string; created: boolean }[] = [];
  for (const template of templates) {
    const ensured = await precreateRecurringInstancesForTemplate({
      tx: params.tx,
      template: template as RecurringTemplate,
      now: params.now,
    });
    if (ensured.length > 0) {
      results.push(...ensured);
    }
  }
  return results;
};

export const resolveRecurringChallengeIdForTrip = async (params: {
  tx: Prisma.TransactionClient;
  tripId: string;
  challengeId: string;
  now?: Date;
}) => {
  const challenge = await params.tx.challenge.findFirst({
    where: {
      id: params.challengeId,
      tripId: params.tripId,
    },
    select: recurringTemplateSelect,
  });

  if (!challenge) {
    return null;
  }

  if (!challenge.isRecurring) {
    return challenge.id;
  }

  const ensured = await ensureRecurringInstanceForTemplate({
    tx: params.tx,
    template: challenge as RecurringTemplate,
    now: params.now,
  });

  return ensured?.id ?? challenge.id;
};
