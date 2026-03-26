import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
//               onPress={() => routePage.push("/newRound/scoreCard")}
//     const routePage = useRouter();

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View } from "react-native";

import { Text } from "@/components/text";

import { SafeAreaView } from "react-native-safe-area-context";
export default function CombinedLeaderboardsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedTournaments, setSelectedTournaments] = useState<any>([]);
  const leaderboardData = [
    {
      rank: 1,
      name: "rks",
      tourneys: 1,
      holes: 18,
      gross: 78,
      net: 78,
      points: 30,
    },
    {
      rank: 2,
      name: "kpk1",
      tourneys: 1,
      holes: 18,
      gross: 78,
      net: 74,
      points: 0,
    },
    {
      rank: 3,
      name: "narender",
      tourneys: 2,
      holes: 18,
      gross: 86,
      net: 86,
      points: 0,
    },
  ];
  const [leaderboard, setLeaderboard] = useState(leaderboardData);

  const [selectedPremium, setSelectedPremium] = useState<string | null>(null);
  const [scoringMode, setScoringMode] = useState("netInclude");

  const tournaments = [
    { id: 1, name: "mandi summer", date: "3/13/26" },
    { id: 2, name: "bmw", date: "3/11/26" },
    { id: 3, name: "w12", date: "3/10/26" },
    { id: 4, name: "test", date: "3/9/26" },
    { id: 5, name: "12", date: "3/7/26" },
  ];

  const toggleTournament = (id: any) => {
    if (selectedTournaments.includes(id)) {
      setSelectedTournaments(
        selectedTournaments.filter((item: any) => item !== id),
      );
    } else {
      setSelectedTournaments([...selectedTournaments, id]);
    }
  };

  const PlayerAvatar = ({ name }: any) => {
    const letter = name.charAt(0).toUpperCase();

    return (
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#8bc34a",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ThemedText style={{ color: "white", fontWeight: "700" }}>
          {letter}
        </ThemedText>
      </View>
    );
  };
  return (
    <>
      <SafeAreaView        style={{
          flex: 1,
        }}
      >
        {/* HEADER */}
        <VStack className="my-3">
          <HStack className="justify-center items-center">
            {/* CENTER: Title */}
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 30,
              }}
            >
              Combined Leaderboards
            </ThemedText>
          </HStack>

          <ThemedText
            style={{
              fontSize: 15,
              opacity: 0.6,
              marginTop: 9,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Aggregate scores across multiple tournaments
          </ThemedText>
        </VStack>
        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-5 pb-20">
            <Pressable
              onPress={() => setModalVisible(true)}
              className="border border-[#8bc34a] rounded-xl py-3 items-center"
            >
              <ThemedText>Select Tournaments</ThemedText>
            </Pressable>
            <HStack className="flex-wrap gap-2 mt-3">
              {selectedTournaments.map((id: any) => {
                const t = tournaments.find((t: any) => t.id === id);

                return (
                  <Pressable
                    key={id}
                    onPress={() => toggleTournament(id)}
                    className="bg-[#8bc34a] p-3 rounded-full flex-row items-center gap-1"
                  >
                    <Text className="text-white text-md font-semibold">
                      {t?.name}
                    </Text>

                    <Ionicons name="close" size={17} color="white" />
                  </Pressable>
                );
              })}
            </HStack>

            <VStack className="gap-3 mt-5">
              {leaderboard.map((player: any, index: any) => (
                <Box
                  key={index}
                  className="p-4 rounded-xl border border-neutral-200"
                >
                  <HStack className="justify-between items-center">
                    <VStack>
                      <ThemedText
                        style={{
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        #{player.rank} {player.name}
                      </ThemedText>

                      <ThemedText
                        style={{
                          fontSize: 12,
                          opacity: 0.6,
                        }}
                      >
                        Tourneys: {player.tourneys}
                      </ThemedText>
                    </VStack>

                    <ThemedText
                      style={{
                        color: "#8bc34a",
                        fontWeight: "700",
                        fontSize: 18,
                      }}
                    >
                      Total Points: {player.points}
                    </ThemedText>
                  </HStack>

                  <HStack className="justify-between mt-3">
                    <ThemedText style={{ fontSize: 14 }}>
                      Gross: {player.gross}
                    </ThemedText>

                    <ThemedText style={{ fontSize: 14 }}>
                      Net: {player.net}
                    </ThemedText>

                    <ThemedText style={{ fontSize: 14 }}>
                      Holes: {player.holes}
                    </ThemedText>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </VStack>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <HStack className="justify-between items-center mb-4">
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                Select Tournaments
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            <ScrollView>
              {tournaments.map((tournament) => (
                <Pressable
                  key={tournament.id}
                  onPress={() => toggleTournament(tournament.id)}
                  className="flex-row justify-between items-center py-3"
                >
                  <VStack>
                    <Text className="font-semibold text-xl">
                      {tournament.name}
                    </Text>

                    <Text className="text-md opacity-60">
                      {tournament.date}
                    </Text>
                  </VStack>

                  <Ionicons
                    name={
                      selectedTournaments.includes(tournament.id)
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={22}
                    color="#8bc34a"
                  />
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              className="bg-[#8bc34a] py-3 rounded-lg items-center mt-4"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white text-lg font-semibold">Apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------- COURSE CARD ---------- */

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
  },

  selectBox: {
    borderWidth: 1,
    borderColor: "#8bc34a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },

  handicapCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },

  cancelButton: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  startButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
