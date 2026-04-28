import React, { useEffect, useState } from "react";
import { Pressable, useColorScheme, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import {
  getTournamentHistory,
  getTournamentHistoryByUserId,
} from "@/api/modules/admin/tournaments.api";
import { Skeleton } from "@/components/Skeleton";

export default function subAdminTournamentHistory() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  const { tournamentId } = useLocalSearchParams();

  const [history, setHistory] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  // ── Colors ──
  const colors = {
    bg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)",
    cardBorder: isDark ? "#1e293b" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    dimText: isDark ? "#64748b" : "#94a3b8",
    accent: "#84cc16",
    accentSoft: isDark ? "rgba(132,204,22,0.15)" : "rgba(132,204,22,0.1)",
    divider: isDark ? "#1e293b" : "#f1f5f9",
    iconBg: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.8)",
  };

  const EmptyState = () => (
    <VStack
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          backgroundColor: colors.iconBg,
          padding: 18,
          borderRadius: 50,
          marginBottom: 16,
        }}
      >
        <Ionicons name="time-outline" size={32} color={"#84cc16"} />
      </View>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 6,
        }}
      >
        No History Found
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 14,
          color: colors.subText,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        No rounds have been completed for this tournament yet. Scores will
        appear here once players start submitting their scorecards.
      </ThemedText>
    </VStack>
  );

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getTournamentHistory(Number(tournamentId)); // console.log("hData", hData);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      <HStack
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 🔙 BACK */}
        <Pressable
          onPress={() => routePage.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={isDark ? "#fff" : "#020617"}
          />
        </Pressable>

        {/* 🧠 TITLE BLOCK */}
        <VStack style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            style={{
              fontSize: 17,
              fontWeight: "700",
              marginTop: 2,
              color: isDark ? "#fff" : "#020617",
            }}
          >
            Tournament History
          </ThemedText>
        </VStack>

        {/* ⚖️ RIGHT SPACER */}
        <View style={{ width: 40 }} />
      </HStack>
    </Box>
  );

  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      {renderHeader()}

      <Watermark />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
        }}
      >
        <VStack className="gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <HistorySkeleton key={i} isDark={isDark} />
            ))
          ) : (
            <>
              {history.length == 0 ? (
                <EmptyState />
              ) : (
                history.map((item: any) => (
                  <HistoryCard key={item.id} item={item} isDark={isDark} />
                ))
              )}
            </>
          )}
        </VStack>
      </ScrollView>
    </ThemedView>
  );
}

function HistorySkeleton({ isDark }: { isDark: boolean }) {
  return (
    <Box
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <VStack className="gap-3">
        {/* Date Row */}
        <HStack className="justify-between">
          <Skeleton isDark={isDark} height={16} width={120} borderRadius={4} />
          <Skeleton isDark={isDark} height={24} width={70} borderRadius={6} />
        </HStack>

        {/* Player Name */}
        <Skeleton isDark={isDark} height={22} width={160} borderRadius={4} />
        <Divider />

        {/* Stats Row */}
        <HStack className="justify-between">
          <VStack className="gap-2">
            <Skeleton isDark={isDark} height={14} width={45} borderRadius={4} />
            <Skeleton isDark={isDark} height={20} width={30} borderRadius={4} />
          </VStack>

          <VStack className="gap-2">
            <Skeleton isDark={isDark} height={14} width={45} borderRadius={4} />
            <Skeleton isDark={isDark} height={20} width={30} borderRadius={4} />
          </VStack>

          <VStack className="gap-2">
            <Skeleton isDark={isDark} height={14} width={45} borderRadius={4} />
            <Skeleton isDark={isDark} height={20} width={30} borderRadius={4} />
          </VStack>
        </HStack>

        {/* Action Button */}
        <HStack className="justify-end items-center mt-2">
          <Skeleton isDark={isDark} height={38} width={130} borderRadius={8} />
        </HStack>
      </VStack>
    </Box>
  );
}

function HistoryCard({ item, isDark }: any) {
  const routePage = useRouter();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "numeric",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  return (
    <Box
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <VStack className="gap-3">
        {/* Date */}
        <HStack className="justify-between">
          <ThemedText style={{ fontSize: 15, opacity: 0.6 }}>
            {formatDate(item.datePlayed)}
          </ThemedText>
          <Box
            style={{
              backgroundColor: "#6b7280",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <ThemedText
              style={{
                color: "white",
                fontSize: 12,
              }}
            >
              {/* {item.excluded} */}
              Standard
            </ThemedText>
          </Box>
        </HStack>

        {/* Player */}
        <ThemedText style={{ fontSize: 19, fontWeight: "700" }}>
          {item.username}
        </ThemedText>
        <Divider />
        {/* Stats Row */}
        <HStack className="justify-between">
          <VStack>
            <ThemedText style={{ fontSize: 15, opacity: 0.6 }}>
              Round
            </ThemedText>
            <ThemedText style={{ fontSize: 19, fontWeight: 700 }}>
              {item.roundNumber}
            </ThemedText>
          </VStack>

          <VStack>
            <ThemedText style={{ fontSize: 15, opacity: 0.6 }}>
              Score
            </ThemedText>
            <ThemedText style={{ fontSize: 19, fontWeight: 700 }}>
              {item.totalScore}
            </ThemedText>
          </VStack>

          <VStack>
            <ThemedText style={{ fontSize: 15, opacity: 0.6 }}>Net</ThemedText>
            <ThemedText style={{ fontSize: 19, fontWeight: 700 }}>
              {item.totalNet}
            </ThemedText>
          </VStack>
        </HStack>
        {/* Excluded Badge + Button */}
        <HStack className="justify-end items-center mt-2">
          <Pressable
            onPress={() =>
              routePage.push(
                `/(drawer)/(subAdmin)/(tabs)/tournaments/playerScorecard?scorecardId=${item.scorecardId}`,
              )
            }
            style={{
              borderWidth: 1,
              borderColor: "#2563eb",
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 8,
            }}
          >
            <ThemedText
              style={{
                color: "#2563eb",
                fontWeight: "600",
              }}
            >
              View Scorecard
            </ThemedText>
          </Pressable>
        </HStack>
      </VStack>
    </Box>
  );
}
