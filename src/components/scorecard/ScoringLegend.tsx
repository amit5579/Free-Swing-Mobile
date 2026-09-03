import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ScoreLegendCounts } from "@/utils/scorecardUtils";

export interface ScoringLegendProps {
  counts: ScoreLegendCounts;
  isDark?: boolean;
}

export const ScoringLegend: React.FC<ScoringLegendProps> = ({
  counts,
  isDark = false,
}) => {
  const countColor = isDark ? "#ffffff" : "#0f172a";

  const items = [
    {
      label: "Hole-in-One",
      count: counts.holeInOne,
      icon: (
        <View style={[styles.squareContainer, styles.doubleSquareOuter, { borderColor: "#ffd700" }]}>
          <View style={[styles.doubleSquareInner, { borderColor: "#ffd700" }]}>
            <Text style={[styles.countInside, { color: countColor }]}>
              {counts.holeInOne}
            </Text>
          </View>
        </View>
      ),
    },
    {
      label: "Albatross",
      count: counts.albatross,
      icon: (
        <View style={[styles.squareContainer, styles.doubleSquareOuter, { borderColor: "#006064" }]}>
          <View style={[styles.doubleSquareInner, { borderColor: "#006064" }]}>
            <Text style={[styles.countInside, { color: countColor }]}>
              {counts.albatross}
            </Text>
          </View>
        </View>
      ),
    },
    {
      label: "Eagle",
      count: counts.eagle,
      icon: (
        <View style={[styles.squareContainer, styles.doubleSquareOuter, { borderColor: "#2e7d32" }]}>
          <View style={[styles.doubleSquareInner, { borderColor: "#2e7d32" }]}>
            <Text style={[styles.countInside, { color: countColor }]}>
              {counts.eagle}
            </Text>
          </View>
        </View>
      ),
    },
    {
      label: "Birdie",
      count: counts.birdie,
      icon: (
        <View style={[styles.squareContainer, styles.singleSquare, { borderColor: "#2e7d32" }]}>
          <Text style={[styles.countInside, { color: countColor }]}>
            {counts.birdie}
          </Text>
        </View>
      ),
    },
    {
      label: "Par",
      count: counts.par,
      icon: (
        <View
          style={[
            styles.squareContainer,
            styles.dashedSquare,
            { borderColor: isDark ? "#71717a" : "#9ca3af" },
          ]}
        >
          <Text style={[styles.countInside, { color: countColor }]}>
            {counts.par}
          </Text>
        </View>
      ),
    },
    {
      label: "Bogey",
      count: counts.bogey,
      icon: (
        <View style={[styles.squareContainer, styles.singleSquare, { borderColor: "#d32f2f" }]}>
          <Text style={[styles.countInside, { color: countColor }]}>
            {counts.bogey}
          </Text>
        </View>
      ),
    },
    {
      label: "Double Bogey",
      count: counts.double,
      icon: (
        <View style={[styles.squareContainer, styles.doubleSquareOuter, { borderColor: "#d32f2f" }]}>
          <View style={[styles.doubleSquareInner, { borderColor: "#d32f2f" }]}>
            <Text style={[styles.countInside, { color: countColor }]}>
              {counts.double}
            </Text>
          </View>
        </View>
      ),
    },
    {
      label: "Triple Bogey",
      count: counts.triple,
      icon: (
        <View style={[styles.squareContainer, styles.tripleSquareOuter, { borderColor: "#6a1b9a" }]}>
          <View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a" }]}>
            <View style={[styles.tripleSquareInner, { borderColor: "#6a1b9a" }]}>
              <Text style={[styles.countInsideSmall, { color: countColor }]}>
                {counts.triple}
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      label: "Quadruple Bogey+",
      count: counts.quadPlus,
      icon: (
        <View
          style={[
            styles.squareContainer,
            styles.thickSquare,
            { borderColor: isDark ? "#ffffff" : "#111827" },
          ]}
        >
          <Text style={[styles.countInside, { color: countColor }]}>
            {counts.quadPlus}
          </Text>
        </View>
      ),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(31, 31, 35, 0.45)"
            : "rgba(248, 250, 252, 0.55)",
          borderColor: isDark ? "#333338" : "#e2e8f0",
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDark ? "#9ca3af" : "#64748b" },
        ]}
      >
        SCORECARD LEGEND
      </Text>

      <View style={styles.verticalGrid}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.legendRow}>
            {item.icon}
            <Text
              style={[
                styles.itemLabel,
                { color: isDark ? "#f3f4f6" : "#334155" },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  verticalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  legendRow: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  squareContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  countInside: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  countInsideSmall: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  itemLabel: {
    fontSize: 13.5,
    fontWeight: "600",
    flex: 1,
  },
  singleSquare: {
    borderWidth: 2,
    borderRadius: 4,
  },
  dashedSquare: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 4,
  },
  doubleSquareOuter: {
    borderWidth: 1.5,
    borderRadius: 5,
    padding: 1.5,
  },
  doubleSquareInner: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  tripleSquareOuter: {
    borderWidth: 1.2,
    borderRadius: 5,
    padding: 1,
  },
  tripleSquareMid: {
    width: 26,
    height: 26,
    borderWidth: 1.2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    padding: 1,
  },
  tripleSquareInner: {
    width: 20,
    height: 20,
    borderWidth: 1.2,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  thickSquare: {
    borderWidth: 2.8,
    borderRadius: 4,
  },
});
