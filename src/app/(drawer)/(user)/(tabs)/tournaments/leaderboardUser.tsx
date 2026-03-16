import React from "react";
import {
  StyleSheet,
  ScrollView,

} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { HStack } from "@/components/hstack";
import Watermark from "@/components/watermark";

export default function leaderboardUser() {
  return (
    <>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.safeArea}>
          <Watermark />

          {/* Header */}
          <HStack className="justify-between items-center mt-3">
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              Leaderboard
            </ThemedText>
          </HStack>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          ></ScrollView>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.two,
    maxWidth: MaxContentWidth,
  },
  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },
  list: {
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
});
