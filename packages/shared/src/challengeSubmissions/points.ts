export const resolveAwardedPoints = (
  challenge: {
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
  },
  input: { awardedPoints?: number; ranking?: number },
) => {
  if (typeof input.awardedPoints === "number") return input.awardedPoints;
  if (typeof input.ranking === "number") {
    switch (input.ranking) {
      case 1:
        return challenge.firstPlacePoints ?? challenge.basePoints;
      case 2:
        return challenge.secondPlacePoints ?? challenge.basePoints;
      case 3:
        return challenge.thirdPlacePoints ?? challenge.basePoints;
      default:
        return challenge.basePoints;
    }
  }

  return challenge.basePoints;
};
