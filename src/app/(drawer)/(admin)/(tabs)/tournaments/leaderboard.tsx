import React from "react";
import { useColorScheme } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { VStack } from "@/components/vstack";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";
//               onPress={() => routePage.push("/newRound/scoreCard")}
//     const routePage = useRouter();

export default function leaderboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      <Watermark />

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="px-4 pt-6 pb-20">
          {/* Header */}
          <VStack className="mb-6">
            <ThemedText
              style={{
                fontSize: 14,
                opacity: 0.6,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Leaderboard
            </ThemedText>
          </VStack>
        </VStack>
      </ScrollView>
    </ThemedView>
  );
}
