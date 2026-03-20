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
import { getTournamentHistory } from "@/api/admin/tournaments";

export default function tournamentHistory() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  const { tournamentId, tournamentName } = useLocalSearchParams();

  const [history, setHistory] = useState<any>([]);

  const fetchHistory = async () => {
    try {
      const data = await getTournamentHistory(Number(tournamentId));
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      <HStack
        className="px-3 pt-5 pb-3 items-center"
        style={{ justifyContent: "space-between" }}
      >
        {/* LEFT: Back button */}
        <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={colorScheme === "dark" ? "#ffffff" : "#020617"}
          />
        </Pressable>

        {/* CENTER: Title */}
        <ThemedText
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 30,
          }}
        >
          Game History: {tournamentName}
        </ThemedText>

        {/* RIGHT: Add Button */}
        <View style={{ width: 40 }} />
      </HStack>
      <Watermark />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
        }}
      >
        <VStack className="gap-4">
          {history.map((item: any) => (
            <HistoryCard key={item.id} item={item} isDark={isDark} />
          ))}
        </VStack>
      </ScrollView>
    </ThemedView>
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
                `/(drawer)/(admin)/(tabs)/tournaments/playerScorecard?scorecardId=${item.scorecardId}`,
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
