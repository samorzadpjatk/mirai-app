import { useMemo } from "react";
import { useQuery } from "urql";
import {
  GetChallengeSubmissionByChallengeAndGroupDocument,
  GetCurrentUserDocument,
} from "@mirai-app/graphql-client";

// NOTE: Challenge data retrieved via submission lookup (workaround)
// A direct GetChallengeById query would simplify this in the future
export function useChallengeDetails(
  challengeId?: string | null,
  tripId?: string | null,
  groupId?: string | null,
) {
  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
  });

  // Use challenge submission by challenge and group to get challenge data
  const [{ data: submissionData, fetching }] = useQuery({
    query: GetChallengeSubmissionByChallengeAndGroupDocument,
    variables: {
      challengeId: challengeId ?? "",
      groupId: groupId ?? "",
    },
    pause: !challengeId || !groupId,
  });

  // Extract challenge data from the submission response
  const challenge = useMemo(() => {
    const submission = submissionData?.challengeSubmissionByChallengeAndGroup;
    if (!submission?.challenge) return null;
    return submission.challenge;
  }, [submissionData]);

  const isAssignedToUser = useMemo(() => {
    if (!currentUserData?.me || !challenge) return false;
    return false;
  }, [currentUserData, challenge]);

  return {
    challenge,
    isLoading: fetching,
    isAssignedToUser,
  };
}
