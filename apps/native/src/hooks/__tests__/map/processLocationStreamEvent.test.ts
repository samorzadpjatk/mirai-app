import { describe, it, expect, jest } from "@jest/globals";
import { processLocationStreamEvent } from "../../map/useMapLocationStream";

describe("processLocationStreamEvent", () => {
  it("should process upsert event and update locations", () => {
    const setLocationsByUserId = jest.fn((updater: React.SetStateAction<Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>>) => {
      const prev: Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }> = {};
      return typeof updater === "function" ? updater(prev) : updater;
    }) as React.Dispatch<React.SetStateAction<Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>>>;
    const setUsersData = jest.fn((updater: React.SetStateAction<Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }>>) => {
      const prev: Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }> = {};
      return typeof updater === "function" ? updater(prev) : updater;
    }) as React.Dispatch<React.SetStateAction<Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }>>>;

    const event = {
      type: "upsert",
      location: {
        user: { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/avatar.jpg" },
        coords: { latitude: 52.2297, longitude: 21.0122 },
        timestamp: "2024-01-15T10:30:00Z",
      },
    };

    processLocationStreamEvent(event, setLocationsByUserId, setUsersData);

    expect(setLocationsByUserId).toHaveBeenCalled();
    expect(setUsersData).toHaveBeenCalled();
  });

  it("should process delete event and remove user", () => {
    const setLocationsByUserId = jest.fn((updater: React.SetStateAction<Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>>) => {
      const prev: Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }> = { "user-1": { latitude: 52, longitude: 21, updatedAt: "2024-01-15T10:30:00Z" } };
      return typeof updater === "function" ? updater(prev) : updater;
    }) as React.Dispatch<React.SetStateAction<Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>>>;
    const setUsersData = jest.fn((updater: React.SetStateAction<Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }>>) => {
      const prev: Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }> = { "user-1": { name: "John" } };
      return typeof updater === "function" ? updater(prev) : updater;
    }) as React.Dispatch<React.SetStateAction<Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }>>>;

    const event = {
      type: "delete",
      userId: "user-1",
    };

    processLocationStreamEvent(event, setLocationsByUserId, setUsersData);

    expect(setLocationsByUserId).toHaveBeenCalled();
    expect(setUsersData).toHaveBeenCalled();
  });

  it("should ignore unknown event types", () => {
    const setLocationsByUserId = jest.fn();
    const setUsersData = jest.fn();

    const event = {
      type: "unknown",
    };

    processLocationStreamEvent(event, setLocationsByUserId, setUsersData);

    expect(setLocationsByUserId).not.toHaveBeenCalled();
    expect(setUsersData).not.toHaveBeenCalled();
  });
});
