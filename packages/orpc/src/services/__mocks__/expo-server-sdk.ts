import type { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from "expo-server-sdk";

export class Expo {
  constructor(_options?: { accessToken?: string }) {
    // Mock constructor - parameter prefixed with underscore to indicate intentional non-use
  }

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

  async sendPushNotificationsAsync(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    await Promise.resolve();
    return messages.map((message) => ({
      status: "ok",
      id: `ticket-${String(message.to)}`,
    }));
  }

  async getPushNotificationReceiptsAsync(
    _ticketIds: string[],
  ): Promise<Record<string, ExpoPushReceipt>> {
    await Promise.resolve();
    return {};
  }
}

export type { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt };
