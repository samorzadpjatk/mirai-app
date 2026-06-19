import { createORPCRouter } from "../../orpc";
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
