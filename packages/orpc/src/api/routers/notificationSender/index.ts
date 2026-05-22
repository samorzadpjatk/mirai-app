import { createORPCRouter } from "../../trpc";
import { checkInactiveUsers } from "./queries";
import {
  sendMobileNotificationsMutation,
  trackDeliveryStartMutation,
  trackDeliveryCompleteMutation,
  trackDeliveryFailureMutation,
} from "./mutations";

export const notificationSenderRouter = createORPCRouter({
  sendMobileNotifications: sendMobileNotificationsMutation,
  trackDeliveryStart: trackDeliveryStartMutation,
  trackDeliveryComplete: trackDeliveryCompleteMutation,
  trackDeliveryFailure: trackDeliveryFailureMutation,
  checkInactiveUsers,
});

export type NotificationSenderRouter = typeof notificationSenderRouter;
