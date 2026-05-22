export interface GroupPage<T> {
  groups?: T[];
}

export const flattenGroups = <T>(pages: GroupPage<T>[] | undefined): T[] => {
  if (!pages) return [];
  return pages.flatMap((page) => page.groups ?? []);
};
