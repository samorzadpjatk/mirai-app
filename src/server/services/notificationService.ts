interface NotificationData {
  title: string;
  body: string;
  url: string;
}

export class NotificationService {

  /**
   * Create notifications for common group events
   */
  static createCoinsAddedNotification(groupName: string, amount: number, reason: string): NotificationData {
    return {
      title: `💰 ${groupName} received coins!`,
      body: `Your guild received ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`,
      url: "/group/my",
    };
  }
  static createCoinsRemovedNotification(groupName: string, amount: number, reason: string): NotificationData {
    return {
      title: `💸 ${groupName} - Coins Seized`,
      body: `Your guild lost ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`,
      url: "/group/my",
    };
  }

  static createNewMemberNotification(groupName: string, memberName: string): NotificationData {
    return {
      title: `👥 New member in ${groupName}!`,
      body: `${memberName} joined your guild!`,
      url: "/group/my",
    };
  }

  static createRankingUpdateNotification(groupName: string, newPosition: number): NotificationData {
    return {
      title: `🏆 Ranking update!`,
      body: `${groupName} now holds ${newPosition} place in the ranking! Click me to check the current ranking.`,
      url: "/ranking",
    };
  }
}
