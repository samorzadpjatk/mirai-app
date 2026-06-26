import type { NotificationContext } from "../notifications/queries";
import { getUnreadCount } from "../notifications/queries";
import { getAll as getAllTrips } from "../trip/queries";
import type { UserContext } from "../user/queries";
import { getMy } from "../user/queries";

export type HomeContext = UserContext & NotificationContext;

export const getHomeFull = async (
  context: HomeContext,
  input:
    | {
        pagination?: {
          limit: number;
          offset: number;
        };
      }
    | undefined,
) => {
  const [user, trips, notifications] = await Promise.all([
    getMy(context),
    getAllTrips({ db: context.db, dbUser: { id: context.dbUser.id } }, input),
    getUnreadCount(context),
  ]);

  return {
    user,
    trips,
    notifications,
  };
};
