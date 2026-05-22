import { createORPCRouter } from "../../trpc";
import { getAll, getActiveSchedules, getUpcoming, getById, getExecutionHistory } from "./queries";
import {
  create,
  upsertTemplate,
  update,
  deleteSchedule,
  bulkDelete,
  duplicate,
  toggleActive,
  bulkToggleActive,
  updateLastRun,
} from "./mutations";

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
