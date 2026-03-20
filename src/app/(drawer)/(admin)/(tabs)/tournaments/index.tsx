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

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { Text } from "@/components/text";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import {
  createTournament,
  deleteTournament,
  getTournaments,
  updateTournament,
} from "@/api/admin/tournaments";
import { getCourse } from "@/api/admin/courses";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema } from "@/schema/adminSchemas";

export default function adminTournamentsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [modalVisible, setModalVisible] = useState(false);
  // const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  // const [selectedTeeColor, setSelectedTeeColor] = useState<string | null>(null);
  // const [selectedScoringType, setSelectedScoringType] = useState<string | null>(
  //   null,
  // );
  // const [date, setDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [tournaments, setTournaments] = useState<any>([]);
  const [courses, setCourses] = useState<any>([]);
  // const [scoringTypes, setScoringTypes] = useState<any>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      courseId: [],
      teeColor: [],
      scoringType: [],
      startDate: null,
      endDate: null,
      description: "",
    },
  });

  const scoringMap: any = {
    3: "stableford",
    1: "netScore",
  };
  // 👇 ADD HERE
  const scoringTypes = [
    { label: "Stableford", value: 3 },
    { label: "Net Score", value: 1 },
  ];

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const onSubmit = (data: any) => {
    const tournamentData = {
      name: data.name,

      courseId: data.courseId[0], // ✅ array → single

      teeBoxId: data.teeColor[0], // ✅ rename

      scoringType: scoringMap[data.scoringType[0]],

      startDate: formatDate(data.startDate),
      endDate: formatDate(data.endDate),

      description: data.description || "",

      creatorId: 1, // ⚠️ replace with logged-in user later
    };

    if (isEditMode) {
      console.log("UPDATE API", tournamentData);
      updateTournament(editingCourse.tournamentId, tournamentData);
    } else {
      console.log("CREATE API", tournamentData);
      createTournament(tournamentData);
    }

    setModalVisible(false);
  };

  // const scoringTypes = [
  //   { label: "Stableford", value: 3 },
  //   { label: "Net Score", value: 1 },
  // ];

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
      // setScoringTypes(formattedScoringType);
      // console.log("Tournaments:", tournaments);
      // console.log("Formatted Courses:", formattedCourses);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!isEditMode || !editingCourse || !editingCourse.name) return;

    reset({
      name: editingCourse.name || "",
      courseId: [editingCourse.course?.courseId],
      teeColor: [Number(editingCourse.teeColor)],

      scoringType: [Number(editingCourse.scoringType)],

      startDate: editingCourse.startDate
        ? new Date(editingCourse.startDate)
        : null,

      endDate: editingCourse.endDate ? new Date(editingCourse.endDate) : null,
    });
  }, [isEditMode, editingCourse, courses, scoringTypes]);

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
              reset({
                name: "",
                courseId: [],
                teeColor: [],
                scoringType: [],
                startDate: null,
                endDate: null,
              });
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
                isEditMode={isEditMode}
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
        onRequestClose={() => {
          setModalVisible(false);
          reset();
          setIsEditMode(false);
          setEditingCourse(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <HStack className="justify-between items-center mb-4">
              <ThemedText style={{ fontSize: 17, fontWeight: "700" }}>
                {isEditMode ? "Edit Tournament" : "Create Tournament"}
              </ThemedText>

              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  reset();
                  setIsEditMode(false);
                  setEditingCourse(null);
                }}
              >
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack className="gap-3">
                <VStack className="gap-1">
                  {/* <Text>Tournament Name</Text> */}
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="Enter Tournament Name"
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  {errors.name && (
                    <Text style={{ color: "red" }}>*{errors.name.message}</Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  {/* <Text>Course</Text> */}
                  <Controller
                    control={control}
                    name="courseId"
                    render={({ field: { onChange, value } }) => (
                      <Dropdown
                        style={styles.input}
                        data={courses}
                        labelField="label"
                        valueField="value"
                        placeholder="Select course"
                        value={value?.[0]}
                        onChange={(item) => onChange([item.value])}
                      />
                    )}
                  />
                  {errors.courseId && (
                    <Text style={{ color: "red" }}>
                      *{errors.courseId.message}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="teeColor"
                    render={({ field: { onChange, value } }) => (
                      <Dropdown
                        style={styles.input}
                        data={[
                          { label: "red", value: "1" },
                          { label: "blue", value: "2" },
                          { label: "black", value: "3" },
                          { label: "white", value: "4" },
                          { label: "gold", value: "5" },
                          { label: "green", value: "6" },
                          { label: "silver", value: "7" },
                        ]}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Tee Box"
                        value={value?.[0]}
                        onChange={(item) => onChange([Number(item.value)])}
                      />
                    )}
                  />
                  {errors.teeColor && (
                    <Text style={{ color: "red" }}>
                      *{errors.teeColor.message}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  {/* <Text>Scoring Type</Text> */}

                  <Controller
                    control={control}
                    name="scoringType"
                    render={({ field: { onChange, value } }) => (
                      <Dropdown
                        style={styles.input}
                        data={scoringTypes}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Scoring Type"
                        value={value?.[0]}
                        onChange={(item) => onChange([item.value])}
                      />
                    )}
                  />
                  {errors.scoringType && (
                    <Text style={{ color: "red" }}>
                      *{errors.scoringType.message}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  {/* <Text>Start Date</Text> */}
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Pressable
                          onPress={() => setShowStartPicker(true)}
                          style={styles.input}
                        >
                          <Text>
                            {value
                              ? value?.toDateString()
                              : "Select start Date"}
                          </Text>
                        </Pressable>

                        {showStartPicker && (
                          <DateTimePicker
                            value={value || new Date()}
                            mode="date"
                            maximumDate={watch("endDate") || undefined} // ✅ restrict
                            onChange={(e, selectedDate) => {
                              setShowStartPicker(false);
                              if (selectedDate) onChange(selectedDate);
                            }}
                          />
                        )}
                      </>
                    )}
                  />
                  {errors.startDate && (
                    <Text style={{ color: "red" }}>
                      *{errors.startDate.message}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  {/* <Text>End Date</Text> */}
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Pressable
                          onPress={() => setShowEndPicker(true)}
                          style={styles.input}
                        >
                          <Text>
                            {value ? value?.toDateString() : "Select End Date"}
                          </Text>
                        </Pressable>

                        {showEndPicker && (
                          <DateTimePicker
                            value={value || new Date()}
                            mode="date"
                            minimumDate={watch("startDate") || new Date()} // ✅ restrict
                            onChange={(e, selectedDate) => {
                              setShowEndPicker(false);
                              if (selectedDate) onChange(selectedDate);
                            }}
                          />
                        )}
                      </>
                    )}
                  />
                  {errors.endDate && (
                    <Text style={{ color: "red" }}>
                      *{errors.endDate.message}
                    </Text>
                  )}
                </VStack>
                <VStack className="gap-1">
                  {/* <Text>Description</Text> */}
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="Optional Description"
                        multiline
                        numberOfLines={3}
                        style={styles.textArea}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </VStack>
              </VStack>
            </ScrollView>

            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  reset();
                  setIsEditMode(false);
                  setEditingCourse(null);
                }}
              >
                <ThemedText style={{ color: "#374151" }}>Cancel</ThemedText>
              </Pressable>

              <Pressable
                style={styles.createButton}
                onPress={handleSubmit(onSubmit)}
              >
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
    routePage.push(
      `/tournaments/managePlayers?tournamentId=${tournamentId}&tournamentName=${tournamentName}`,
    );
  }

  function routeTournamentHistory(
    tournamentId: string,
    tournamentName: string,
  ) {
    console.log(tournamentId);
    routePage.push(
      `/tournaments/tournamentHistory?tournamentId=${tournamentId}&tournamentName=${tournamentName}`,
    );
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

  // const onSubmit = (data: any) => {
  //   if (isEditMode) {
  //     console.log("UPDATE API", data);
  //   } else {
  //     console.log("CREATE API", data);
  //   }

  //   setModalVisible(false);
  // };
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
            <ThemedText style={[styles.actionText, { color: "#6b7280" }]}>
              Edit
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            android_ripple={{ color: "#ddd" }}
            onPress={() =>
              routePlayersPage(tournament?.tournamentId, tournament?.name)
            }
          >
            <Ionicons name="person-add-outline" size={22} color="#3b82f6" />
            <ThemedText style={[styles.actionText, { color: "#3b82f6" }]}>
              Manage
            </ThemedText>
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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                routeTournamentHistory(
                  tournament?.tournamentId,
                  tournament?.name,
                );
              }}
            >
              <Ionicons name="time-outline" size={20} color="#06b6d4" />
              <ThemedText style={[styles.menuText, { color: "#000" }]}>
                History
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                routePage.push(
                  `/(drawer)/(admin)/(tabs)/tournaments/leaderboard?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}&teeboxId=${tournament?.teeBox?.teeBoxId}`,
                );
              }}
            >
              <Ionicons name="stats-chart-outline" size={20} color="#f59e0b" />
              <ThemedText style={[styles.menuText, { color: "#000" }]}>
                Leaderboard
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                deleteTournament(tournament?.tournamentId);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <ThemedText style={[styles.menuText, { color: "#000" }]}>
                Delete
              </ThemedText>
            </TouchableOpacity>
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
