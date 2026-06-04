export interface InitialStatusInput {
  status?: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED";
  isRecurring?: boolean;
  startTime?: Date;
  endTime?: Date;
}

export const computeInitialStatus = (
  input: InitialStatusInput,
  now: Date,
): "HIDDEN" | "VISIBLE" | "ACTIVE" => {
  const requestedStatus = input.status ?? "HIDDEN";
  const shouldActivateImmediately =
    !input.isRecurring &&
    requestedStatus === "VISIBLE" &&
    Boolean(input.startTime) &&
    input.startTime! <= now &&
    (!input.endTime || input.endTime > now);

  return shouldActivateImmediately
    ? "ACTIVE"
    : (requestedStatus as "HIDDEN" | "VISIBLE" | "ACTIVE");
};
