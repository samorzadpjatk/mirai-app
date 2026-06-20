import {
  getNextScheduledStartDate,
  normalizeScheduleWindow,
  toOptionalString,
} from "@mirai-app/common/notifications";
import { resolveAuthEmail } from "../../../utils/authEmails";
import type { ScheduledNotificationTemplate } from "../../../utils/notificationTemplates";

export { toOptionalString, normalizeScheduleWindow };

export const attachCreatedByEmail = <
  T extends { createdBy?: { authUserId?: string | null } | null },
>(
  schedule: T,
  emailByAuthUserId: Map<string, string | null>,
) => {
  const createdBy = schedule.createdBy;
  if (!createdBy) return schedule;
  const { authUserId, ...rest } = createdBy;
  return {
    ...schedule,
    createdBy: {
      ...rest,
      email: resolveAuthEmail(emailByAuthUserId, authUserId),
    },
  };
};

export function getTemplateScheduleDates(template: ScheduledNotificationTemplate): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const startDate = getNextScheduledStartDate(template.hour, template.minute, now);
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  return { startDate, endDate };
}
