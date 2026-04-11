import { describe, it, expect, mock, beforeEach } from "bun:test";
import { EventBus } from "../EventBus";

describe("[UNIT] EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe("publish/subscribe", () => {
    it("should deliver events to subscribers", async () => {
      const handler = mock(() => Promise.resolve());

      eventBus.subscribe("test-event", handler);
      await eventBus.publish("test-event", { data: "test" });

      expect(handler).toHaveBeenCalledWith({ data: "test" });
    });

    it("should support multiple subscribers", async () => {
      const handler1 = mock(() => Promise.resolve());
      const handler2 = mock(() => Promise.resolve());

      eventBus.subscribe("test-event", handler1);
      eventBus.subscribe("test-event", handler2);
      await eventBus.publish("test-event", { data: "test" });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it("should not call subscribers for different events", async () => {
      const handler = mock(() => Promise.resolve());

      eventBus.subscribe("event-a", handler);
      await eventBus.publish("event-b", { data: "test" });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle unsubscribe", async () => {
      const handler = mock(() => Promise.resolve());

      const unsubscribe = eventBus.subscribe("test-event", handler);
      unsubscribe();
      await eventBus.publish("test-event", { data: "test" });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should continue if one subscriber fails", async () => {
      const errorHandler = mock(() => Promise.reject(new Error("Failed")));
      const successHandler = mock(() => Promise.resolve());

      eventBus.subscribe("test-event", errorHandler);
      eventBus.subscribe("test-event", successHandler);

      // Should not throw
      await eventBus.publish("test-event", { data: "test" });

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });
});
