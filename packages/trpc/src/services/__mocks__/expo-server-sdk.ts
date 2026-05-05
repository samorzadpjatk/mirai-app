import type { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from "expo-server-sdk";

export class Expo {
  constructor(_options?: { accessToken?: string }) {}

  static isExpoPushToken(token: string): boolean {
    return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
  }

  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][] {
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }
    return chunks;
  }

  async sendPushNotificationsAsync(
    messages: ExpoPushMessage[]
  ): Promise<ExpoPushTicket[]> {
    return messages.map((message) => ({
      status: "ok",
      id: `ticket-${message.to}`,
    }));
  }

  async getPushNotificationReceiptsAsync(
    _ticketIds: string[]
  ): Promise<Record<string, ExpoPushReceipt>> {
    return {};
  }
}

export type { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt };