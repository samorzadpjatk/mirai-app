import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { extractSharingUserIds, useMapSharing } from "../../map/useMapSharing";

describe("useMapSharing (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return sharing settings", async () => {
    const mockSettings = {
      isSharingLocation: true,
      usersToShareWith: [{ id: "user-1", firstName: "John", lastName: "Doe" }],
    };

    server.use(
      createORPCHandler(["location", "getMySharingSettings"], () => mockSettings),
      createORPCHandler(["location", "getAllUsersForSharing"], () => []),
    );

    const { result } = renderHookWithMSW(() => useMapSharing(true, "trip-123"));

    await waitFor(() => {
      expect(result.current.sharingSettings).toEqual(mockSettings);
    });

    expect(result.current.sharingUserIds).toEqual(["user-1"]);
    expect(result.current.allAvailableUsers).toEqual([]);
  });

  it("should return empty sharing user ids when no settings", async () => {
    server.use(createORPCHandler(["location", "getMySharingSettings"], () => null));

    const { result } = renderHookWithMSW(() => useMapSharing(false, null));

    await waitFor(() => {
      expect(result.current.sharingSettings).toBeNull();
    });

    expect(result.current.sharingUserIds).toEqual([]);
    expect(result.current.allAvailableUsers).toBeUndefined();
  });

  it("should expose mutation pending states", async () => {
    server.use(
      createORPCHandler(["location", "getMySharingSettings"], () => null),
      createORPCHandler(["location", "getAllUsersForSharing"], () => []),
      createORPCHandler(
        ["location", "updateSharingSettings"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["location", "removeUserFromSharing"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useMapSharing(true, "trip-123"));

    await waitFor(() => {
      expect(result.current.sharingSettings).toBeNull();
    });

    // Trigger updateSharing without awaiting so we can observe pending state
    result.current.updateSharing(["user-1"]).catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isUpdatingSharing).toBe(true);
    });

    // Trigger removeUser without awaiting so we can observe pending state
    result.current.removeUser("user-1").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isRemovingUser).toBe(true);
    });
  });

  it("keeps updateSharing and removeUser stable across re-renders", async () => {
    server.use(
      createORPCHandler(["location", "getMySharingSettings"], () => null),
      createORPCHandler(["location", "getAllUsersForSharing"], () => []),
    );

    const { result, rerender } = renderHookWithMSW(() => useMapSharing(true, "trip-123"));

    await waitFor(() => {
      expect(result.current.sharingSettings).toBeNull();
    });

    const firstUpdateSharing = result.current.updateSharing;
    const firstRemoveUser = result.current.removeUser;

    rerender(undefined);
    rerender(undefined);

    // The map screen puts both callbacks in an effect dependency array; unstable
    // identities made that effect re-run on every render and clobber user state.
    expect(result.current.updateSharing).toBe(firstUpdateSharing);
    expect(result.current.removeUser).toBe(firstRemoveUser);
  });
});

describe("extractSharingUserIds", () => {
  it("should extract user ids from sharing settings", () => {
    const settings = {
      usersToShareWith: [{ id: "u1" }, { id: "u2" }, { id: "u3" }],
    };
    expect(extractSharingUserIds(settings)).toEqual(["u1", "u2", "u3"]);
  });

  it("should return empty array when settings is null", () => {
    expect(extractSharingUserIds(null)).toEqual([]);
  });

  it("should return empty array when settings is undefined", () => {
    expect(extractSharingUserIds(undefined)).toEqual([]);
  });

  it("should return empty array when usersToShareWith is empty", () => {
    expect(extractSharingUserIds({ usersToShareWith: [] })).toEqual([]);
  });
});
