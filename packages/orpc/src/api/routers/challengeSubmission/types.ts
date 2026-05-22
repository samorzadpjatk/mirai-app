export const submissionBaseColumns = {
  id: true,
  challengeId: true,
  groupId: true,
  imageIds: true,
  videoId: true,
  textContent: true,
  latitude: true,
  longitude: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  awardedPoints: true,
  bonusPoints: true,
  ranking: true,
  voteCount: true,
  voteScore: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const submissionWithRelations = {
  group: {
    columns: {
      id: true,
      name: true,
      description: true,
      image: true,
    },
  },
  reviewedBy: {
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      authUserId: true,
    },
  },
} as const;
