import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getScorecardDetails,
  ScorecardHoleApi,
} from "@/api/modules/admin/dashboard.api";
import { SafeAreaView } from "react-native-safe-area-context";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

export default function ScorecardDetailsScreen() {
  const { scorecardId, courseName, username } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [holes, setHoles] = useState<ScorecardHoleApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scorecardId) {
      fetchDetails();
    }
  }, [scorecardId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await getScorecardDetails(Number(scorecardId));
      setHoles(data);
    } catch (error) {
      console.error("Fetch scorecard results error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (data: ScorecardHoleApi[]) => {
    return {
      yards: data.reduce((a, b) => a + (b.yardage || 0), 0),
      par: data.reduce((a, b) => a + (b.par || 0), 0),
      score: data.reduce((a, b) => a + (b.score || 0), 0),
      net: data.reduce((a, b) => a + (b.netScore || 0), 0),
      pts: data.reduce((a, b) => a + (b.stablefordPoints || 0), 0),
    };
  };

  const front9 = holes.slice(0, 9);
  const back9 = holes.slice(9, 18);
  const frontTotals = calculateTotals(front9);
  const backTotals = calculateTotals(back9);
  const gameTotals = calculateTotals(holes);

  const TableHeader = () => (
    <HStack
      style={{
        backgroundColor: "rgba(139,195,74,0.85)",
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
    >
      <ThemedText
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 10,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        HOLE
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 10,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        SI
      </ThemedText>
      <ThemedText
        style={{
          flex: 1.2,
          color: "#fff",
          fontSize: 10,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        YARDS
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 10,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        PAR
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 10,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        SCORE
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 10,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        NET
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 10,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        PTS
      </ThemedText>
    </HStack>
  );

  const TableRow = ({
    hole,
    index,
  }: {
    hole: ScorecardHoleApi;
    index: number;
  }) => (
    <HStack
      style={{
        paddingVertical: 14,
        paddingHorizontal: 10,
        backgroundColor:
          index % 2 === 0
            ? isDark
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.01)"
            : "transparent",
        borderBottomWidth: 1,
        borderBottomColor: isDark
          ? "rgba(255,255,255,0.05)"
          : "rgba(0,0,0,0.05)",
        alignItems: "center",
      }}
    >
      <ThemedText
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {hole.holeNumber}
      </ThemedText>
      <ThemedText
        style={{ flex: 1, fontSize: 11, color: "#888", textAlign: "center" }}
      >
        {hole.strokeIndex}
      </ThemedText>
      <ThemedText
        style={{ flex: 1.2, fontSize: 11, color: "#888", textAlign: "center" }}
      >
        {hole.yardage}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {hole.par}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: "800",
          textAlign: "center",
          color: isDark ? "#fff" : "#333",
        }}
      >
        {hole.score}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {hole.netScore}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: "800",
          textAlign: "center",
          color: isDark ? "#fff" : "#333",
        }}
      >
        {hole.stablefordPoints}
      </ThemedText>
    </HStack>
  );

  const SummaryRow = ({
    label,
    totals,
    isTotal = false,
  }: {
    label: string;
    totals: any;
    isTotal?: boolean;
  }) => (
    <HStack
      style={{
        paddingVertical: 16,
        paddingHorizontal: 10,
        backgroundColor: isTotal
          ? isDark
            ? "rgba(139,195,74,0.15)"
            : "rgba(139,195,74,0.12)"
          : isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.02)",
        borderBottomWidth: isTotal ? 0 : 1,
        borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        borderBottomLeftRadius: isTotal ? 12 : 0,
        borderBottomRightRadius: isTotal ? 12 : 0,
        alignItems: "center",
      }}
    >
      <ThemedText
        style={{ flex: 2, fontSize: 11, fontWeight: "900", color: "#8BC34A" }}
      >
        {label.toUpperCase()}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1.2,
          fontSize: 11,
          fontWeight: "700",
          textAlign: "center",
          color: "#888",
        }}
      >
        {totals.yards}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 11,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {totals.par}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: "900",
          textAlign: "center",
          color: isDark ? "#fff" : "#333",
        }}
      >
        {totals.score}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 11,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {totals.net}
      </ThemedText>
      <ThemedText
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: "900",
          textAlign: "center",
          color: isDark ? "#fff" : "#333",
        }}
      >
        {totals.pts}
      </ThemedText>
    </HStack>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: isDark ? "#000" : "#F2F2F2" }}
    >
      <Watermark />

      {/* Premium Header */}
      <VStack className="px-4 pt-2 mb-2">
        <HStack className="items-center mb-1">
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
          </Pressable>
          <VStack style={{ marginLeft: 16, flex: 1 }}>
            <ThemedText
              style={{ fontSize: 20, fontWeight: "800", color: "#8BC34A" }}
              numberOfLines={1}
            >
              {courseName || "Course Scorecard"}
            </ThemedText>
            <ThemedText
              style={{ fontSize: 12, color: isDark ? "#888" : "#666" }}
            >
              Stableford Format • {username}
            </ThemedText>
          </VStack>
        </HStack>
      </VStack>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#8BC34A" />
          <ThemedText style={{ marginTop: 12, color: "#8BC34A" }}>
            Building scorecard...
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          {/* STICKY TABLE HEADER */}
          <Box
            style={{
              marginTop: 10,
              overflow: "hidden",
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
            }}
          >
            <TableHeader />
          </Box>

          {/* Main Scorecard Table Content */}
          <Box
            style={{
              backgroundColor: isDark
                ? "rgba(26,26,26,0.5)"
                : "rgba(255,255,255,0.7)",
              borderBottomLeftRadius: 15,
              borderBottomRightRadius: 15,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
              overflow: "hidden",
            }}
          >
            {/* Holes */}
            {holes.map((hole, i) => (
              <TableRow key={hole.holeId} hole={hole} index={i} />
            ))}

            {/* Totals */}
            <SummaryRow label="Front 9" totals={frontTotals} />
            <SummaryRow label="Back 9" totals={backTotals} />
            <SummaryRow
              label="Grand Total"
              totals={gameTotals}
              isTotal={true}
            />
          </Box>

          {/* Performance Legend */}
          <VStack style={{ marginTop: 24, paddingHorizontal: 4 }}>
            <ThemedText
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: "#999",
                marginBottom: 12,
              }}
            >
              SCORE LEGEND
            </ThemedText>
            <HStack style={{ flexWrap: "wrap", gap: 10 }}>
              {[
                { name: "Eagle", color: "#4CAF50" },
                { name: "Birdie", color: "#8BC34A" },
                { name: "Par", color: isDark ? "#fff" : "#333" },
                { name: "Bogey", color: "#F44336" },
                { name: "Double+", color: "#D32F2F" },
              ].map((l, i) => (
                <HStack
                  key={i}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: l.color,
                      marginRight: 6,
                    }}
                  />
                  <ThemedText
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#bbb" : "#666",
                    }}
                  >
                    {l.name}
                  </ThemedText>
                </HStack>
              ))}
            </HStack>
          </VStack>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
