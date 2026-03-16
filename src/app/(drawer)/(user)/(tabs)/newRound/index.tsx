import React, { useState } from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";

import { Ionicons } from "@expo/vector-icons";

import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/text";
import { useRouter } from "expo-router";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";

export default function NewRoundScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const routePage = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [selectedTee, setSelectedTee] = useState<"blue" | "red" | null>(null);

  const [scoringMode, setScoringMode] = useState("netInclude");

  const courses = [
    { id: 1, name: "ASC AEPTA", location: "Bangalore", tees: 2, free: true },
    { id: 2, name: "Royal Greens", location: "Delhi", tees: 4, free: false },
    { id: 3, name: "Palm Meadows", location: "Mumbai", tees: 3, free: true },
  ];

  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 4,
    right: 4,
  };
  return (
    <>
      <ThemedView
        style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}
      >
        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-5 pt-6 pb-20">
            {/* Header */}
            <VStack className="mb-6">
              <ThemedText
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  textAlign: "center",
                  lineHeight: 27,
                }}
              >
                Start a New Round
              </ThemedText>

              <ThemedText
                style={{
                  fontSize: 15,
                  opacity: 0.6,
                  marginTop: 9,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Choose a golf course to begin scoring your round.
              </ThemedText>
            </VStack>

            <VStack className="gap-4">
              {courses.map((course) => (
                <GolfCourseCard
                  key={course.id}
                  course={course}
                  isDark={isDark}
                  openModal={() => setModalVisible(true)}
                />
              ))}
            </VStack>
          </VStack>
        </ScrollView>
      </ThemedView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <HStack className="justify-between items-center mb-4">
              <ThemedText
                style={{ fontSize: 18, fontWeight: "700", lineHeight: 27 }}
              >
                Select Tee Box
              </ThemedText>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            {/* Description */}
            <ThemedText style={{ marginBottom: 16, opacity: 0.7 }}>
              You are starting a round at{" "}
              <ThemedText style={{ fontWeight: "700" }}>ASC AEPTA</ThemedText>.
            </ThemedText>

            {/* Tee Box Label */}
            <ThemedText
              style={{ fontSize: 12, fontWeight: "600", marginBottom: 6 }}
            >
              TEE BOX
            </ThemedText>

            {/* Tee Box Selector */}
            <Pressable
              onPress={() => setDropdownOpen(!dropdownOpen)}
              style={{
                borderWidth: 1,
                borderColor: dropdownOpen ? "#8bc34a" : "#818589",
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <HStack className="justify-between items-center">
                <ThemedText
                  style={{
                    fontSize: 16,
                    color: selectedTee ? "#8bc34a" : "#999",
                    fontWeight: selectedTee ? "600" : "400",
                  }}
                >
                  {selectedTee
                    ? selectedTee === "blue"
                      ? "BLUE (Blue)"
                      : "RED (Red)"
                    : "Choose a Tee box..."}
                </ThemedText>

                {dropdownOpen ? (
                  <Ionicons name="chevron-up" size={20} />
                ) : (
                  <Ionicons name="chevron-down" size={20} />
                )}
              </HStack>
            </Pressable>

            {dropdownOpen && (
              <VStack className="border border-gray-400 rounded-lg overflow-hidden">
                {/* BLUE OPTION */}
                <Pressable
                  onPress={() => {
                    setSelectedTee("blue");
                    setDropdownOpen(false);
                  }}
                  style={{
                    backgroundColor:
                      selectedTee === "blue" ? "#8bc34a" : "white",
                    paddingVertical: 7,
                  }}
                >
                  <ThemedText
                    style={{
                      color: selectedTee === "blue" ? "white" : "black",
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    BLUE (Blue)
                  </ThemedText>
                </Pressable>

                {/* RED OPTION */}
                <Pressable
                  onPress={() => {
                    setSelectedTee("red");
                    setDropdownOpen(false);
                  }}
                  style={{
                    backgroundColor:
                      selectedTee === "red" ? "#8bc34a" : "white",
                    paddingVertical: 7,
                  }}
                >
                  <ThemedText
                    style={{
                      color: selectedTee === "red" ? "white" : "black",
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    RED (Red)
                  </ThemedText>
                </Pressable>
              </VStack>
            )}

            {/* Handicap Card */}
            {selectedTee && (
              <Box style={styles.handicapCard}>
                <HStack className="justify-between items-center">
                  <VStack>
                    <ThemedText style={{ fontSize: 12, fontWeight: "600" }}>
                      YOUR HANDICAP
                    </ThemedText>

                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      Based on Index 0.0
                    </ThemedText>
                  </VStack>

                  <ThemedText
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: "#8bc34a",
                    }}
                  >
                    0
                  </ThemedText>
                </HStack>
              </Box>
            )}

            {/* Scoring Mode */}
            {/* Scoring Mode */}
            <VStack className="mt-4">
              <ThemedText
                style={{ fontSize: 12, fontWeight: "600", marginBottom: 8 }}
              >
                SCORING MODE
              </ThemedText>

              <Pressable onPress={() => setScoringMode("netInclude")}>
                <HStack className="items-center mb-2">
                  <Ionicons
                    name={
                      scoringMode === "netInclude"
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={18}
                    color={scoringMode === "netInclude" ? "#8bc34a" : "#888"}
                  />
                  <ThemedText style={{ marginLeft: 8 }}>
                    Net Score (include par 3)
                  </ThemedText>
                </HStack>
              </Pressable>

              <Pressable onPress={() => setScoringMode("netExclude")}>
                <HStack className="items-center mb-2">
                  <Ionicons
                    name={
                      scoringMode === "netExclude"
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={18}
                    color={scoringMode === "netExclude" ? "#8bc34a" : "#888"}
                  />
                  <ThemedText style={{ marginLeft: 8 }}>
                    Net Score (exclude par 3)
                  </ThemedText>
                </HStack>
              </Pressable>

              <Pressable onPress={() => setScoringMode("stableford")}>
                <HStack className="items-center">
                  <Ionicons
                    name={
                      scoringMode === "stableford"
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={18}
                    color={scoringMode === "stableford" ? "#8bc34a" : "#888"}
                  />
                  <ThemedText style={{ marginLeft: 8 }}>
                    Stableford Scoring
                  </ThemedText>
                </HStack>
              </Pressable>
            </VStack>

            {/* Footer Buttons */}
            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedTee(null);
                  setModalVisible(false);
                }}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => routePage.push("/newRound/scoreCard")}
                style={styles.startButton}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Start Game
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------- COURSE CARD ---------- */

function GolfCourseCard({ course, isDark, openModal }: any) {
  return (
    <Box
      className="rounded-2xl p-5 relative"
      style={{
        // backgroundColor: isDark ? "#111" : "#fff",
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
      }}
    >
      {/* Free Badge */}
      {course.free && (
        <Box
          className="absolute top-3 right-3 px-3 py-1 rounded-full"
          style={{
            backgroundColor: isDark ? "#262626" : "#e5e5e5",
          }}
        >
          <ThemedText
            style={{
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            Free
          </ThemedText>
        </Box>
      )}
      {/* Flag */}
      <HStack className="mb-3">
        {/* <FlagIcon size={28} color="#8bc34a" /> */}
        <Svg width={28} height={28} viewBox="0 0 448 512">
          <Path
            fill="#8bc34a"
            d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V358.4l62.7-18.8c41.9-12.6 87.1-8.7 126.2 10.9 42.7 21.4 92.5 24 137.2 7.2l37.1-13.9c12.5-4.7 20.8-16.6 20.8-30V65.1c0-23-24.2-38-44.8-27.7l-11.8 5.9c-44.9 22.5-97.8 22.5-142.8 0-36.4-18.2-78.3-21.8-117.2-10.1L64 54.4V32z"
          />
        </Svg>
      </HStack>
      {/* Course Name */}
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "700",
        }}
      >
        {course.name}
      </ThemedText>
      {/* Location */}
      <HStack className="items-center mt-2">
        <Ionicons name="location-outline" size={18} color="#ef4444" />

        <ThemedText
          style={{
            marginLeft: 6,
            fontSize: 14,
            opacity: 0.7,
          }}
        >
          {course.location}
        </ThemedText>
      </HStack>
      {/* Tee Boxes */}
      <HStack className="items-center mt-2">
        <Ionicons
          name="layers-outline"
          size={18}
          color={isDark ? "#a3a3a3" : "#6b7280"}
        />

        <ThemedText
          style={{
            marginLeft: 6,
            fontSize: 14,
            opacity: 0.7,
          }}
        >
          {course.tees} Tee Boxes
        </ThemedText>
      </HStack>
      <Pressable
        onPress={openModal}
        className="mt-3 bg-[#8bc34a] backdrop-blur-md rounded-xl py-3 items-center"
      >
        <ThemedText style={{ color: "white", fontWeight: "600" }}>
          Select Tee Box
        </ThemedText>
      </Pressable>
    </Box>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
