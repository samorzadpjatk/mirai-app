export enum ChallengeStatus {
  LOCKED = 'locked',
  INCOMPLETE = 'incomplete', 
  SELECTED = 'selected',
  COMPLETED = 'completed',
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  points: number;
  icon: string;
  iconColor: string;
  status: ChallengeStatus;
  size: 'normal' | 'wide' | 'tall';
  participantAvatars?: string[];
  additionalParticipants?: number;
}

export interface ProgressData {
  totalPoints: number;
  totalChallenges: number;
  completedChallenges: number;
  progressPercentage: number;
  expeditionName: string;
  expeditionYear: string;
}

export interface LeaderboardEntry {
  name: string;
  points: number;
  avatar?: string;
}

export interface TripChallengesData {
  progress: ProgressData;
  challenges: Challenge[];
  currentLeader: LeaderboardEntry;
  groupStatus: 'active' | 'inactive' | 'completed';
}