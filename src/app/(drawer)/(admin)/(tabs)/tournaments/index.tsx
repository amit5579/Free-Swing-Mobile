import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { Text } from "@/components/text";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";

export default function adminTournamentsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTeeColor, setSelectedTeeColor] = useState<string | null>(null);
  const [selectedScoringType, setSelectedScoringType] = useState<string | null>(
    null,
  );
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  // Dummy data (replace with API later)
  const tournaments = [
    {
      id: 1,
      name: "BMW Cup",
      course: "Club Prestige Golfshire Club",
      start: "Mar 11, 2026",
      end: "Mar 12, 2026",
    },
    {
      id: 2,
      name: "W12 Championship",
      course: "ASC AEPTA",
      start: "Mar 10, 2026",
      end: "Mar 11, 2026",
    },
    {
      id: 3,
      name: "Practice Tour",
      course: "Bangalore Golf Club",
      start: "Mar 9, 2026",
      end: "Mar 9, 2026",
    },
  ];

  const courses = [
    { label: "Club Prestige Golfshire Club", value: "1" },
    { label: "ASC AEPTA", value: "2" },
    { label: "Bangalore Golf Club", value: "3" },
  ];

  const teeColors = [
    { label: "red", value: "1" },
    { label: "blue", value: "2" },
    { label: "black", value: "3" },
    { label: "white", value: "4" },
    { label: "gold", value: "5" },
    { label: "green", value: "6" },
    { label: "silver", value: "7" },
  ];

  const scoringTypes = [
    { label: "Net Score (Include Par3)", value: "1" },
    { label: "Net Score (Exclude Par3)", value: "2" },
    { label: "Stableford", value: "3" },
    { label: "Double Peoria", value: "4" },
  ];
  return (
    <>
      <ThemedView
        style={{
          flex: 1,
        }}
      >
        <Watermark />

        {/* Header */}
        <HStack className="justify-between items-center p-4 mt-2">
          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Tournaments
          </ThemedText>

          <Pressable
            style={styles.createButton}
            onPress={() => setModalVisible(true)}
            className="flex-row items-center gap-1"
          >
            <Ionicons name="add-outline" size={28} color="white" />
            <ThemedText style={{ color: "white", fontWeight: "600" }}>
              Create Tournament
            </ThemedText>
          </Pressable>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pb-20 mt-4 gap-4">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                isDark={isDark}
              />
            ))}
          </VStack>
        </ScrollView>
      </ThemedView>

      {/* CREATE TOURNAMENT MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <HStack className="justify-between items-center mb-4">
              <ThemedText style={{ fontSize: 28, fontWeight: "700" }}>
                Create Tournament
              </ThemedText>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack className="gap-3">
                <VStack className="gap-1">
                  <Text>Tournament Name</Text>
                  <TextInput
                    placeholder="Enter Tournament Name"
                    style={styles.input}
                  />
                </VStack>

                <VStack className="gap-1">
                  <Text>Course</Text>
                  <Dropdown
                    style={styles.input}
                    data={courses}
                    labelField="label"
                    valueField="value"
                    placeholder="Select course"
                    value={selectedCourse}
                    onChange={(item) => setSelectedCourse(item.value)}
                  />
                </VStack>

                <VStack className="gap-1">
                  <Text>Tee Box</Text>
                  {/* <TextInput
                    placeholder="Select Tee Box..."
                    style={styles.input}
                  /> */}
                  <Dropdown
                    style={styles.input}
                    data={teeColors}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Tee Box..."
                    value={selectedTeeColor}
                    onChange={(item) => setSelectedTeeColor(item.value)}
                  />
                </VStack>

                <VStack className="gap-1">
                  <Text>Scoring Type</Text>
                  <Dropdown
                    style={styles.input}
                    data={scoringTypes}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Scoring Type"
                    value={selectedScoringType}
                    onChange={(item) => setSelectedScoringType(item.value)}
                  />
                </VStack>

                <VStack className="gap-1">
                  <Text>Start Date</Text>
                  <Pressable
                    onPress={() => setShowPicker(true)}
                    className="p-3 w-full border border-gray-400 rounded-md"
                  >
                    <Text>Select Start Date</Text>
                  </Pressable>
                  {showPicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={onChange}
                    />
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Text>End Date</Text>
                  <Pressable
                    onPress={() => setShowPicker(true)}
                    className="p-3 w-full border border-gray-400 rounded-md"
                  >
                    <Text>Select End Date</Text>
                  </Pressable>
                  {showPicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={onChange}
                    />
                  )}
                </VStack>
                <VStack className="gap-1">
                  <Text>Description</Text>

                  <TextInput
                    placeholder="Optional Description"
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                  />
                </VStack>
              </VStack>
            </ScrollView>

            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={{ color: "#374151" }}>Cancel</ThemedText>
              </Pressable>

              <Pressable style={styles.createButton}>
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Create Tournament
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

function TournamentCard({ tournament, isDark }: any) {
  const routePage = useRouter();

  return (
    <Box
      className="rounded-2xl p-4"
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
      }}
    >
      <VStack className="gap-2">
        <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
          {tournament.name}
        </ThemedText>

        <ThemedText style={{ opacity: 0.7 }}>{tournament.course}</ThemedText>

        <HStack className="justify-between mt-2">
          <VStack>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              Start
            </ThemedText>

            <ThemedText>{tournament.start}</ThemedText>
          </VStack>

          <VStack>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>End</ThemedText>

            <ThemedText>{tournament.end}</ThemedText>
          </VStack>
        </HStack>

        <Divider className="my-2" />

        {/* Actions */}
        <HStack className="justify-between">
          <Pressable className="items-center">
            <Ionicons name="create-outline" size={25} color="#6b7280" />
            <ThemedText style={{ fontSize: 15, fontWeight: "400" }}>
              Edit
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => routePage.push("/(drawer)/(admin)/(tabs)/tournaments/managePlayers")}
            className="items-center"
          >
            <Ionicons name="person-add-outline" size={25} color="#3b82f6" />
            <ThemedText style={{ fontSize: 15, fontWeight: "400" }}>
              Manage
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => routePage.push("/(drawer)/(admin)/(tabs)/tournaments/tournamentHistory")}
            className="items-center"
          >
            <Ionicons name="time-outline" size={25} color="#06b6d4" />
            <ThemedText style={{ fontSize: 15, fontWeight: "400" }}>
              History
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => routePage.push("/(drawer)/(admin)/(tabs)/tournaments/leaderboard")}
            className="items-center">
            <Ionicons name="stats-chart-outline" size={25} color="#f59e0b" />
            <ThemedText style={{ fontSize: 15, fontWeight: "400" }}>
              Leaderboard
            </ThemedText>
          </Pressable>

          <Pressable className="items-center">
            <Ionicons name="trash-outline" size={25} color="#ef4444" />
            <ThemedText style={{ fontSize: 15, fontWeight: "400" }}>
              Delete
            </ThemedText>
          </Pressable>
        </HStack>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
    maxHeight: "85%",
  },

  input: {
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 8,
    padding: 12,
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
  },

  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
