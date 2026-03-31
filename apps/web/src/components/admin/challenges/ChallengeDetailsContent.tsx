"use client";

import { useTrip } from "../../../contexts/TripContext";
import { ChallengeDetailsPage } from "./ChallengeDetailsPage";

interface ChallengeDetailsContentProps {
  challengeId: string;
}

export function ChallengeDetailsContent({
  challengeId,
}: ChallengeDetailsContentProps) {
  const { selectedTrip } = useTrip();

  return (
    <ChallengeDetailsPage
      tripId={selectedTrip?.id ?? ""}
      challengeId={challengeId}
    />
  );
}
