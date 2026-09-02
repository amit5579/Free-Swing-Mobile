/**
 * Shared Scoring Engine
 * 
 * Contains all computation logic for:
 * - Split Six summary (segment totals, overall, X points, final score)
 * - High-Low summary (overall match pts, Patiala X, X points, final score)
 * - Nassau (Best & Combined) summary (houses system, halfs, hole-by-hole, final result)
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type PlayerHoleData = {
  score: number | null;
  netScore: number | null;
  par: number;
  sandy: boolean;
};

export type HoleResult = {
  holeNumber: number;
  winner: 'teamA' | 'teamB' | 'tie';
  teamAScore: number;
  teamBScore: number;
  housesDisplay: number[];
  overallHousesDisplay: number[];
};

export type NassauState = {
  front9Houses: number[];
  back9Houses: number[];
  overallHouses: number[];
  front9Halfs: { team1: number; team2: number };
  back9Halfs: { team1: number; team2: number };
  overallMatches: { team1: number; team2: number };
  finalResult: number; // positive = Team A wins, negative = Team B wins, 0 = tie
  holeResults: Record<number, HoleResult>;
};

// ─────────────────────────────────────────────
// Split Six
// ─────────────────────────────────────────────

/**
 * Distribute 6 points among 3 players for a single hole.
 * All tied → 0-0-0 per spec.
 */
export function calculateSplitSixPoints(
  s1: number | null,
  s2: number | null,
  s3: number | null,
): [number, number, number] {
  if (s1 === null || s2 === null || s3 === null) return [0, 0, 0];

  const scores = [s1, s2, s3];
  const uniqueScores = [...new Set(scores)];

  // All tied
  if (uniqueScores.length === 1) {
    return [0, 0, 0];
  }

  // All different
  if (uniqueScores.length === 3) {
    const sorted = [...scores].sort((a, b) => a - b);
    const low = sorted[0];
    const mid = sorted[1];
    const high = sorted[2];

    return scores.map((score) => {
      if (score === low) return 4;
      if (score === mid) return 2;
      return 0;
    }) as [number, number, number];
  }

  // One tie exists
  const sorted = [...uniqueScores].sort((a, b) => a - b);
  const low = sorted[0];
  const high = sorted[1];

  const lowCount = scores.filter((s) => s === low).length;

  // Two tied low
  if (lowCount === 2) {
    return scores.map((score) =>
      score === low ? 3 : 0
    ) as [number, number, number];
  }

  // Two tied high
  return scores.map((score) =>
    score === low ? 4 : 1
  ) as [number, number, number];
}

/**
 * Get segment total for a player across a range of holes.
 */
export function getSplitSixSegmentTotal(
  holesData: { p1Score: number | null; p2Score: number | null; p3Score: number | null }[],
  playerIndex: 0 | 1 | 2,
): number {
  let total = 0;
  holesData.forEach((h) => {
    const pts = calculateSplitSixPoints(h.p1Score, h.p2Score, h.p3Score);
    total += pts[playerIndex];
  });
  return total;
}

export type SplitSixFullSummary = {
  segment1_6: [number, number, number];
  segment7_12: [number, number, number];
  segment13_18: [number, number, number];
  overallMatchPts: [number, number, number];
  finalXPoints: [number, number, number];
  finalScore: [number, number, number];
  holeResults?: Record<number, [number, number, number]>;
};

/**
 * Compute the full Split Six summary.
 * 
 * @param allHolesData Array of { holeNumber, p1Score, p2Score, p3Score, p1Net, p2Net, p3Net, par, p1Sandy, p2Sandy, p3Sandy }
 */
export function computeSplitSixSummary(
  allHolesData: {
    holeNumber: number;
    p1Score: number | null;
    p2Score: number | null;
    p3Score: number | null;
    p1Net: number | null;
    p2Net: number | null;
    p3Net: number | null;
    par: number;
    p1Sandy: boolean;
    p2Sandy: boolean;
    p3Sandy: boolean;
  }[],
): SplitSixFullSummary {
  const seg1 = allHolesData.filter((h) => h.holeNumber >= 1 && h.holeNumber <= 6);
  const seg2 = allHolesData.filter((h) => h.holeNumber >= 7 && h.holeNumber <= 12);
  const seg3 = allHolesData.filter((h) => h.holeNumber >= 13 && h.holeNumber <= 18);

  const holeResults: Record<number, [number, number, number]> = {};
  allHolesData.forEach((h) => {
    if (h.p1Score !== null && h.p2Score !== null && h.p3Score !== null) {
      holeResults[h.holeNumber] = calculateSplitSixPoints(h.p1Score, h.p2Score, h.p3Score);
    }
  });

  const getSegTotals = (seg: typeof allHolesData): [number, number, number] => {
    let t = [0, 0, 0] as [number, number, number];
    seg.forEach((h) => {
      const pts = calculateSplitSixPoints(h.p1Score, h.p2Score, h.p3Score);
      t[0] += pts[0];
      t[1] += pts[1];
      t[2] += pts[2];
    });
    return t;
  };

  const segment1_6 = getSegTotals(seg1);
  const segment7_12 = getSegTotals(seg2);
  const segment13_18 = getSegTotals(seg3);

  const overallMatchPts: [number, number, number] = [
    segment1_6[0] + segment7_12[0] + segment13_18[0],
    segment1_6[1] + segment7_12[1] + segment13_18[1],
    segment1_6[2] + segment7_12[2] + segment13_18[2],
  ];

  // X Points per player
  const rawX = [
    computePlayerXPoints(allHolesData.map((h) => ({ score: h.p1Score, par: h.par, sandy: h.p1Sandy, regulation: (h as any).p1Regulation }))),
    computePlayerXPoints(allHolesData.map((h) => ({ score: h.p2Score, par: h.par, sandy: h.p2Sandy, regulation: (h as any).p2Regulation }))),
    computePlayerXPoints(allHolesData.map((h) => ({ score: h.p3Score, par: h.par, sandy: h.p3Sandy, regulation: (h as any).p3Regulation }))),
  ];
  const minX = Math.min(...rawX);
  const finalXPoints: [number, number, number] = [rawX[0] - minX, rawX[1] - minX, rawX[2] - minX];

  // Final Score (normalized overall match pts)
  const minPts = Math.min(...overallMatchPts);
  const finalScore: [number, number, number] = [
    overallMatchPts[0] - minPts,
    overallMatchPts[1] - minPts,
    overallMatchPts[2] - minPts,
  ];

  return {
    segment1_6,
    segment7_12,
    segment13_18,
    overallMatchPts,
    finalXPoints,
    finalScore,
    holeResults,
  };
}

// ─────────────────────────────────────────────
// X Points (shared across all modes)
// ─────────────────────────────────────────────

/**
 * Computes hole-level X-Points / Multiplier badge for a player
 */
export function getHoleXPoints(
  score: number | null | undefined,
  par: number,
  isSandy: boolean,
  isRegulation?: boolean
): number {
  if (score === null || score === undefined || score <= 0) return 0;
  const diff = score - par;
  let basePoints = 0;
  if (score === 1) {
    basePoints = 25; // Hole-in-One
  } else if (diff <= -3) {
    basePoints = 15; // Albatross
  } else if (diff === -2) {
    basePoints = 5;  // Eagle
  } else if (diff === -1) {
    basePoints = 2;  // Birdie
  }
  // Sandy bonus: +1 point ONLY if score is Par or better (diff <= 0 or hole-in-one)
  let sandyBonus = 0;
  if (isSandy && (score === 1 || diff <= 0)) {
    sandyBonus = 1;
  }
  // Regulation bonus: +1 point ONLY if score is Par or better (diff <= 0 or hole-in-one)
  let rBonus = 0;
  if (isRegulation && (score === 1 || diff <= 0)) {
    rBonus = 1;
  }
  return basePoints + sandyBonus + rBonus;
}

/**
 * Computes raw total X-Points for a player across all 18 holes
 */
export function computePlayerTotalXPoints(
  holes: { score: number | null; par: number; sandy: boolean; regulation?: boolean }[],
): number {
  return holes.reduce((total, h) => {
    return total + getHoleXPoints(h.score, h.par, h.sandy, h.regulation);
  }, 0);
}

/**
 * Compute raw X points for a single player across all holes (alias for computePlayerTotalXPoints).
 */
export const computePlayerXPoints = computePlayerTotalXPoints;

// ─────────────────────────────────────────────
// Patiala X
// ─────────────────────────────────────────────

/**
 * Compute Patiala X for a team on a single hole.
 * Both teammates score identically AND score ≤ par → +1
 */
export function getPatialaXForHole(
  score1: number | null,
  score2: number | null,
  par: number,
): number {
  if (score1 === null || score2 === null) return 0;
  if (score1 === score2 && score1 <= par) return 1;
  return 0;
}

/**
 * Compute total Patiala X for a team across all holes.
 */
export function computeTotalPatialaX(
  holesData: { score1: number | null; score2: number | null; par: number }[],
): number {
  let total = 0;
  holesData.forEach((h) => {
    total += getPatialaXForHole(h.score1, h.score2, h.par);
  });
  return total;
}

// ─────────────────────────────────────────────
// High-Low
// ─────────────────────────────────────────────

export type HighLowFullSummary = {
  front9MatchPts: { teamA: number; teamB: number };
  back9MatchPts: { teamA: number; teamB: number };
  overallMatchPts: { teamA: number; teamB: number };
  patialaX: { teamA: number; teamB: number };
  finalXPoints: { teamA: number; teamB: number };
  finalScore: { teamA: number; teamB: number };
  holeResults?: Record<number, { teamA: number; teamB: number }>;
};

/**
 * Compute High-Low points for a single hole.
 *
 * In High-Low match play (3 points per hole):
 * 1. Low ball (2 points):
 *    - Compare the lowest score of Team A with the lowest score of Team B.
 *    - If Team A has a lower (better) score than Team B, Team A receives 2 points.
 *    - If Team B has a lower (better) score than Team A, Team B receives 2 points.
 *    - If tied, neither team receives the 2 points (0 points).
 *
 * 2. High ball (1 point):
 *    - Compare the highest (second) score of Team A with the highest (second) score of Team B.
 *    - If Team A has a lower (better) score than Team B, Team A receives 1 point.
 *    - If Team B has a lower (better) score than Team A, Team B receives 1 point.
 *    - If tied, neither team receives the 1 point (0 points).
 */
export function computeHighLowHolePoints(
  teamAScores: [number | null, number | null] | (number | null)[],
  teamBScores: [number | null, number | null] | (number | null)[],
): { teamA: number; teamB: number } {
  let teamAPoints = 0;
  let teamBPoints = 0;

  const validA = teamAScores.filter((s): s is number => s !== null && s !== undefined);
  const validB = teamBScores.filter((s): s is number => s !== null && s !== undefined);

  if (validA.length === 0 || validB.length === 0) {
    return { teamA: 0, teamB: 0 };
  }

  // Low ball comparison (2 points)
  const teamALow = Math.min(...validA);
  const teamBLow = Math.min(...validB);

  if (teamALow < teamBLow) {
    teamAPoints += 2;
  } else if (teamBLow < teamALow) {
    teamBPoints += 2;
  }

  // High ball comparison (1 point)
  const teamAHigh = Math.max(...validA);
  const teamBHigh = Math.max(...validB);

  if (teamAHigh < teamBHigh) {
    teamAPoints += 1;
  } else if (teamBHigh < teamAHigh) {
    teamBPoints += 1;
  }

  return { teamA: teamAPoints, teamB: teamBPoints };
}

/**
 * Compute the full High-Low summary.
 */
export function computeHighLowSummary(
  allHolesData: {
    holeNumber: number;
    par: number;
    teamAScores: [number | null, number | null]; // net scores
    teamBScores: [number | null, number | null]; // net scores
    teamARawScores: [number | null, number | null]; // raw scores for X pts
    teamBRawScores: [number | null, number | null]; // raw scores for X pts
    teamASandys: [boolean, boolean];
    teamBSandys: [boolean, boolean];
    teamARs?: [boolean, boolean];
    teamBRs?: [boolean, boolean];
  }[],
): HighLowFullSummary {
  // Overall Match Pts
  let teamAMatchTotal = 0;
  let teamBMatchTotal = 0;
  let front9TeamA = 0;
  let front9TeamB = 0;
  let back9TeamA = 0;
  let back9TeamB = 0;
  const holeResults: Record<number, { teamA: number; teamB: number }> = {};

  allHolesData.forEach((h) => {
    const pts = computeHighLowHolePoints(
      h.teamAScores,
      h.teamBScores
    );

    holeResults[h.holeNumber] = pts;
    teamAMatchTotal += pts.teamA;
    teamBMatchTotal += pts.teamB;

    if (h.holeNumber <= 9) {
      front9TeamA += pts.teamA;
      front9TeamB += pts.teamB;
    } else {
      back9TeamA += pts.teamA;
      back9TeamB += pts.teamB;
    }
  });

  // Patiala X
  const patialaA = computeTotalPatialaX(
    allHolesData.map((h) => ({
      score1: h.teamARawScores[0],
      score2: h.teamARawScores[1],
      par: h.par,
    })),
  );
  const patialaB = computeTotalPatialaX(
    allHolesData.map((h) => ({
      score1: h.teamBRawScores[0],
      score2: h.teamBRawScores[1],
      par: h.par,
    })),
  );

  // Final X Points (individual X + Patiala, then normalized)
  const p1X = computePlayerXPoints(
    allHolesData.map((h) => ({
      score: h.teamARawScores[0],
      par: h.par,
      sandy: h.teamASandys[0],
      regulation: h.teamARs ? h.teamARs[0] : false,
    })),
  );
  const p2X = computePlayerXPoints(
    allHolesData.map((h) => ({
      score: h.teamARawScores[1],
      par: h.par,
      sandy: h.teamASandys[1],
      regulation: h.teamARs ? h.teamARs[1] : false,
    })),
  );
  const p3X = computePlayerXPoints(
    allHolesData.map((h) => ({
      score: h.teamBRawScores[0],
      par: h.par,
      sandy: h.teamBSandys[0],
      regulation: h.teamBRs ? h.teamBRs[0] : false,
    })),
  );
  const p4X = computePlayerXPoints(
    allHolesData.map((h) => ({
      score: h.teamBRawScores[1],
      par: h.par,
      sandy: h.teamBSandys[1],
      regulation: h.teamBRs ? h.teamBRs[1] : false,
    })),
  );

  const rawTeamAX = p1X + p2X + patialaA;
  const rawTeamBX = p3X + p4X + patialaB;
  const minTeamX = Math.min(rawTeamAX, rawTeamBX);

  // Final Score (normalized overall match pts)
  const minMatchPts = Math.min(teamAMatchTotal, teamBMatchTotal);

  return {
    front9MatchPts: { teamA: front9TeamA, teamB: front9TeamB },
    back9MatchPts: { teamA: back9TeamA, teamB: back9TeamB },
    overallMatchPts: { teamA: teamAMatchTotal, teamB: teamBMatchTotal },
    patialaX: { teamA: patialaA, teamB: patialaB },
    finalXPoints: { teamA: rawTeamAX - minTeamX, teamB: rawTeamBX - minTeamX },
    finalScore: { teamA: teamAMatchTotal - minMatchPts, teamB: teamBMatchTotal - minMatchPts },
    holeResults,
  };
}

// ─────────────────────────────────────────────
// Nassau Engine
// ─────────────────────────────────────────────

/**
 * Determine the winner for a single hole in Nassau mode.
 * 
 * @param mode 'best' or 'combined'
 * @param teamAScores [p1, p2] net scores (or raw for 2-player where each is solo)
 * @param teamBScores [p3, p4] net scores
 */
export function determineNassauHoleWinner(
  mode: 'best' | 'combined',
  teamAScores: (number | null)[],
  teamBScores: (number | null)[],
): 'teamA' | 'teamB' | 'tie' {
  const validA = teamAScores.filter((s): s is number => s !== null);
  const validB = teamBScores.filter((s): s is number => s !== null);

  if (validA.length === 0 || validB.length === 0) return 'tie';

  if (mode === 'best') {
    const minA = Math.min(...validA);
    const minB = Math.min(...validB);
    if (minA < minB) return 'teamA';
    if (minB < minA) return 'teamB';
    return 'tie';
  } else {
    // combined mode
    const sumA = validA.reduce((a, b) => a + b, 0);
    const sumB = validB.reduce((a, b) => a + b, 0);
    if (sumA < sumB) return 'teamA';
    if (sumB < sumA) return 'teamB';
    return 'tie';
  }
}

/**
 * Simulate houses (0.5 up/down) for a series of holes (Front 9, Back 9, or Overall 18).
 */
export function simulateHouses(holeWinners: ('teamA' | 'teamB' | 'tie')[]): {
  finalHouses: number[];
  holeSnapshots: number[][];
} {
  let houses: number[] = [0];
  const holeSnapshots: number[][] = [];

  for (const winner of holeWinners) {
    if (winner === 'teamA') {
      let lowestIndex = -1;
      let lowestVal = Infinity;
      houses.forEach((h, idx) => {
        if (h <= 0 && h < lowestVal) {
          lowestVal = h;
          lowestIndex = idx;
        }
      });
      if (lowestIndex !== -1 && houses[lowestIndex] < 0) {
        houses[lowestIndex] += 0.5;
      } else {
        houses.push(0.5);
      }
    } else if (winner === 'teamB') {
      let highestIndex = -1;
      let highestVal = -Infinity;
      houses.forEach((h, idx) => {
        if (h >= 0 && h > highestVal) {
          highestVal = h;
          highestIndex = idx;
        }
      });
      if (highestIndex !== -1 && houses[highestIndex] > 0) {
        houses[highestIndex] -= 0.5;
      } else {
        houses.push(-0.5);
      }
    }
    holeSnapshots.push([...houses]);
  }

  return { finalHouses: houses, holeSnapshots };
}

/**
 * Tally total 1s and 0.5s from final houses into total half points.
 */
export function tallyHalfs(houses: number[]): { team1: number; team2: number } {
  let team1 = 0;
  let team2 = 0;
  for (const h of houses) {
    if (h === 1) team1 += 2;
    else if (h === 0.5) team1 += 1;
    else if (h === -1) team2 += 2;
    else if (h === -0.5) team2 += 1;
  }
  return { team1, team2 };
}

/**
 * Format nassau houses for compact display (e.g. "+1, +0.5" or "-1, -0.5").
 */
export function formatNassauHouses(houses?: number[]): string {
  if (!houses || houses.length === 0) return '-';
  const nonZero = houses.filter((h) => h !== 0);
  if (nonZero.length === 0) return 'AS'; // All Square
  return nonZero
    .map((h) => (h > 0 ? `+${h}` : `${h}`))
    .join(', ');
}

/**
 * Format nassau houses with linebreaks/spaced out for scorecard table.
 */
export function formatNassauHousesSpaced(houses?: number[]): string[] {
  if (!houses || houses.length === 0) return ['-'];
  const nonZero = houses.filter((h) => h !== 0);
  if (nonZero.length === 0) return ['AS'];
  return nonZero.map((h) => (h > 0 ? `+${h}` : `${h}`));
}

/**
 * Compute the full Nassau state.
 */
export function computeNassauState(
  mode: 'best' | 'combined',
  allHolesData: {
    holeNumber: number;
    par: number;
    teamANetScores: (number | null)[];
    teamBNetScores: (number | null)[];
    teamARawScores: (number | null)[];
    teamBRawScores: (number | null)[];
    teamASandys: boolean[];
    teamBSandys: boolean[];
    teamARs?: boolean[];
    teamBRs?: boolean[];
  }[],
): NassauState & {
  patialaX: { teamA: number; teamB: number };
  finalXPoints: { teamA: number; teamB: number };
} {
  // Sort by hole number
  const sorted = [...allHolesData].sort((a, b) => a.holeNumber - b.holeNumber);

  // Determine winners for all holes
  const allWinners = sorted.map((h) =>
    determineNassauHoleWinner(mode, h.teamARawScores, h.teamBRawScores)
  );

  // Front 9 houses (holes 1-9)
  const front9Indices = sorted
    .map((h, i) => (h.holeNumber >= 1 && h.holeNumber <= 9 ? i : -1))
    .filter((i) => i !== -1);
  const front9Winners = front9Indices.map((i) => allWinners[i]);
  const front9Sim = simulateHouses(front9Winners);
  const front9Houses = front9Sim.finalHouses;
  const front9Halfs = tallyHalfs(front9Sim.finalHouses);

  // Back 9 houses (holes 10-18)
  const back9Indices = sorted
    .map((h, i) => (h.holeNumber >= 10 && h.holeNumber <= 18 ? i : -1))
    .filter((i) => i !== -1);
  const back9Winners = back9Indices.map((i) => allWinners[i]);
  const back9Sim = simulateHouses(back9Winners);
  const back9Houses = back9Sim.finalHouses;
  const back9Halfs = tallyHalfs(back9Sim.finalHouses);

  // Overall 18 houses (independent run 1-18)
  const overallSim = simulateHouses(allWinners);
  const overallHouses = overallSim.finalHouses;
  const overallMatches = tallyHalfs(overallSim.finalHouses);

  // Per-hole results snapshot
  const holeResults: Record<number, HoleResult> = {};
  sorted.forEach((h, i) => {
    const isBack = h.holeNumber >= 10;
    const housesDisplay = isBack
      ? back9Sim.holeSnapshots[i - 9] || []
      : front9Sim.holeSnapshots[i] || [];

    const teamAScore =
      h.teamARawScores.length > 0 ? (h.teamARawScores[0] ?? null) : null;
    const teamBScore =
      h.teamBRawScores.length > 0 ? (h.teamBRawScores[0] ?? null) : null;

    holeResults[h.holeNumber] = {
      holeNumber: h.holeNumber,
      winner: allWinners[i],
      teamAScore: teamAScore ?? 0,
      teamBScore: teamBScore ?? 0,
      housesDisplay,
      overallHousesDisplay: overallSim.holeSnapshots[i] || [],
    };
  });

  // Final Result
  const teamATotal = front9Halfs.team1 + back9Halfs.team1 + overallMatches.team1;
  const teamBTotal = front9Halfs.team2 + back9Halfs.team2 + overallMatches.team2;
  const finalResult = teamATotal - teamBTotal;

  // Patiala X
  const patialaA = computeTotalPatialaX(
    sorted.map((h) => ({
      score1: h.teamARawScores[0] ?? null,
      score2: h.teamARawScores.length > 1 ? (h.teamARawScores[1] ?? null) : null,
      par: h.par,
    })),
  );
  const patialaB = computeTotalPatialaX(
    sorted.map((h) => ({
      score1: h.teamBRawScores[0] ?? null,
      score2: h.teamBRawScores.length > 1 ? (h.teamBRawScores[1] ?? null) : null,
      par: h.par,
    })),
  );

  // Final X Points
  const teamAPlayerXPts = sorted[0]?.teamARawScores.map((_, pIdx) =>
    computePlayerXPoints(
      sorted.map((h) => ({
        score: h.teamARawScores[pIdx] ?? null,
        par: h.par,
        sandy: h.teamASandys[pIdx] ?? false,
        regulation: h.teamARs?.[pIdx] ?? false,
      })),
    ),
  ) || [];
  const teamBPlayerXPts = sorted[0]?.teamBRawScores.map((_, pIdx) =>
    computePlayerXPoints(
      sorted.map((h) => ({
        score: h.teamBRawScores[pIdx] ?? null,
        par: h.par,
        sandy: h.teamBSandys[pIdx] ?? false,
        regulation: h.teamBRs?.[pIdx] ?? false,
      })),
    ),
  ) || [];

  const rawTeamAX = teamAPlayerXPts.reduce((s, v) => s + v, 0) + patialaA;
  const rawTeamBX = teamBPlayerXPts.reduce((s, v) => s + v, 0) + patialaB;
  const minX = Math.min(rawTeamAX, rawTeamBX);

  return {
    front9Houses,
    back9Houses,
    overallHouses,
    front9Halfs,
    back9Halfs,
    overallMatches,
    finalResult,
    holeResults,
    patialaX: { teamA: patialaA, teamB: patialaB },
    finalXPoints: { teamA: rawTeamAX - minX, teamB: rawTeamBX - minX },
  };
}
