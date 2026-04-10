import { useQuery } from "urql";
import {
  GetCurrentUserDocument,
  GetGroupDocument,
} from "@mirai-app/graphql-types";

export function useGroupDetails(groupId?: string | null) {
  const [{ data: currentUserData, fetching: isLoadingUser }] = useQuery({
    query: GetCurrentUserDocument,
  });

  const [{ data: groupData, fetching: isLoadingGroup }] = useQuery({
    query: GetGroupDocument,
    variables: { id: groupId ?? "" },
    pause: !groupId,
  });

  return {
    currentUser: currentUserData?.me,
    isLoadingUser,
    group: groupData?.group,
    isLoadingGroup,
  } as const;
}
