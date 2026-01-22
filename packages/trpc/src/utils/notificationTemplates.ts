/**
 * Notification templates for the notification-sender app
 */
export interface Notification {
    title: string;
    body: string;
    url: string;
}

export const INACTIVITY_NOTIFICATION: Notification = {
  title: "Zobacz gdzie są twoi znajomi",
  body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
  url: "/map",
};

export function getNotificationTemplate(key: string): Notification {
  switch (key) {
    case "inactivity":
      return INACTIVITY_NOTIFICATION;
    default:
      throw new Error(`Unknown notification template: ${key}`);
  }
}
