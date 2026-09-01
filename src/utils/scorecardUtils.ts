/**
 * Consolidated Scorecard Utilities
 * 
 * Shared calculations, scoring engines, stroke indexing, partner parsers,
 * and data normalizers for the Unified Scorecard.
 */

import {
  calculateSplitSixPoints,
  getSplitSixSegmentTotal,
  computeSplitSixSummary,
  getPatialaXForHole,
  computeTotalPatialaX,
  computeHighLowHolePoints,
  computeHighLowSummary,
  determineNassauHoleWinner,
  simulateHouses,
  tallyHalfs,
  formatNassauHouses,
  formatNassauHousesSpaced,
  computeNassauState,
  getHoleXPoints as baseGetHoleXPoints,
  computePlayerTotalXPoints,
  computePlayerXPoints,
  PlayerHoleData,
  HoleResult,
  NassauState,
  SplitSixFullSummary,
  HighLowFullSummary,
} from "./scoringEngine";

// Re-export scoring engine functions
export {
  calculateSplitSixPoints,
  getSplitSixSegmentTotal,
  computeSplitSixSummary,
  getPatialaXForHole,
  computeTotalPatialaX,
  computeHighLowHolePoints,
  computeHighLowSummary,
  determineNassauHoleWinner,
  simulateHouses,
  tallyHalfs,
  formatNassauHouses,
  formatNassauHousesSpaced,
  computeNassauState,
  computePlayerTotalXPoints,
  computePlayerXPoints,
};

export type {
  PlayerHoleData,
  HoleResult,
  NassauState,
  SplitSixFullSummary,
  HighLowFullSummary,
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RoundPlayer {
  playerId: string; // e.g. "p1", "p2", or numeric string
  userId?: number | null;
  name: string;
  isPrimary?: boolean;
  isCurrentUser?: boolean;
  team?: 1 | 2;
  handicap?: number;
  courseHandicap?: number;
  appliedHandicap?: number;
  userHandicap?: number;
}

export interface ScoreLegendCounts {
  holeInOne: number;
  albatross: number;
  eagle: number;
  birdie: number;
  par: number;
  bogey: number;
  double: number;
  triple: number;
  quadPlus: number;
}

export interface PlayerHoleResult {
  score: number | null;
  netScore: number | null;
  stablefordPoints: number | null;
  sandy: boolean;
  r: boolean;
  strokesReceived: number;
}

// ─────────────────────────────────────────────
// Stroke and Net Score Calculations
// ─────────────────────────────────────────────

/**
 * Calculates strokes given on a hole based on player handicap and hole stroke index.
 * 
 * Formula:
 * Strokes = floor(|H| / 18) + (SI <= (|H| % 18) ? 1 : 0) * sgn(H)
 */
export function calculateStrokes(playerHandicap: number, strokeIndex: number): number {
  if (!playerHandicap || playerHandicap === 0 || !strokeIndex) return 0;
  const absoluteHandicap = Math.abs(playerHandicap);
  const base = Math.floor(absoluteHandicap / 18);
  const remainder = absoluteHandicap % 18;
  if (playerHandicap > 0) {
    return base + (strokeIndex <= remainder ? 1 : 0);
  }
  return -(base + (remainder > 0 && strokeIndex > 18 - remainder ? 1 : 0));
}

/**
 * Computes net score from gross score and strokes received.
 */
export function calculateNetScore(
  grossScore: number | null,
  strokesReceived: number,
  options?: { isDoublePeoria?: boolean; isGross?: boolean }
): number | null {
  if (grossScore === null || grossScore === undefined || grossScore < 0) return null;
  if (options?.isGross) return grossScore;
  if (options?.isDoublePeoria) return grossScore;
  return grossScore - strokesReceived;
}

/**
 * Computes stableford or System 36 points for a hole.
 */
export function calculateStablefordPoints(
  netScore: number | null,
  par: number,
  isSystem36?: boolean,
  rawScore?: number | null
): number | null {
  if (isSystem36) {
    if (rawScore === null || rawScore === undefined || rawScore <= 0) return null;
    if (rawScore <= par) return 2;
    if (rawScore === par + 1) return 1;
    return 0;
  }

  if (netScore === null || netScore === undefined) return null;
  const pts = par - netScore + 2;
  return Math.max(0, pts);
}

/**
 * Computes hole-level X-Points / Multiplier badge for a player.
 */
export function getHoleXPoints(
  score: number | null | undefined,
  par: number,
  isSandy: boolean,
  isRegulation?: boolean
): number {
  return baseGetHoleXPoints(score, par, isSandy, isRegulation);
}

// ─────────────────────────────────────────────
// Player Hole Info & Parser
// ─────────────────────────────────────────────

/**
 * Extracts and calculates hole score info for a given player/partner.
 */
export function getPlayerHoleInfo(
  hole: any,
  partner: RoundPlayer,
  primaryHandicap: number = 0,
  companionHandicaps: Record<string | number, number> = {},
  options?: { isExcluded?: boolean; isStableford?: boolean; isSystem36?: boolean; isGross?: boolean }
): PlayerHoleResult {
  const isPrimary = partner.isPrimary;
  const playerId = partner.playerId;
  const partnerUserId = partner.userId;

  let companionScores: Record<string, number | null> = {};
  if (hole.companionScoresJson || hole.CompanionScoresJson) {
    try {
      const raw = hole.companionScoresJson || hole.CompanionScoresJson;
      companionScores = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error("Error parsing companionScoresJson:", e);
    }
  }

  let companionSandys: Record<string, boolean> = {};
  if (hole.companionSandysJson || hole.CompanionSandysJson) {
    try {
      const raw = hole.companionSandysJson || hole.CompanionSandysJson;
      companionSandys = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error("Error parsing companionSandysJson:", e);
    }
  }

  let companionRs: Record<string, boolean> = {};
  if (hole.companionRsJson || hole.CompanionRsJson) {
    try {
      const raw = hole.companionRsJson || hole.CompanionRsJson;
      companionRs = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error("Error parsing companionRsJson:", e);
    }
  }

  let rawScore: number | null = null;
  if (isPrimary) {
    rawScore =
      hole.score !== null && hole.score !== "" && hole.score !== undefined
        ? Number(hole.score)
        : null;
    if (rawScore === null && companionScores[playerId] !== undefined && companionScores[playerId] !== null) {
      rawScore = Number(companionScores[playerId]);
    }
  } else {
    rawScore =
      companionScores[playerId] !== undefined && companionScores[playerId] !== null
        ? Number(companionScores[playerId])
        : null;
  }

  const sandy = companionSandys[playerId] === true;
  const r = companionRs[playerId] === true;

  if (rawScore === null) {
    return {
      score: null,
      netScore: null,
      stablefordPoints: null,
      sandy,
      r,
      strokesReceived: 0,
    };
  }

  const directHc =
    partner.appliedHandicap ??
    partner.courseHandicap ??
    partner.handicap ??
    partner.userHandicap;

  const playerHandicap = isPrimary
    ? primaryHandicap
    : directHc !== undefined && directHc !== null && String(directHc) !== ""
      ? Math.round(Number(directHc) || 0)
      : partnerUserId && companionHandicaps[partnerUserId] !== undefined
        ? companionHandicaps[partnerUserId]
        : playerId && companionHandicaps[playerId] !== undefined
          ? companionHandicaps[playerId]
          : 0;

  const strokeIndex = Number(
    hole.strokeIndex ?? hole.StrokeIndex ?? hole.handicap ?? hole.Handicap ?? 0
  );

  const isEx = options?.isExcluded && hole.par === 3;
  const strokesReceived = isEx ? 0 : calculateStrokes(playerHandicap, strokeIndex);
  const netScore = calculateNetScore(rawScore, strokesReceived, { isGross: options?.isGross });
  const isStablefordMode = Boolean(options?.isStableford || options?.isSystem36);
  const stablefordPoints =
    isStablefordMode && rawScore !== null
      ? calculateStablefordPoints(
        netScore,
        hole.par,
        options?.isSystem36,
        rawScore
      )
      : null;

  return {
    score: rawScore,
    netScore,
    stablefordPoints,
    sandy,
    r,
    strokesReceived,
  };
}

// ─────────────────────────────────────────────
// Normalizers and Parsers
// ─────────────────────────────────────────────

/**
 * Normalizes raw API hole object to a standard shape with unified property names.
 */
export function normalizeHoleFromApi(rawHole: any): any {
  if (!rawHole) return rawHole;

  const score =
    rawHole.score !== null && rawHole.score !== undefined && rawHole.score !== ""
      ? Number(rawHole.score)
      : null;

  const netScore =
    rawHole.netScore !== null && rawHole.netScore !== undefined && rawHole.netScore !== ""
      ? Number(rawHole.netScore)
      : null;

  const stablefordPoints =
    rawHole.stablefordPoints !== null && rawHole.stablefordPoints !== undefined && rawHole.stablefordPoints !== ""
      ? Number(rawHole.stablefordPoints)
      : rawHole.StablefordPoints !== undefined && rawHole.StablefordPoints !== null
        ? Number(rawHole.StablefordPoints)
        : null;

  return {
    ...rawHole,
    holeId: rawHole.holeId ?? rawHole.HoleId,
    holeNumber: rawHole.holeNumber ?? rawHole.HoleNumber,
    par: rawHole.par ?? rawHole.Par ?? 0,
    strokeIndex: rawHole.strokeIndex ?? rawHole.StrokeIndex ?? rawHole.handicap ?? rawHole.Handicap ?? 0,
    yardage: rawHole.yardage ?? rawHole.Yardage ?? 0,
    teeBoxId: rawHole.teeBoxId ?? rawHole.TeeBoxId,
    courseId: rawHole.courseId ?? rawHole.CourseId,
    roundNumber: rawHole.roundNumber ?? rawHole.RoundNumber ?? 1,
    isCompleted: rawHole.isCompleted ?? rawHole.IsCompleted ?? false,
    isDQ: rawHole.isDQ ?? rawHole.IsDQ ?? rawHole.isDisqualified ?? false,
    tournamentId: rawHole.tournamentId ?? rawHole.TournamentId ?? null,
    isDoublePeoria: Boolean(
      rawHole.isDoublePeoria ??
      rawHole.IsDoublePeoria ??
      rawHole.is_double_peoria ??
      false
    ),
    courseHalf: rawHole.courseHalf ?? rawHole.CourseHalf ?? null,
    isExcluded:
      rawHole.isExcluded === true ||
      rawHole.IsExcluded === true ||
      rawHole.is_excluded === true ||
      rawHole.isExcluded === "true",
    scoringType:
      rawHole.scoringType ??
      rawHole.ScoringType ??
      rawHole.tournamentScoringType ??
      rawHole.TournamentScoringType ??
      rawHole.scoring_type,
    tournamentScoringType:
      rawHole.tournamentScoringType ?? rawHole.TournamentScoringType ?? null,
    matchScoringType:
      rawHole.matchScoringType ??
      rawHole.MatchScoringType ??
      rawHole.match_scoring_type,
    nassauStartingNine: rawHole.nassauStartingNine ?? rawHole.NassauStartingNine ?? null,
    groupName: rawHole.groupName ?? rawHole.GroupName ?? null,
    playingGroupRoundKey: rawHole.playingGroupRoundKey ?? rawHole.PlayingGroupRoundKey ?? null,
    playingPartnersJson: rawHole.playingPartnersJson ?? rawHole.PlayingPartnersJson ?? null,
    companionScoresJson: rawHole.companionScoresJson ?? rawHole.CompanionScoresJson ?? null,
    companionSandysJson: rawHole.companionSandysJson ?? rawHole.CompanionSandysJson ?? null,
    companionRsJson: rawHole.companionRsJson ?? rawHole.CompanionRsJson ?? null,
    userName: rawHole.userName ?? rawHole.UserName ?? rawHole.username ?? rawHole.playerName ?? rawHole.PlayerName ?? rawHole.name,
    userId: rawHole.userId ?? rawHole.UserId,
    score,
    netScore,
    stablefordPoints,
  };
}

/**
 * Parses playingPartnersJson and normalizes the players array.
 */
export function parseRoundPlayers(
  partnersJson: any,
  currentViewerUserId?: number | null,
  fallbackOwnerName?: string
): RoundPlayer[] {
  let parsed: any[] = [];
  if (partnersJson) {
    try {
      parsed = typeof partnersJson === "string" ? JSON.parse(partnersJson) : partnersJson;
    } catch (e) {
      console.error("Error parsing playingPartnersJson:", e);
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    const isCurrentUser = Boolean(
      currentViewerUserId && (!fallbackOwnerName || fallbackOwnerName === "You")
    );
    return [
      {
        playerId: currentViewerUserId ? String(currentViewerUserId) : "p1",
        userId: currentViewerUserId ? Number(currentViewerUserId) : null,
        name: fallbackOwnerName || (isCurrentUser ? "You" : "Score"),
        isPrimary: true,
        isCurrentUser,
        team: 1,
      },
    ];
  }

  const normalized: RoundPlayer[] = parsed.map((p: any, index: number) => {
    const isCurrentUser = Boolean(
      p.userId && currentViewerUserId && Number(p.userId) === Number(currentViewerUserId)
    );

    let rawName = p.name || p.username || p.nickName || p.firstName || p.fullName;
    if (!rawName || rawName === "You") {
      if (isCurrentUser) {
        rawName = "You";
      } else {
        rawName =
          p.isPrimary && fallbackOwnerName && fallbackOwnerName !== "You"
            ? fallbackOwnerName
            : p.username || p.playerName || `Player ${index + 1}`;
      }
    }

    return {
      playerId: p.playerId ? String(p.playerId) : `p${index + 1}`,
      userId: p.userId ? Number(p.userId) : null,
      name: rawName,
      isPrimary: Boolean(p.isPrimary),
      isCurrentUser,
      team: (p.team === 2 ? 2 : 1) as 1 | 2,
      handicap: p.handicap,
      courseHandicap: p.courseHandicap,
      appliedHandicap: p.appliedHandicap,
      userHandicap: p.userHandicap,
    };
  });

  // Ensure at least one primary player
  if (!normalized.some((p) => p.isPrimary)) {
    if (currentViewerUserId) {
      const match = normalized.find((p) => Number(p.userId) === Number(currentViewerUserId));
      if (match) {
        match.isPrimary = true;
      } else {
        normalized[0].isPrimary = true;
      }
    } else {
      normalized[0].isPrimary = true;
    }
  }

  // Sort: Team 1 first, then Team 2
  return normalized.sort((a, b) => (a.team ?? 1) - (b.team ?? 1));
}

/**
 * Computes Front 9 / Back 9 splits, totals, and ordering according to startFrom or nassauStartingNine.
 */
export function computeDisplayHalves(
  holes: any[],
  courseHalf?: string | null,
  nassauStartingNine?: string | null
) {
  const isBackStart = nassauStartingNine === "back" || nassauStartingNine === "Back9";

  const allSorted = [...holes].sort((a, b) => {
    if (isBackStart) {
      const aVal = a.holeNumber >= 10 ? a.holeNumber - 10 : a.holeNumber + 8;
      const bVal = b.holeNumber >= 10 ? b.holeNumber - 10 : b.holeNumber + 8;
      return aVal - bVal;
    }
    return a.holeNumber - b.holeNumber;
  });

  const front9 = allSorted.filter((h) =>
    isBackStart ? h.holeNumber >= 10 : h.holeNumber <= 9
  );
  const back9 = allSorted.filter((h) =>
    isBackStart ? h.holeNumber <= 9 : h.holeNumber >= 10
  );

  let showFront9 = true;
  let showBack9 = true;

  if (courseHalf === "Front9" || courseHalf === "front9") {
    showFront9 = true;
    showBack9 = false;
  } else if (courseHalf === "Back9" || courseHalf === "back9") {
    showFront9 = false;
    showBack9 = true;
  }

  return {
    allSorted,
    front9,
    back9,
    showFront9,
    showBack9,
    isBackStart,
  };
}

// ─────────────────────────────────────────────
// Legend Counts
// ─────────────────────────────────────────────

/**
 * Tallies score legend counts (Hole-in-One, Albatross, Eagles, Birdies, Pars, Bogeys, Doubles, Triples, Quad+).
 */
export function getScoreLegendCounts(
  holes: any[],
  partners?: RoundPlayer[]
): ScoreLegendCounts {
  const counts: ScoreLegendCounts = {
    holeInOne: 0,
    albatross: 0,
    eagle: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    double: 0,
    triple: 0,
    quadPlus: 0,
  };

  const playersList = partners && partners.length > 0 ? partners : [{ isPrimary: true, playerId: "p1", name: "You" }];

  holes.forEach((hole) => {
    playersList.forEach((partner) => {
      let score: number | null = null;
      if (partner.isPrimary) {
        score = hole.score !== null && hole.score !== undefined && hole.score !== "" ? Number(hole.score) : null;
      } else if (hole.companionScoresJson || hole.CompanionScoresJson) {
        try {
          const raw = hole.companionScoresJson || hole.CompanionScoresJson;
          const map = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (map && map[partner.playerId] !== undefined && map[partner.playerId] !== null) {
            score = Number(map[partner.playerId]);
          }
        } catch (e) { }
      }

      if (score === null || score === undefined || score <= 0) return;

      if (score === 1) {
        counts.holeInOne++;
        return;
      }

      const diff = score - hole.par;

      if (diff <= -3) {
        counts.albatross++;
      } else if (diff === -2) {
        counts.eagle++;
      } else if (diff === -1) {
        counts.birdie++;
      } else if (diff === 0) {
        counts.par++;
      } else if (diff === 1) {
        counts.bogey++;
      } else if (diff === 2) {
        counts.double++;
      } else if (diff === 3) {
        counts.triple++;
      } else if (diff >= 4) {
        counts.quadPlus++;
      }
    });
  });

  return counts;
}
