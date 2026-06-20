export interface GroupListItem {
  id: string;
  name: string;
  code: string;
  image: string | null;
  participantCount: number;
}

export const filterGroupsBySearch = <T extends { name: string }>(
  groups: T[],
  searchQuery: string,
): T[] => {
  if (!searchQuery) return groups;
  const query = searchQuery.toLowerCase();
  return groups.filter((group) => group.name.toLowerCase().includes(query));
};
