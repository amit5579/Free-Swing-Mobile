import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  RoundPlayer,
  SplitSixFullSummary,
  HighLowFullSummary,
  NassauState,
} from "@/utils/scorecardUtils";
import { NassauHouses } from "./NassauHouses";

export interface ScoringTabContentProps {
  mode: "split-six" | "high-low" | "nassau-best" | "nassau-combined";
  players: RoundPlayer[];
  splitSixSummary?: SplitSixFullSummary;
  highLowSummary?: HighLowFullSummary;
  nassauState?: NassauState & {
    patialaX?: { teamA: number; teamB: number };
    finalXPoints?: { teamA: number; teamB: number };
  };
  isDark?: boolean;
}

export const ScoringTabContent: React.FC<ScoringTabContentProps> = ({
  mode,
  players,
  splitSixSummary,
  highLowSummary,
  nassauState,
  isDark = false,
}) => {
  const cardBg = isDark ? "#18181b" : "#ffffff";
  const borderColor = isDark ? "#27272a" : "#e4e4e7";
  const subHeaderBg = isDark ? "#27272a" : "#f4f4f5";
  const textPrimary = isDark ? "#fafafa" : "#09090b";
  const textSecondary = isDark ? "#a1a1aa" : "#71717a";

  if (mode === "split-six" && splitSixSummary) {
    const p1 = players[0]?.name || "Player 1";
    const p2 = players[1]?.name || "Player 2";
    const p3 = players[2]?.name || "Player 3";

    const rows = [
      { label: "Segment 1 (Holes 1-6)", vals: splitSixSummary.segment1_6 },
      { label: "Segment 2 (Holes 7-12)", vals: splitSixSummary.segment7_12 },
      { label: "Segment 3 (Holes 13-18)", vals: splitSixSummary.segment13_18 },
      { label: "Overall Match Points", vals: splitSixSummary.overallMatchPts, isBold: true },
      { label: "Final X Points", vals: splitSixSummary.finalXPoints },
      { label: "Final Score", vals: splitSixSummary.finalScore, isHighlight: true },
    ];

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.title, { color: textPrimary }]}>Split Six Match Summary</Text>

        <View style={[styles.tableHeader, { backgroundColor: subHeaderBg }]}>
          <Text style={[styles.colHeader, { flex: 2, color: textSecondary }]}>Category</Text>
          <Text style={[styles.colHeader, { flex: 1, color: textSecondary }]}>{p1}</Text>
          <Text style={[styles.colHeader, { flex: 1, color: textSecondary }]}>{p2}</Text>
          <Text style={[styles.colHeader, { flex: 1, color: textSecondary }]}>{p3}</Text>
        </View>

        {rows.map((r, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              { borderBottomColor: borderColor },
              r.isHighlight && { backgroundColor: isDark ? "#14532d33" : "#dcfce766" },
            ]}
          >
            <Text
              style={[
                styles.rowLabel,
                { flex: 2, color: r.isHighlight ? (isDark ? "#4ade80" : "#16a34a") : textPrimary },
                r.isBold && styles.bold,
              ]}
            >
              {r.label}
            </Text>
            <Text style={[styles.cellValue, { flex: 1, color: textPrimary }, (r.isBold || r.isHighlight) && styles.bold]}>
              {r.vals[0]}
            </Text>
            <Text style={[styles.cellValue, { flex: 1, color: textPrimary }, (r.isBold || r.isHighlight) && styles.bold]}>
              {r.vals[1]}
            </Text>
            <Text style={[styles.cellValue, { flex: 1, color: textPrimary }, (r.isBold || r.isHighlight) && styles.bold]}>
              {r.vals[2]}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (mode === "high-low" && highLowSummary) {
    const team1Players = players.filter((p) => (p.team ?? 1) === 1).map((p) => p.isPrimary ? "You" : p.name).join(" & ") || "Team 1";
    const team2Players = players.filter((p) => p.team === 2).map((p) => p.isPrimary ? "You" : p.name).join(" & ") || "Team 2";

    const rows = [
      { label: "Front 9 Match Points", teamA: highLowSummary.front9MatchPts.teamA, teamB: highLowSummary.front9MatchPts.teamB },
      { label: "Back 9 Match Points", teamA: highLowSummary.back9MatchPts.teamA, teamB: highLowSummary.back9MatchPts.teamB },
      { label: "Overall Match Points", teamA: highLowSummary.overallMatchPts.teamA, teamB: highLowSummary.overallMatchPts.teamB, isBold: true },
      { label: "Patiala X", teamA: highLowSummary.patialaX.teamA, teamB: highLowSummary.patialaX.teamB },
      { label: "Final X Points", teamA: highLowSummary.finalXPoints.teamA, teamB: highLowSummary.finalXPoints.teamB },
      { label: "Final Score", teamA: highLowSummary.finalScore.teamA, teamB: highLowSummary.finalScore.teamB, isHighlight: true },
    ];

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.title, { color: textPrimary }]}>High - Low Match Summary</Text>

        <View style={[styles.tableHeader, { backgroundColor: subHeaderBg }]}>
          <Text style={[styles.colHeader, { flex: 2, color: textSecondary }]}>Category</Text>
          <Text style={[styles.colHeader, { flex: 1.2, color: isDark ? "#4ade80" : "#16a34a" }]}>{team1Players}</Text>
          <Text style={[styles.colHeader, { flex: 1.2, color: isDark ? "#60a5fa" : "#2563eb" }]}>{team2Players}</Text>
        </View>

        {rows.map((r, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              { borderBottomColor: borderColor },
              r.isHighlight && { backgroundColor: isDark ? "#14532d33" : "#dcfce766" },
            ]}
          >
            <Text
              style={[
                styles.rowLabel,
                { flex: 2, color: r.isHighlight ? (isDark ? "#4ade80" : "#16a34a") : textPrimary },
                r.isBold && styles.bold,
              ]}
            >
              {r.label}
            </Text>
            <Text style={[styles.cellValue, { flex: 1.2, color: textPrimary }, (r.isBold || r.isHighlight) && styles.bold]}>
              {r.teamA}
            </Text>
            <Text style={[styles.cellValue, { flex: 1.2, color: textPrimary }, (r.isBold || r.isHighlight) && styles.bold]}>
              {r.teamB}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if ((mode === "nassau-best" || mode === "nassau-combined") && nassauState) {
    const team1Players = players.filter((p) => (p.team ?? 1) === 1).map((p) => p.isPrimary ? "You" : p.name).join(" & ") || "Team 1";
    const team2Players = players.filter((p) => p.team === 2).map((p) => p.isPrimary ? "You" : p.name).join(" & ") || "Team 2";

    const getWinnerLabel = () => {
      if (nassauState.finalResult > 0) return `${team1Players} Wins (+${nassauState.finalResult})`;
      if (nassauState.finalResult < 0) return `${team2Players} Wins (+${Math.abs(nassauState.finalResult)})`;
      return "All Square (Tie)";
    };

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.title, { color: textPrimary }]}>
          {mode === "nassau-best" ? "Nassau (Best Score)" : "Nassau (Combined Score)"} Summary
        </Text>

        <View style={[styles.resultBanner, { backgroundColor: isDark ? "#14532d44" : "#dcfce7" }]}>
          <Text style={[styles.resultBannerText, { color: isDark ? "#4ade80" : "#15803d" }]}>
            Final Result: {getWinnerLabel()}
          </Text>
        </View>

        {/* Front 9 Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Front 9 Match</Text>
          <View style={styles.houseRow}>
            <Text style={[styles.houseLabel, { color: textSecondary }]}>Houses:</Text>
            <NassauHouses houses={nassauState.front9Houses} isDark={isDark} fontSize={14} />
          </View>
          <Text style={[styles.scoreText, { color: textPrimary }]}>
            Halves: <Text style={{ color: isDark ? "#4ade80" : "#16a34a", fontWeight: "bold" }}>{team1Players}: {nassauState.front9Halfs.team1}</Text> | <Text style={{ color: isDark ? "#60a5fa" : "#2563eb", fontWeight: "bold" }}>{team2Players}: {nassauState.front9Halfs.team2}</Text>
          </Text>
        </View>

        {/* Back 9 Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Back 9 Match</Text>
          <View style={styles.houseRow}>
            <Text style={[styles.houseLabel, { color: textSecondary }]}>Houses:</Text>
            <NassauHouses houses={nassauState.back9Houses} isDark={isDark} fontSize={14} />
          </View>
          <Text style={[styles.scoreText, { color: textPrimary }]}>
            Halves: <Text style={{ color: isDark ? "#4ade80" : "#16a34a", fontWeight: "bold" }}>{team1Players}: {nassauState.back9Halfs.team1}</Text> | <Text style={{ color: isDark ? "#60a5fa" : "#2563eb", fontWeight: "bold" }}>{team2Players}: {nassauState.back9Halfs.team2}</Text>
          </Text>
        </View>

        {/* 18-Hole Match Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>18-Hole Match</Text>
          <View style={styles.houseRow}>
            <Text style={[styles.houseLabel, { color: textSecondary }]}>Houses:</Text>
            <NassauHouses houses={nassauState.overallHouses} isDark={isDark} fontSize={14} />
          </View>
          <Text style={[styles.scoreText, { color: textPrimary }]}>
            Matches: <Text style={{ color: isDark ? "#4ade80" : "#16a34a", fontWeight: "bold" }}>{team1Players}: {nassauState.overallMatches.team1}</Text> | <Text style={{ color: isDark ? "#60a5fa" : "#2563eb", fontWeight: "bold" }}>{team2Players}: {nassauState.overallMatches.team2}</Text>
          </Text>
        </View>

        {/* Patiala X & X Points */}
        {nassauState.patialaX && (
          <View style={[styles.sectionBlock, { borderBottomWidth: 0 }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Bonus Points</Text>
            <Text style={[styles.scoreText, { color: textPrimary }]}>
              Patiala X: {team1Players}: {nassauState.patialaX.teamA} | {team2Players}: {nassauState.patialaX.teamB}
            </Text>
            {nassauState.finalXPoints && (
              <Text style={[styles.scoreText, { color: textPrimary, marginTop: 4 }]}>
                Final X Points: {team1Players}: {nassauState.finalXPoints.teamA} | {team2Players}: {nassauState.finalXPoints.teamB}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  colHeader: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  cellValue: {
    fontSize: 13,
    textAlign: "center",
  },
  bold: {
    fontWeight: "700",
  },
  resultBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: "center",
  },
  resultBannerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#33333822",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  houseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  houseLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
