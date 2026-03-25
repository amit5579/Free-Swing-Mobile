import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getScorecardDetails } from "@/api/admin/tournaments";

const PlayerScorecard = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  const { scorecardId } = useLocalSearchParams();

  const [scorecardData, setScorecardData] = useState<any>(null);

  const fetchScorecardData = async () => {
    try {
      const data = await getScorecardDetails(Number(scorecardId));
      setScorecardData(data);
    } catch (error) {
      console.error("Error fetching scorecard data:", error);
    }
  };

  useEffect(() => {
    fetchScorecardData();
  }, []);

  // 🔥 FULL 18 HOLES DATA (replace with API later)
  const holes = [
    { hole: 1, yards: 403, par: 4, score: 4, net: 3, pts: 3 },
    { hole: 2, yards: 173, par: 3, score: 3, net: 3, pts: 2 },
    { hole: 3, yards: 541, par: 5, score: 6, net: 6, pts: 1 },
    { hole: 4, yards: 402, par: 4, score: 4, net: 3, pts: 3 },
    { hole: 5, yards: 494, par: 5, score: 4, net: 4, pts: 3 },
    { hole: 6, yards: 166, par: 3, score: 4, net: 4, pts: 1 },
    { hole: 7, yards: 343, par: 4, score: 6, net: 6, pts: 0 },
    { hole: 8, yards: 317, par: 4, score: 5, net: 5, pts: 1 },
    { hole: 9, yards: 368, par: 4, score: 4, net: 4, pts: 2 },

    // ✅ BACK 9 (NEW)
    { hole: 10, yards: 380, par: 4, score: 5, net: 5, pts: 1 },
    { hole: 11, yards: 200, par: 3, score: 3, net: 3, pts: 2 },
    { hole: 12, yards: 510, par: 5, score: 5, net: 5, pts: 3 },
    { hole: 13, yards: 420, par: 4, score: 4, net: 4, pts: 2 },
    { hole: 14, yards: 300, par: 4, score: 6, net: 6, pts: 0 },
    { hole: 15, yards: 150, par: 3, score: 3, net: 3, pts: 2 },
    { hole: 16, yards: 430, par: 4, score: 4, net: 4, pts: 2 },
    { hole: 17, yards: 520, par: 5, score: 5, net: 5, pts: 3 },
    { hole: 18, yards: 410, par: 4, score: 4, net: 4, pts: 2 },
  ];

  // 🔥 SPLIT FRONT & BACK (DYNAMIC)
  const frontHoles = holes.filter((h) => h.hole <= 9);
  const backHoles = holes.filter((h) => h.hole > 9);

  const frontTotals = {
    yards: 3207,
    par: 36,
    score: 40,
    net: 38,
    pts: 16,
  };

  const backTotals = {
    yards: 3309,
    par: 36,
    score: 38,
    net: 36,
    pts: 18,
  };

  const grandTotals = {
    yards: 6516,
    par: 72,
    score: 78,
    net: 74,
    pts: 34,
  };

  const legendData = [
    { label: "Hole-in-One", border: "#facc15", type: "circle", text: "" },
    { label: "Albatross", border: "#0f766e", type: "circle", text: "" },
    { label: "Eagle", border: "#166534", type: "circle", text: "" },
    { label: "Birdie", border: "#16a34a", type: "circle", text: "2" },
    {
      label: "Par",
      border: "#9ca3af",
      type: "square",
      text: "9",
      dashed: true,
    },
    { label: "Bogey", border: "#ef4444", type: "square", text: "6" },
    { label: "Double Bogey", border: "#dc2626", type: "square", text: "1" },
    { label: "Triple Bogey", border: "#7c3aed", type: "square", text: "" },
    { label: "Quadruple Bogey+", border: "#000", type: "square", text: "" },
  ];
  // 🔥 REUSABLE ROW
 const renderRow = (item: any) => {
  const type = getScoreType(item.score, item.par);
  const styleConfig = getScoreStyle(type);

  return (
    <View
      key={item.hole}
      style={[styles.row, { borderBottomColor: isDark ? "#333" : "#ddd" }]}
    >
      <ThemedText style={styles.cell}>{item.hole}</ThemedText>
      <ThemedText style={styles.cell}>{item.yards}</ThemedText>
      <ThemedText style={styles.cell}>{item.par}</ThemedText>

      {/* ✅ UPDATED SCORE */}
      <View style={styles.scoreCell}>
        <View
          style={[
            styles.scoreBox,
            styleConfig.shape === "circle" && styles.circle,
            styleConfig.shape === "square" && styles.square,
            {
              borderColor: styleConfig.borderColor,
              borderStyle: styleConfig.dashed ? "dashed" : "solid",
            },
          ]}
        >
          <ThemedText style={{ fontWeight: "700" }}>
            {item.score}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.cell}>{item.net}</ThemedText>
      <ThemedText style={styles.cell}>{item.pts}</ThemedText>
    </View>
  );
};

  const getScoreType = (score:number, par:number) => {
  const diff = score - par;

  if (score === 1) return "hole-in-one";
  if (diff <= -3) return "albatross";
  if (diff === -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double";
  if (diff === 3) return "triple";
  return "quad";
};

const getScoreStyle = (type:string) => {
  switch (type) {
    case "hole-in-one":
      return { borderColor: "#facc15", shape: "circle" };
    case "albatross":
      return { borderColor: "#0f766e", shape: "circle" };
    case "eagle":
      return { borderColor: "#166534", shape: "circle" };
    case "birdie":
      return { borderColor: "#16a34a", shape: "circle" };
    case "par":
      return { borderColor: "#9ca3af", shape: "square", dashed: true };
    case "bogey":
      return { borderColor: "#ef4444", shape: "square" };
    case "double":
      return { borderColor: "#dc2626", shape: "square" };
    case "triple":
      return { borderColor: "#7c3aed", shape: "square" };
    default:
      return { borderColor: "#000", shape: "square" };
  }
};
  return (
    <ThemedView style={{ flex: 1 }}>
      {/* HEADER */}
      <HStack
        className="px-3 pt-5 pb-3 items-center"
        style={{ justifyContent: "space-between" }}
      >
        <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={isDark ? "#ffffff" : "#020617"}
          />
        </Pressable>

        <ThemedText
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Game History: Stableford
        </ThemedText>

        <View style={{ width: 40 }} />
      </HStack>

      <Watermark />

      <ScrollView>
        <View style={{ padding: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <VStack>
              {/* HEADER */}
              <View
                style={[
                  styles.row,
                  { backgroundColor: isDark ? "#111" : "#e5e5e5" },
                ]}
              >
                {["Hole", "Yards", "Par", "Score", "Net", "Pts"].map((h) => (
                  <ThemedText key={h} style={styles.headerCell}>
                    {h}
                  </ThemedText>
                ))}
              </View>

              {/* FRONT HOLES */}
              {frontHoles.map(renderRow)}

              {/* FRONT TOTAL */}
              <View style={[styles.row, styles.summaryRow]}>
                <ThemedText style={styles.cell}>Front 9</ThemedText>
                <ThemedText style={styles.cell}>{frontTotals.yards}</ThemedText>
                <ThemedText style={styles.cell}>{frontTotals.par}</ThemedText>
                <ThemedText style={styles.cell}>{frontTotals.score}</ThemedText>
                <ThemedText style={styles.cell}>{frontTotals.net}</ThemedText>
                <ThemedText style={styles.cell}>{frontTotals.pts}</ThemedText>
              </View>

              {/* 🔥 BACK HOLES (NEW ADDED) */}
              {backHoles.map(renderRow)}

              {/* BACK TOTAL */}
              <View style={[styles.row, styles.summaryRow]}>
                <ThemedText style={styles.cell}>Back 9</ThemedText>
                <ThemedText style={styles.cell}>{backTotals.yards}</ThemedText>
                <ThemedText style={styles.cell}>{backTotals.par}</ThemedText>
                <ThemedText style={styles.cell}>{backTotals.score}</ThemedText>
                <ThemedText style={styles.cell}>{backTotals.net}</ThemedText>
                <ThemedText style={styles.cell}>{backTotals.pts}</ThemedText>
              </View>

              {/* GRAND TOTAL */}
              <View style={[styles.row, styles.totalRow]}>
                <ThemedText style={styles.cell}>Grand Total</ThemedText>
                <ThemedText style={styles.cell}>{grandTotals.yards}</ThemedText>
                <ThemedText style={styles.cell}>{grandTotals.par}</ThemedText>
                <ThemedText style={styles.cell}>{grandTotals.score}</ThemedText>
                <ThemedText style={styles.cell}>{grandTotals.net}</ThemedText>
                <ThemedText style={styles.cell}>{grandTotals.pts}</ThemedText>
              </View>
            </VStack>
          </ScrollView>
          <ThemedView style={styles.legendRow}>
            {legendData.map((item, index) => (
              <ThemedView key={index} style={styles.legendItem}>
                <ThemedView
                  style={[
                    styles.icon,
                    item.type === "circle" && styles.circle,
                    item.type === "square" && styles.square,
                    {
                      borderColor: item.border,
                      borderStyle: item.dashed ? "dashed" : "solid",
                    },
                  ]}
                >
                  {item.text ? (
                    <ThemedText style={styles.iconText}>{item.text}</ThemedText>
                  ) : null}
                </ThemedView>

                <ThemedText style={styles.label}>{item.label}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default PlayerScorecard;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerCell: {
    width: 80,
    fontWeight: "700",
    textAlign: "center",
  },
  cell: {
    width: 80,
    textAlign: "center",
  },
  scoreCell: {
    width: 80,
    alignItems: "center",
  },
  summaryRow: {
    backgroundColor: "#cbd5d1",
  },
  totalRow: {
    backgroundColor: "#94a3b8",
  },
  legendContainer: {
    marginTop: 20,
  },

  legendTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  legendRow: {
    marginTop: 20,
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  container: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
  },

  legendItem: {
    width: "25%", // 4 items per row
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    width: 28,
    height: 28,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  circle: {
    borderRadius: 20,
  },

  square: {
    borderRadius: 4,
  },

  iconText: {
    fontSize: 12,
    fontWeight: "600",
  },

  label: {
    fontSize: 11,
    textAlign: "center",
  },
  scoreBox: {
  width: 28,
  height: 28,
  borderWidth: 2,
  alignItems: "center",
  justifyContent: "center",
},
});
