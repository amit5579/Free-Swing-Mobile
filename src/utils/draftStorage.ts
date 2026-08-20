import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ScorecardHole {
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
  userId?: number;
  handicap?: number;
  companionScoresJson?: string | null;
  companionSandysJson?: string | null;
  playingPartnersJson?: string | null;
  playingGroupRoundKey?: string | null;
  PlayingGroupRoundKey?: string | null;
  matchScoringType?: string | null;
  nassauStartingNine?: string | null;
  NassauStartingNine?: string | null;
  groupName?: string | null;
}

export interface ScorecardDraft {
  scorecardId: string | number;
  userId: number;
  courseName: string;
  date: string;
  holesPlayed: number;
  score: number | null;
  netScore: number | null;
  par: number;
  courseHalf: string;
  updatedAt: string;
  holes: ScorecardHole[];
  textScores: Record<number, string>;
}

const STORAGE_KEY = "@scorecard_local_drafts_v1";

/**
 * Retrieves all stored drafts from AsyncStorage.
 */
export const getAllDrafts = async (): Promise<ScorecardDraft[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as ScorecardDraft[];
  } catch (error) {
    console.error("Failed to load drafts:", error);
    return [];
  }
};

/**
 * Saves or updates a draft in the central drafts array.
 */
export const saveDraft = async (
  draftData: Omit<ScorecardDraft, "updatedAt"> & { updatedAt?: string }
): Promise<void> => {
  try {
    const drafts = await getAllDrafts();
    const now = new Date().toISOString();
    const newDraft: ScorecardDraft = {
      ...draftData,
      updatedAt: draftData.updatedAt || now,
    };

    const index = drafts.findIndex(
      (d) => String(d.scorecardId) === String(newDraft.scorecardId)
    );

    if (index >= 0) {
      drafts[index] = newDraft;
    } else {
      drafts.push(newDraft);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
};

/**
 * Retrieves a specific draft by scorecardId.
 */
export const getDraft = async (
  scorecardId: string | number
): Promise<ScorecardDraft | null> => {
  try {
    const drafts = await getAllDrafts();
    const found = drafts.find(
      (d) => String(d.scorecardId) === String(scorecardId)
    );
    return found || null;
  } catch (error) {
    console.error("Failed to get draft:", error);
    return null;
  }
};

/**
 * Deletes a draft from the central drafts array.
 */
export const deleteDraft = async (
  scorecardId: string | number
): Promise<void> => {
  try {
    const drafts = await getAllDrafts();
    const filtered = drafts.filter(
      (d) => String(d.scorecardId) !== String(scorecardId)
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete draft:", error);
  }
};

/**
 * Filter drafts for the current user.
 */
export const getUserDrafts = async (
  userId: number
): Promise<ScorecardDraft[]> => {
  const drafts = await getAllDrafts();
  return drafts.filter((d) => Number(d.userId) === Number(userId));
};

/**
 * Apply draft display overrides to an API round.
 */
export const applyDraftToRound = (apiRound: any, draft: ScorecardDraft) => {
  return {
    ...apiRound,
    score: draft.score,
    netScore: draft.netScore,
    par: draft.par,
    holesPlayed: draft.holesPlayed,
    courseHalf: draft.courseHalf,
    updatedAt: draft.updatedAt,
    hasLocalDraft: true,
  };
};

/**
 * Maps a local-only draft to a history item format for list display.
 */
export const mapDraftToHistoryItem = (draft: ScorecardDraft) => {
  return {
    scorecardId: draft.scorecardId,
    courseName: draft.courseName,
    score: draft.score,
    netScore: draft.netScore,
    par: draft.par,
    holesPlayed: draft.holesPlayed,
    updatedAt: draft.updatedAt,
    date: draft.date || draft.updatedAt,
    hasLocalDraft: true,
    isLocalDraftOnly: true,
    isDQ: false,
  };
};

/**
 * Merges API round objects with local drafts list.
 */
export const mergeInProgressRoundsWithDrafts = (
  apiRounds: any[],
  drafts: ScorecardDraft[]
): any[] => {
  const draftMap = new Map<string, ScorecardDraft>();
  drafts.forEach((d) => {
    draftMap.set(String(d.scorecardId), d);
  });

  const mergedApiRounds = apiRounds.map((apiRound) => {
    const key = String(apiRound.scorecardId);
    const draft = draftMap.get(key);
    if (draft) {
      draftMap.delete(key);
      return applyDraftToRound(apiRound, draft);
    }
    return apiRound;
  });

  const localOnlyDraftRounds = Array.from(draftMap.values()).map(
    mapDraftToHistoryItem
  );

  const combined = [...mergedApiRounds, ...localOnlyDraftRounds];

  return combined.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.date || 0).getTime();
    const timeB = new Date(b.updatedAt || b.date || 0).getTime();
    return timeB - timeA;
  });
};

/**
 * Scenario C: Determine the source of truth between a local draft and server response.
 */
export const getLatestRoundState = (
  localDraft: ScorecardDraft | null,
  serverHoles: ScorecardHole[],
  serverUpdatedAt?: string
): {
  data: ScorecardHole[];
  source: "server" | "draft";
  textScores?: Record<number, string>;
} => {
  if (!localDraft) {
    return { data: serverHoles, source: "server" };
  }

  const serverHolesPlayed = serverHoles.filter(
    (h) => h.score !== null && h.score > 0
  ).length;

  const draftHolesPlayed = localDraft.holesPlayed;

  const draftTime = new Date(localDraft.updatedAt).getTime();
  const serverTime = serverUpdatedAt ? new Date(serverUpdatedAt).getTime() : 0;

  // Local draft is newer if its timestamp is newer OR it has more holes played
  const localIsNewer =
    draftTime > serverTime || draftHolesPlayed > serverHolesPlayed;

  if (localIsNewer) {
    return {
      data: localDraft.holes,
      source: "draft",
      textScores: localDraft.textScores,
    };
  } else {
    return {
      data: serverHoles,
      source: "server",
    };
  }
};
