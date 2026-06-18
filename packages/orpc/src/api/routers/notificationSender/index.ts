import { createORPCRouter } from "../../orpc";
import {
  sendMobileNotificationsMutation,
  trackDeliveryCompleteMutation,
  trackDeliveryFailureMutation,
  trackDeliveryStartMutation,
} from "./mutations";
import { checkInactiveUsers } from "./queries";

export const notificationSenderRouter = createORPCRouter({
  sendMobileNotifications: sendMobileNotificationsMutation,
  trackDeliveryStart: trackDeliveryStartMutation,
  trackDeliveryComplete: trackDeliveryCompleteMutation,
  trackDeliveryFailure: trackDeliveryFailureMutation,
  checkInactiveUsers,
});
