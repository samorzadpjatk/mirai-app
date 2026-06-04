import { serviceAccountProcedure } from "../../trpc";
import type { InactivityCheckResult } from "./types";

export const checkInactiveUsers = serviceAccountProcedure.handler(() => {
  return {
    checked: 0,
    notified: 0,
    skipped: 0,
    errors: 0,
  } satisfies InactivityCheckResult;
});
