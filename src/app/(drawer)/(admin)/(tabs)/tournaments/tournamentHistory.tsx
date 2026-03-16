import React from "react";
import { Pressable, useColorScheme, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";

export default function tournamentHistory() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const history = [
    {
      id: 1,
      date: "3/12/26, 8:18 AM",
      player: "kpk1",
      round: 1,
      score: 78,
      net: 74,
      excluded: "Standard",
    },
    {
      id: 2,
      date: "3/12/26, 8:16 AM",
      player: "rk123",
      round: 1,
      score: 114,
      net: 88,
      excluded: "Standard",
    },
  ];

  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      <Watermark />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
        }}
      >
        {/* Header */}
        <VStack className="mb-4">
          <ThemedText
             style={{ fontSize: 16, fontWeight: "700", textAlign: "center" , marginVertical: 16}}
          >
            Game History: bmw
          </ThemedText>
        </VStack>

        <VStack className="gap-4">
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} isDark={isDark} />
          ))}
        </VStack>
      </ScrollView>
    </ThemedView>
  );
}

function HistoryCard({ item, isDark }: any) {
  const routePage = useRouter();
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
        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
          {item.date}
        </ThemedText>

        {/* Player */}
        <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
          {item.player}
        </ThemedText>

        <Divider />

        {/* Stats Row */}
        <HStack className="justify-between">

          <VStack>
            <ThemedText style={{ fontSize: 11, opacity: 0.6 }}>
              Round
            </ThemedText>
            <ThemedText>{item.round}</ThemedText>
          </VStack>

          <VStack>
            <ThemedText style={{ fontSize: 11, opacity: 0.6 }}>
              Score
            </ThemedText>
            <ThemedText>{item.score}</ThemedText>
          </VStack>

          <VStack>
            <ThemedText style={{ fontSize: 11, opacity: 0.6 }}>
              Net
            </ThemedText>
            <ThemedText>{item.net}</ThemedText>
          </VStack>

        </HStack>

        {/* Excluded Badge + Button */}
        <HStack className="justify-between items-center mt-2">

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
              {item.excluded}
            </ThemedText>
          </Box>

          <Pressable
            onPress={() => routePage.push("/(drawer)/(admin)/(tabs)/tournaments/playerScorecard")}
            style={{
              borderWidth: 1,
              borderColor: "#2563eb",
              paddingHorizontal: 12,
              paddingVertical: 6,
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