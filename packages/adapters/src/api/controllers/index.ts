/**
 * tRPC Controller Wrappers
 *
 * This module exports tRPC-ready controller objects that wrap the Clean Architecture
 * controllers with proper procedure types and context injection.
 *
 * Each controller object contains methods that are already wrapped as tRPC procedures,
 * making them easy to spread into createTRPCRouter().
 */

export { userController } from "./user-controller";
export { storageController } from "./storage-controller";
export { challengeController } from "./challenge-controller";
export { groupController } from "./group-controller";
export { tripController } from "./trip-controller";
export { notificationController } from "./notification-controller";
export { activityFeedController } from "./activity-feed-controller";
export { challengeSubmissionController } from "./challenge-submission-controller";
export { challengeVoteController } from "./challenge-vote-controller";
export { submissionReportController } from "./submission-report-controller";
export { notificationScheduleController } from "./notification-schedule-controller";
export { rewardController } from "./reward-controller";
export { coinController } from "./coin-controller";
export { coinTransactionController } from "./coin-transaction-controller";
export { sponsorController } from "./sponsor-controller";
export { locationController } from "./location-controller";
export { notificationDeliveryController } from "./notification-delivery-controller";
export { notificationSenderController } from "./notification-sender-controller";
