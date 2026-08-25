import client from "../client";

/* -*-*-*-*- Feedsw API -*-*-*-*- */

export interface FeedItem {
  roundRefId: number;
  playerName: string;
  groupName?: string;
  playerAvatar: string | null;
  courseName: string;
  teeBoxName: string;
  date: string;
  grossScore: number;
  netScore: number;
  stablefordPoints: number;
  totalPar: number;
  scoreToPar: number;
  holesPlayed: number;
  likeCount: number;
  isLikedByMe: boolean;
  isAuthenticated: boolean;
  authenticatedBy: string | null;
  canAuthenticate: boolean;
  isDQ: boolean;
  isTournament: boolean;
}

export const getFeedApi = async () => {
  try {
    const response = await client.get(`feed`);
    return response.data as FeedItem[];
  } catch (error) {
    console.error("Fetching Feed Error:", error);
    throw error;
  }
};

export const likeFeedApi = async (id: string | number) => {
  try {
    const response = await client.post(`feed/like/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error liking feed item ${id}:`, error);
    throw error;
  }
};

export interface LikedUser {
  type: string;
  user: string;
  date: string;
  profilePictureUrl?: string | null;
}

export const getLikedUsersApi = async (roundRefId: number | string) => {
  try {
    const response = await client.get(`feed/interactions/${roundRefId}`);
    return (response.data || []) as LikedUser[];
  } catch (error) {
    console.error(`Fetching Liked Users Error for ${roundRefId}:`, error);
    return [];
  }
};

/* -*-*-*-*- In Progress API -*-*-*-*- */

export interface InProgressApiItem {
  scorecardId: number;
  date: string;
  courseName: string;
  score: number | null;
  netScore: number | null;
  par: number;
  holesPlayed: number;
  isDQ: boolean;
  tournamentId: number | null;
}

export const getInProgressGames = async (playerId: number) => {
  try {
    const response = await client.get(`scorecard/history-inprogress/${playerId}`);
    return response.data as InProgressApiItem[];
  } catch (error) {
    console.error("Fetching InProgress Games Error:", error);
    throw error;
  }
};

/* -*-*-*-*- User API -*-*-*-*- */

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  mobileNumber: string;
  role: string;
  handicap: number;
  handicapIndex: number;
  homeCourse: string | null;
  isBlocked: boolean;
  totalRounds: number | null;
  profilePictureUrl: string | null;
  resolvedHomeCourse: string | null;
}

export const getUserProfile = async (userId: number) => {
  try {
    const response = await client.get(`User/${userId}`);
    return response.data as UserProfile;
  } catch (error) {
    console.error(`Fetching user profile ${userId} error:`, error);
    throw error;
  }
};

/* -*-*-*-*- Leaderboard API -*-*-*-*- */

export interface LeaderboardPlayer {
  id: number;
  username: string;
  handicap: number;
}

export const getLeaderboard = async () => {
  try {
    const response = await client.get(`user/leaderboard`);
    return response.data as LeaderboardPlayer[];
  } catch (error) {
    console.error("Fetching Leaderboard Error:", error);
    throw error;
  }
};

/* -*-*-*-*- Player Count API -*-*-*-*- */

export interface PlayerCount {
  totalPlayers: number;
}

export const getPlayerCount = async () => {
  try {
    const response = await client.get(`user/count`);
    return response.data as PlayerCount;
  } catch (error) {
    console.error("Fetching Player Count Error:", error);
    throw error;
  }
};

/* -*-*-*-*- Score Stats API -*-*-*-*- */

export interface ScoreStats {
  totalGames: number;
  averageScore: number;
  bestScore: number;
  coursesPlayed: number;
}

export const getScoreStats = async (playerId: number) => {
  try {
    const response = await client.get(`scorecard/stats/${playerId}`);
    return response.data as ScoreStats;
  } catch (error) {
    console.error(`Fetching Score Stats for player ${playerId} error:`, error);
    throw error;
  }
};

/* -*-*-*-*- Score History API -*-*-*-*- */

export interface ScoreHistoryItem {
  scorecardId: number;
  date: string;
  courseName: string;
  score: number | null;
  netScore: number | null;
  par: number;
  isDQ: boolean;
  isDisqualified: boolean;
  tournamentId: number | null;
}

export const getScoreHistory = async (playerId: number) => {
  try {
    const response = await client.get(`scorecard/history/${playerId}`);
    return response.data as ScoreHistoryItem[];
  } catch (error) {
    console.error(`Fetching Score History for player ${playerId} error:`, error);
    throw error;
  }
};

/* -*-*-*-*- Updates API -*-*-*-*- */

export interface UpdateItem {
  id: number;
  content: string | null;
  mediaUrl: string | null;
  type: "text" | "image";
  authorId: number;
  authorName: string;
  createdAt: string;
}

export const getUpdates = async () => {
  try {
    const response = await client.get(`Updates`);
    return response.data as UpdateItem[];
  } catch (error) {
    console.error("Fetching Updates Error:", error);
    throw error;
  }
};

export type ScorecardHole = {
  holeId: number;
  holeNumber: number;
  par: number;
  strokeIndex: number;
  yardage: number;
  teeBoxId: number;
  courseId: number;
  score: number | null;
  netScore: number | null;
  roundNumber: number;
  stablefordPoints: number | null;
  isCompleted: boolean;
  isDQ: boolean;
  tournamentId: number | null;
  isDoublePeoria: boolean;
  courseHalf: string;
  isExcluded: boolean;
  scoringType?: string;
  isTournament?: boolean;
  groupName?: string | null;
  userId?: number;
  handicap?: number;
  companionScoresJson?: string | null;
  CompanionScoresJson?: string | null;
  companionSandysJson?: string | null;
  CompanionSandysJson?: string | null;
  companionRsJson?: string | null;
  CompanionRsJson?: string | null;
  playingPartnersJson?: string | null;
  playingGroupRoundKey?: string | null;
  PlayingGroupRoundKey?: string | null;
  matchScoringType?: string | null;
  nassauStartingNine?: string | null;
  NassauStartingNine?: string | null;
};

export const getScorecardDetails = async (scorecardId: string | number): Promise<ScorecardHole[]> => {
  try {
    // console.log("scorecardid", scorecardId);
    const response = await client.get(`scorecard/details/${scorecardId}`);
    // console.log("ddddd", response.data);

    return response.data as ScorecardHole[];
  } catch (error) {
    console.error("Failed to fetch scorecard details:", error);
    throw error;
  }
};

export const deleteScorecardApi = async (scorecardId: string | number) => {
  try {
    const response = await client.delete(`/scorecard/${scorecardId}`);
    return response.data;
  } catch (error) {
    console.error("Delete Scorecard Error:", error);
    throw error;
  }
};


export const updateScorecardApi = async (scorecardId: string | number, holeScores: { holeId: number, score: number }[]) => {
  try {
    const response = await client.put(`/scorecard/update`, { scorecardId, holeScores });
    return response.data;
  } catch (error) {
    console.error("Updating scorecard error:", error);
    throw error;
  }
};

export const finishScorecardApi = async (scorecardId: string | number) => {
  try {
    const response = await client.post(`/scorecard/save`, { scorecardId });
    return response.data;
  } catch (error) {
    console.error("Finishing scorecard error:", error);
    throw error;
  }
};

import AsyncStorage from "@react-native-async-storage/async-storage";

export const updateHoleScoresApi = async (scorecardId: string | number, holes: any[]) => {
  try {
    const storedUserId = await AsyncStorage.getItem("userId");
    const userId = storedUserId ? Number(storedUserId) : null;

    const payload = holes.map(h => ({
      ...h,
      userId: userId || h.userId
    }));

    const response = await client.post(`/scorecard/save`, payload);
    // console.log("updateHoleScoresApi response:", response.status, response.data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Updating hole scores error (status):", error.response.status, "data:", error.response.data);
    } else {
      console.error("Updating hole scores error:", error.message);
    }
    throw error;
  }
};


export const postParadise = async (formData: any) => {
  try {
    const response = await client.post(`paradise`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Posting paradise error:", error);
    throw error;
  }
};

export const getPendingScorecardRequests = async (userId: number) => {
  try {
    const response = await client.get(`scorecard/group-round/pending/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Fetching pending scorecard requests error:", error);
    throw error;
  }
};

export const approveScorecardRequest = async (id: number) => {
  try {
    const response = await client.post(`scorecard/group-round/approve/${id}`, {});
    return response.data;
  } catch (error) {
    console.error("Approving scorecard request error:", error);
    throw error;
  }
};

export const rejectScorecardRequest = async (id: number) => {
  try {
    const response = await client.post(`scorecard/group-round/reject/${id}`, {});
    return response.data;
  } catch (error) {
    console.error("Rejecting scorecard request error:", error);
    throw error;
  }
};

export const initGroupRound = async (primaryUserId: number, targetUserIds: number[], roundContextId: string) => {
  try {
    const response = await client.post(`scorecard/group-round/init`, {
      primaryUserId,
      targetUserIds,
      roundContextId
    });
    return response.data;
  } catch (error) {
    console.error("Init group round error:", error);
    throw error;
  }
};

export const getDelegationStatuses = async (playingGroupRoundKey: string) => {
  try {
    const response = await client.get(`scorecard/group-round/status/${playingGroupRoundKey}`);
    // console.log("rrr", response.data);
    return response.data;
  } catch (error) {
    console.error("Fetching delegation statuses error:", error);
    throw error;
  }
};