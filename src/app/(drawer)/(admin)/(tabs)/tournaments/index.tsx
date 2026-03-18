import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ScrollView } from "react-native-gesture-handler";
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
import { getTournaments } from "@/api/tournaments";
import { getCourse } from "@/api/courses";

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

  const [tournaments, setTournaments] = useState<any>([]);
  const [courses, setCourses] = useState<any>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any>(null);

  const fetchTournaments = async () => {
    try {
      const data = await getTournaments();
      const courseData = await getCourse();

      // 🔥 transform courses here
      const formattedCourses = courseData.map((item: any) => ({
        label: item.name,
        value: item.courseId,
      }));

      setTournaments(data);
      setCourses(formattedCourses);
      // console.log("Tournaments:", tournaments);
      // console.log("Formatted Courses:", formattedCourses);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

  useEffect(() => {
    fetchTournaments();
    // console.log("cccc", courses);

    // console.log("Tournaments:", tournaments);
  }, []);

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };


  const teeColors = [
    { label: "red", value: "1" },
    { label: "blue", value: "2" },
    { label: "black", value: "3" },
    { label: "white", value: "4" },
    { label: "gold", value: "5" },
    { label: "green", value: "6" },
    { label: "silver", value: "7" },
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
            onPress={() => {
              setIsEditMode(false);
              setEditingCourse(null);
              setModalVisible(true);
            }}
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
            {tournaments.map((tournament: any) => (
              <TournamentCard
                key={tournament.tournamentId}
                tournament={tournament}
                setIsEditMode={setIsEditMode}
                setEditingCourse={setEditingCourse}
                setModalVisible={setModalVisible}
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
              <ThemedText style={{ fontSize: 17, fontWeight: "700" }}>
                {isEditMode ? "Edit Tournament" : "Create Tournament"}
              </ThemedText>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack className="gap-3">
                <VStack className="gap-1">
                  {/* <Text>Tournament Name</Text> */}
                  <TextInput
                    placeholder="Enter Tournament Name"
                    style={styles.input}
                  />
                </VStack>

                <VStack className="gap-1">
                  {/* <Text>Course</Text> */}
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
                  {/* <Text>Tee Box</Text> */}
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
                  {/* <Text>Scoring Type</Text> */}
                  <Dropdown
                    style={styles.input}
                    data={[
                      { label: "Net Score (Include Par3)", value: "1" },
                      { label: "Net Score (Exclude Par3)", value: "2" },
                      { label: "Stableford", value: "3" },
                      { label: "Double Peoria", value: "4" },
                    ]}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Scoring Type"
                    value={selectedScoringType}
                    onChange={(item) => setSelectedScoringType(item.value)}
                  />
                </VStack>

                <VStack className="gap-1">
                  {/* <Text>Start Date</Text> */}
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
                  {/* <Text>End Date</Text> */}
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
                  {/* <Text>Description</Text> */}

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
                  {isEditMode ? "Update Tournament" : "Create Tournament"}
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

function TournamentCard({
  tournament,
  isDark,
  setIsEditMode,
  setEditingCourse,
  setModalVisible,
}: any) {
  const routePage = useRouter();

  function routePlayersPage(tournamentId: string, tournamentName: string) {
    console.log(tournamentId);
    routePage.push(`/tournaments/managePlayers?tournamentId=${tournamentId}&tournamentName=${tournamentName}`);
  }
  const [menuVisible, setMenuVisible] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const MenuItem = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <ThemedText style={styles.menuText}>{label}</ThemedText>
    </TouchableOpacity>
  );
  return (
    <>
      <Box
        style={[
          styles.card,
          {
            // backgroundColor: isDark ? "#0f0f0f" : "#fff",
            borderColor: isDark ? "#262626" : "#e5e5e5",
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>
              {tournament?.name || "No Name"}
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              {tournament?.course?.name || "No Course"}
            </ThemedText>
          </View>

          {/* MORE MENU */}
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </Pressable>
        </View>

        {/* DATES */}
        <View style={styles.dateRow}>
          <View>
            <ThemedText style={styles.label}>Start</ThemedText>
            <ThemedText style={styles.value}>
              {formatDate(tournament?.startDate)}
            </ThemedText>
          </View>

          <View>
            <ThemedText style={styles.label}>End</ThemedText>
            <ThemedText style={styles.value}>
              {formatDate(tournament?.endDate)}
            </ThemedText>
          </View>
        </View>

        {/* PRIMARY ACTIONS */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              setIsEditMode(true);
              setEditingCourse(tournament);
              setModalVisible(true);
            }}
            style={styles.actionBtn}
            android_ripple={{ color: "#ddd" }}
          >
            <Ionicons name="create-outline" size={22} color="#6b7280" />
            <ThemedText style={styles.actionText}>Edit</ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            android_ripple={{ color: "#ddd" }}
            onPress={() => routePlayersPage(tournament?.tournamentId, tournament?.name)}
          >
            <Ionicons name="person-add-outline" size={22} color="#3b82f6" />
            <ThemedText style={styles.actionText}>Manage</ThemedText>
          </Pressable>
        </View>
      </Box>

      {/* MODAL MENU */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <MenuItem
              icon="time-outline"
              label="History"
              color="#06b6d4"
              onPress={() => {
                setMenuVisible(false);
                routePage.push(
                  "/(drawer)/(admin)/(tabs)/tournaments/tournamentHistory",
                );
              }}
            />

            <MenuItem
              icon="stats-chart-outline"
              label="Leaderboard"
              color="#f59e0b"
              onPress={() => {
                setMenuVisible(false);
                routePage.push(
                  "/(drawer)/(admin)/(tabs)/tournaments/leaderboard",
                );
              }}
            />

            <MenuItem
              icon="trash-outline"
              label="Delete"
              color="#ef4444"
              onPress={() => {
                setMenuVisible(false);
                console.log("Delete clicked");
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // overlay: {
  //   flex: 1,
  //   justifyContent: "center",
  //   backgroundColor: "rgba(0,0,0,0.4)",
  //   padding: 20,
  // },

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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,

    // shadowColor: "#000",
    // shadowOpacity: 0.08,
    // shadowRadius: 6,
    // elevation: 3,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },

  iconBtn: {
    padding: 6,
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  label: {
    fontSize: 12,
    opacity: 0.5,
  },

  value: {
    fontSize: 14,
    fontWeight: "500",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
    paddingTop: 10,
  },

  actionBtn: {
    alignItems: "center",
    gap: 2,
  },

  actionText: {
    fontSize: 12,
  },

  /* MODAL */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 20,
  },

  menu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },

  menuText: {
    fontSize: 14,
  },
});
