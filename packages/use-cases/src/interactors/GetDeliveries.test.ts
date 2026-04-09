import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetDeliveriesUseCase } from "./GetDeliveries";
import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
} from "../ports/NotificationDeliveryRepository";

describe("[UNIT] GetDeliveriesUseCase", () => {
  let mockRepo: NotificationDeliveryRepository;
  let useCase: GetDeliveriesUseCase;

  beforeEach(() => {
    mockRepo = {
      findMany: mock(() =>
        Promise.resolve([
          {
            id: "delivery-1",
            notificationId: "notif-1",
            tripId: "trip-1",
            status: "success",
            totalRecipients: 10,
            successCount: 8,
            failureCount: 2,
            deliveryStartedAt: new Date(),
          },
        ] as NotificationDelivery[]),
      ),
      count: mock(() => Promise.resolve(1)),
    } as unknown as NotificationDeliveryRepository;

    useCase = new GetDeliveriesUseCase(mockRepo);
  });

  it("should return deliveries with pagination", async () => {
    const input = {
      filters: { tripId: "trip-1" },
      pagination: { limit: 10, offset: 0 },
    };

    const result = await useCase.execute(input);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.deliveries).toHaveLength(1);
      expect(result.value.total).toBe(1);
      expect(result.value.limit).toBe(10);
      expect(result.value.offset).toBe(0);
    }
  });

  it("should use default pagination", async () => {
    const input = { filters: { tripId: "trip-1" } };

    const result = await useCase.execute(input);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.limit).toBe(50);
      expect(result.value.offset).toBe(0);
    }
  });

  it("should filter by status", async () => {
    const findManyMock = mock(() =>
      Promise.resolve([] as NotificationDelivery[]),
    );
    mockRepo.findMany = findManyMock;

    const input = {
      filters: { tripId: "trip-1", status: "success" as const },
    };

    await useCase.execute(input);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
      expect.any(Object),
    );
  });

  it("should return error on repository failure", async () => {
    mockRepo.findMany = mock(() => Promise.reject(new Error("DB error")));

    const result = await useCase.execute({ filters: {} });

    expect(result.kind).toBe("err");
  });
});
