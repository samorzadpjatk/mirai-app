export interface Activity {
  id: string;
  activityType: string;
}

export type ActivityFilter = "all" | string;

export const filterActivities = <T extends Activity>(
  activities: T[],
  filter: ActivityFilter,
  focusId?: string,
): T[] => {
  const base = filter === "all" ? activities : activities.filter((a) => a.activityType === filter);

  if (!focusId) return base;

  const focused = base.find((a) => a.id === focusId);
  if (!focused) return base;

  const rest = base.filter((a) => a.id !== focusId);
  return [focused, ...rest];
};
