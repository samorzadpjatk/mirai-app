import { createRouterClient } from "@orpc/server";
import type { RequestContext } from "../api/orpc";
import { notificationDeliveryRouter } from "./routers/notificationDelivery";
import { notificationSenderRouter } from "./routers/notificationSender";

export const serviceRouter = {
  notificationDelivery: notificationDeliveryRouter,
  notificationSender: notificationSenderRouter,
};

export type ServiceRouter = typeof serviceRouter;

export const createServiceCaller = (context: RequestContext) =>
  createRouterClient(serviceRouter, { context });
