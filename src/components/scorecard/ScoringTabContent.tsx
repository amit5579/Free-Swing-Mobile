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
  const cardBg = isDark
    ? "rgba(24, 24, 27, 0.35)"
    : "rgba(255, 255, 255, 0.35)";
  const borderColor = isDark ? "#27272a" : "#e4e4e7";
  const subHeaderBg = isDark
    ? "rgba(39, 39, 42, 0.45)"
    : "rgba(244, 244, 245, 0.45)";
  const textPrimary = isDark ? "#fafafa" : "#09090b";
  const textSecondary = isDark ? "#a1a1aa" : "#71717a";

  if (mode === "split-six" && splitSixSummary) {
    const p1 = players[0]?.name || "Player 1";
    const p2 = players[1]?.name || "Player 2";
    const p3 = players[2]?.name || "Player 3";

    const rows = [
      { label: "1-6", vals: splitSixSummary.segment1_6 },
      { label: "7-12", vals: splitSixSummary.segment7_12 },
      { label: "13-18", vals: splitSixSummary.segment13_18 },
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
    const team1Players = players.filter((p) => (p.team ?? 1) === 1).map((p) => p.name).join(" & ") || "Team 1";
    const team2Players = players.filter((p) => p.team === 2).map((p) => p.name).join(" & ") || "Team 2";

    const rows = [
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
    const team1Players = players.filter((p) => (p.team ?? 1) === 1).map((p) => p.name).join(" / ") || "Team 1";
    const team2Players = players.filter((p) => p.team === 2).map((p) => p.name).join(" / ") || "Team 2";

    const rows = [
      {
        label: "Front 9 Halfs",
        teamA: String(nassauState.front9Halfs?.team1 || 0),
        teamB: String(nassauState.front9Halfs?.team2 || 0),
      },
      {
        label: "Back 9 Halfs",
        teamA: String(nassauState.back9Halfs?.team1 || 0),
        teamB: String(nassauState.back9Halfs?.team2 || 0),
      },
      {
        label: "Overall Matches",
        teamA: String(nassauState.overallMatches?.team1 || 0),
        teamB: String(nassauState.overallMatches?.team2 || 0),
        isBold: true,
        isSuccess: true,
      },
      {
        label: "Patiala X",
        teamA: `${nassauState.patialaX?.teamA || 0}x`,
        teamB: `${nassauState.patialaX?.teamB || 0}x`,
        isBold: true,
        isYellow: true,
      },
      {
        label: "Final X Points",
        teamA: `${nassauState.finalXPoints?.teamA || 0}x`,
        teamB: `${nassauState.finalXPoints?.teamB || 0}x`,
        isBold: true,
        isWarning: true,
      },
      {
        label: "Final Result",
        teamA: `Match - ${nassauState.overallMatches?.team1 || 0}\nHalf - ${(nassauState.front9Halfs?.team1 || 0) + (nassauState.back9Halfs?.team1 || 0)}`,
        teamB: `Match - ${nassauState.overallMatches?.team2 || 0}\nHalf - ${(nassauState.front9Halfs?.team2 || 0) + (nassauState.back9Halfs?.team2 || 0)}`,
        isBold: true,
        isInfo: true,
      },
    ];

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.title, { color: textPrimary }]}>
          Nassau Summary ({mode === "nassau-best" ? "Best Ball" : "Combined"})
        </Text>

        <View style={[styles.tableHeader, { backgroundColor: subHeaderBg }]}>
          <Text style={[styles.colHeader, { flex: 1.5, color: textSecondary, textAlign: "left", paddingLeft: 4 }]}>
            MATCH
          </Text>
          <Text style={[styles.colHeader, { flex: 2, color: isDark ? "#4ade80" : "#16a34a" }]}>
            TEAM A{"\n"}({team1Players.toUpperCase()})
          </Text>
          <Text style={[styles.colHeader, { flex: 2, color: isDark ? "#60a5fa" : "#2563eb" }]}>
            TEAM B{"\n"}({team2Players.toUpperCase()})
          </Text>
        </View>

        {rows.map((r, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              { borderBottomColor: borderColor },
              r.isSuccess && { backgroundColor: isDark ? "#14532d33" : "#dcfce766" },
              r.isYellow && { backgroundColor: isDark ? "#713f1222" : "#fef9c388" },
              r.isWarning && { backgroundColor: isDark ? "#854d0e33" : "#fef3c788" },
              r.isInfo && { backgroundColor: isDark ? "#1e3a8a33" : "#e0f2fe88" },
            ]}
          >
            <Text
              style={[
                styles.rowLabel,
                { flex: 1.5, color: textPrimary, paddingLeft: 4 },
                r.isBold && styles.bold,
              ]}
            >
              {r.label}
            </Text>
            <Text
              style={[
                styles.cellValue,
                { flex: 2, color: textPrimary },
                r.isBold && styles.bold,
              ]}
            >
              {r.teamA}
            </Text>
            <Text
              style={[
                styles.cellValue,
                { flex: 2, color: textPrimary },
                r.isBold && styles.bold,
              ]}
            >
              {r.teamB}
            </Text>
          </View>
        ))}
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
