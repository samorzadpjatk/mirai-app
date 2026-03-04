import React from "react";
import { PrimaryAddButton } from "~/components/common/buttons/PrimaryAddButton";

interface AddChallengeButtonProps {
  onPress: () => void;
}

export function AddChallengeButton({ onPress }: AddChallengeButtonProps) {
  return <PrimaryAddButton onPress={onPress} />;
}
