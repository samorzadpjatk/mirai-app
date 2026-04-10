import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetChallengeSubmissionByChallengeAndGroupQuery,
  useGetCurrentUserQuery,
} from "@mirai-app/graphql-types";

const createGraphQLClient = async () => {
  const graphqlUrl =
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
  const token = await SecureStore.getItemAsync("sb-access-token");

  return new GraphQLClient(graphqlUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

// TODO: This needs a proper GetChallengeById query in GraphQL schema
// For now, we're using a workaround via trip data or challenge submission data
export function useChallengeDetails(
  challengeId?: string | null,
  tripId?: string | null,
  groupId?: string | null,
) {
  const currentUserQuery = useQuery({
    queryKey: useGetCurrentUserQuery.getKey(),
    queryFn: async () => {
      const client = await createGraphQLClient();
      return useGetCurrentUserQuery.fetcher(client)();
    },
  });

  // Use challenge submission by challenge and group to get challenge data
  const challengeQuery = useQuery({
    queryKey: useGetChallengeSubmissionByChallengeAndGroupQuery.getKey({
      challengeId: challengeId ?? "",
      groupId: groupId ?? "",
    }),
    queryFn: async () => {
      const client = await createGraphQLClient();
      return useGetChallengeSubmissionByChallengeAndGroupQuery.fetcher(client, {
        challengeId: challengeId ?? "",
        groupId: groupId ?? "",
      })();
    },
    enabled: !!challengeId && !!groupId,
  });

  // Extract challenge data from the submission response
  const challenge = useMemo(() => {
    const submission =
      challengeQuery.data?.challengeSubmissionByChallengeAndGroup;
    if (!submission?.challenge) return null;
    return submission.challenge;
  }, [challengeQuery.data]);

  const isAssignedToUser = useMemo(() => {
    if (!currentUserQuery.data?.me || !challenge) return false;
    return false;
  }, [currentUserQuery.data, challenge]);

  return {
    challenge,
    isLoading: challengeQuery.isLoading || currentUserQuery.isLoading,
    isAssignedToUser,
  };
}
