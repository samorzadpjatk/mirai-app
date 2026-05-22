import { createORPCRouter } from "../../trpc";
import {
  getDeliveries,
  getDeliveryByNotificationId,
  getDeliveryStats,
  getFailedDeliveries,
} from "./queries";

export const notificationDeliveryRouter = createORPCRouter({
  getDeliveries,
  getDeliveryByNotificationId,
  getDeliveryStats,
  getFailedDeliveries,
});
