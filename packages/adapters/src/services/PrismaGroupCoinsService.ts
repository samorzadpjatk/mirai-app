import type { PrismaClient } from "@repo/frameworks/prisma";

/**
 * Manages group coin balance and transactions
 */
export class PrismaGroupCoinsService {
  constructor(private prisma: PrismaClient) {}

  async getBalance(groupId: string): Promise<number> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { coins: true },
    });
    return group?.coins ?? 0;
  }

  async deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void> {
    await this.prisma.group.update({
      where: { id: groupId },
      data: { coins: { decrement: amount } },
    });

    await this.prisma.coinTransaction.create({
      data: {
        groupId,
        amount: -amount,
        reason,
        adminId,
      },
    });
  }

  async addCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void> {
    await this.prisma.group.update({
      where: { id: groupId },
      data: { coins: { increment: amount } },
    });

    await this.prisma.coinTransaction.create({
      data: {
        groupId,
        amount,
        reason,
        adminId,
      },
    });
  }
}
