import { createORPCRouter } from "../../trpc";
import {
  bulkDelete,
  bulkToggleActive,
  create,
  deleteSchedule,
  duplicate,
  toggleActive,
  update,
  updateLastRun,
  upsertTemplate,
} from "./mutations";
import { getActiveSchedules, getAll, getById, getExecutionHistory, getUpcoming } from "./queries";

export const notificationScheduleRouter = createORPCRouter({
  getAll,
  getActiveSchedules,
  getUpcoming,
  getById,
  getExecutionHistory,
  create,
  upsertTemplate,
  update,
  delete: deleteSchedule,
  bulkDelete,
  duplicate,
  toggleActive,
  bulkToggleActive,
  updateLastRun,
});
