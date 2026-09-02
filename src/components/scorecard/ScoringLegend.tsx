import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { ScoreLegendCounts } from "@/utils/scorecardUtils";

export interface ScoringLegendProps {
  counts: ScoreLegendCounts;
  isDark?: boolean;
}

export const ScoringLegend: React.FC<ScoringLegendProps> = ({
  counts,
  isDark = false,
}) => {
  const items = [
    {
      label: "HIO",
      count: counts.holeInOne,
      icon: (
        <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
          <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
        </View>
      ),
    },
    {
      label: "Albatross",
      count: counts.albatross,
      icon: (
        <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
          <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
        </View>
      ),
    },
    {
      label: "Eagle",
      count: counts.eagle,
      icon: (
        <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
          <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
        </View>
      ),
    },
    {
      label: "Birdie",
      count: counts.birdie,
      icon: <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />,
    },
    {
      label: "Par",
      count: counts.par,
      icon: (
        <View
          style={[
            styles.dashedSquare,
            { borderColor: isDark ? "#666" : "#999" },
          ]}
        />
      ),
    },
    {
      label: "Bogey",
      count: counts.bogey,
      icon: <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />,
    },
    {
      label: "Double",
      count: counts.double,
      icon: (
        <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
          <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
        </View>
      ),
    },
    {
      label: "Triple",
      count: counts.triple,
      icon: (
        <View style={[styles.tripleSquareOuter, { borderColor: "#6a1b9a" }]}>
          <View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a" }]}>
            <View style={[styles.tripleSquareInner, { borderColor: "#6a1b9a" }]} />
          </View>
        </View>
      ),
    },
    {
      label: "Quad+",
      count: counts.quadPlus,
      icon: (
        <View
          style={[
            styles.singleSquare,
            { borderColor: isDark ? "#ffffff" : "#1f2937" },
          ]}
        />
      ),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(31, 31, 35, 0.35)"
            : "rgba(248, 250, 252, 0.35)",
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item, idx) => (
          <View key={idx} style={styles.legendItem}>
            <View style={styles.iconContainer}>{item.icon}</View>
            <Text
              style={[
                styles.itemLabel,
                { color: isDark ? "#d1d5db" : "#475569" },
              ]}
            >
              {item.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(45, 45, 52, 0.40)"
                    : "rgba(226, 232, 240, 0.40)",
                },
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  { color: isDark ? "#ffffff" : "#0f172a" },
                ]}
              >
                {item.count}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  singleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  doubleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1,
  },
  dashedSquare: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 2,
  },
  singleSquare: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  doubleSquare: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  innerSquare: {
    width: 13,
    height: 13,
    borderWidth: 1,
    borderRadius: 1.5,
  },
  tripleSquareOuter: {
    width: 21,
    height: 21,
    borderWidth: 1.2,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareMid: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareInner: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderRadius: 1.5,
  },
});
