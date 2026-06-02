export interface VotingTimesInput {
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  status: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED";
  votingStartTime?: Date;
  votingEndTime?: Date;
  peerVotingTemplateWindow?: {
    votingStartTime: Date;
    votingEndTime: Date;
  } | null;
}

export interface VotingTimesResult {
  votingStartTime: Date | null | undefined;
  votingEndTime: Date | null | undefined;
}

export const resolveVotingTimes = (input: VotingTimesInput): VotingTimesResult => {
  if (input.scoringCategory !== "PEER_VOTING") {
    return {
      votingStartTime: null,
      votingEndTime: null,
    };
  }

  const useInputTimes = input.status === "VOTING_PHASE" || input.status === "COMPLETED";

  return {
    votingStartTime: useInputTimes ? input.votingStartTime : input.peerVotingTemplateWindow?.votingStartTime,
    votingEndTime: useInputTimes ? input.votingEndTime : input.peerVotingTemplateWindow?.votingEndTime,
  };
};
