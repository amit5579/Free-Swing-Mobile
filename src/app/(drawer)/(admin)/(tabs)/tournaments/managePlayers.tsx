import React, { useState } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";

export default function managePlayers() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [players, setPlayers] = useState([
    {
      id: 1,
      username: "narender",
      email: "narender@mail.com",
      handicap: "-",
      added: true,
    },
    {
      id: 2,
      username: "rks",
      email: "rks@mail.com",
      handicap: "-",
      added: false,
    },
    {
      id: 3,
      username: "newuser",
      email: "newuser@mail.com",
      handicap: 11,
      added: false,
    },
    {
      id: 4,
      username: "r1",
      email: "r1@mail.com",
      handicap: 2,
      added: false,
    },
    {
      id: 5,
      username: "r2",
      email: "r2@mail.com",
      handicap: 2,
      added: false,
    },
  ]);

  const togglePlayer = (id: number) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, added: !player.added } : player
      )
    );
  };

  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      <Watermark />
<ThemedText style={{ fontSize: 16, fontWeight: "700", textAlign: "center" , marginVertical: 16}}>Manage Players:bmw</ThemedText>
      <ScrollView showsVerticalScrollIndicator={false} >
        <VStack className="px-4 gap-4">


          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              togglePlayer={togglePlayer}
              isDark={isDark}
            />
          ))}

        </VStack>
      </ScrollView>
    </ThemedView>
  );
}

function PlayerCard({ player, togglePlayer, isDark }: any) {
  return (
    <Box
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <VStack className="gap-2">

        {/* Username */}
        <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
          {player.username}
        </ThemedText>

        {/* Email */}
        <ThemedText style={{ opacity: 0.7 }}>
          {player.email}
        </ThemedText>

        <Divider className="my-2" />

        {/* Handicap + Button */}
        <HStack className="justify-between items-center">

          <VStack>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              Handicap
            </ThemedText>

            <ThemedText style={{ fontWeight: "600" }}>
              {player.handicap}
            </ThemedText>
          </VStack>

          <Pressable
            onPress={() => togglePlayer(player.id)}
            style={[
              styles.button,
              player.added ? styles.removeButton : styles.addButton,
            ]}
          >
            <ThemedText
              style={{
                color: "white",
                fontWeight: "600",
              }}
            >
              {player.added ? "Remove" : "+ Add"}
            </ThemedText>
          </Pressable>

        </HStack>

      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  addButton: {
    backgroundColor: "#8bc34a",
  },

  removeButton: {
    backgroundColor: "#ef4444",
  },
});