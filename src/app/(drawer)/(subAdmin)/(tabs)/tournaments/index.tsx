import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
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
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";

import {
  createTournament,
  deleteTournament,
  getSubAdminTournaments,
  updateTournament,
  getSubAdminCourses,
  getCourseDetails,
} from "@/api/subAdmin/tournaments";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SubAdminTournamentsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [tournaments, setTournaments] = useState<any>([]);
  const [courses, setCourses] = useState<any>([]);
  const [teeBox, setTeeBox] = useState<any>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [userId, setUserId] = useState<any>("");

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
      startDate: null as Date | null,
      endDate: null as Date | null,
      description: "",
    },
  });

  const watchedCourseId = watch("courseId");

  const scoringMap: any = {
    1: "standard",
    2: "stableford",
    3: "excluded",
    4: "double-peoria",
    5: "double-peoria-net",
    6: "double-peoria-stableford",
  };

  const reverseScoringMap = (type: string) => {
    for (const [key, value] of Object.entries(scoringMap)) {
      if (value === type) return Number(key);
    }
    return 1;
  };

  useEffect(() => {
    const courseId = watchedCourseId?.[0];
    if (!courseId) {
      setTeeBox([]);
      return;
    }

    const fetchTeeBoxes = async () => {
      try {
        const details = await getCourseDetails(courseId);
        if (details && details.teeBoxes) {
          setTeeBox(
            details.teeBoxes.map((b: any) => ({
              label: `${b.name} (${b.color})`,
              value: b.teeBoxId,
            })),
          );
        } else {
          setTeeBox([]);
        }
      } catch (err) {
        console.error("Error fetching course teeboxes", err);
        setTeeBox([]);
      }
    };

    fetchTeeBoxes();
  }, [watchedCourseId?.[0]]);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const onSubmit = async (data: any) => {
    try {
      const tournamentData = {
        name: data.name,
        courseId: data.courseId[0],
        teeBoxId: data.teeColor[0],
        scoringType: scoringMap[data.scoringType[0]] || "standard",
        startDate: formatDate(data.startDate),
        endDate: formatDate(data.endDate),
        description: data.description || "",
        creatorId: Number(userId) || 1,
      };

      if (isEditMode) {
        await updateTournament(editingCourse.tournamentId, tournamentData);
      } else {
        await createTournament(tournamentData);
      }

      await fetchTournaments();

      Toast.show({
        type: "success",
        text1: isEditMode
          ? "Tournament updated successfully"
          : "Tournament created successfully",
      });
      setModalVisible(false);
    } catch (error) {
      console.error("Submission error:", error);
      Toast.show({
        type: "error",
        text1: isEditMode
          ? "Tournament update failed"
          : "Tournament creation failed",
      });
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteTournament(id);
      await fetchTournaments();
      Toast.show({
        type: "success",
        text1: "Tournament deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting tournament:", error);
      Toast.show({
        type: "error",
        text1: "Tournament deletion failed",
      });
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);

      const id = await AsyncStorage.getItem("userId");
      if (id) setUserId(id);

      const data = await getSubAdminTournaments();
      const courseData = await getSubAdminCourses();

      const formattedCourses = courseData.map((item: any) => ({
        label: item.name,
        value: item.courseId !== undefined ? item.courseId : item.coursed,
      }));

      setTournaments(data);
      setCourses(formattedCourses);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTournaments();
    }, []),
  );

  useEffect(() => {
    if (!isEditMode || !editingCourse || !editingCourse.name) return;

    reset({
      name: editingCourse.name || "",
      courseId: [editingCourse.courseId || editingCourse.course?.courseId],
      teeColor: [
        Number(editingCourse.teeBoxId || editingCourse.teeBox?.teeBoxId),
      ],
      scoringType: [reverseScoringMap(editingCourse.scoringType)],
      startDate: editingCourse.startDate
        ? new Date(editingCourse.startDate)
        : null,
      endDate: editingCourse.endDate ? new Date(editingCourse.endDate) : null,
      description: editingCourse.description || "",
    });
  }, [isEditMode, editingCourse, courses]);

  const TournamentCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderColor: isDark ? "#262626" : "#e5e5e5",
        }}
      >
        <HStack style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Skeleton isDark={isDark} height={16} width="60%" />
            <Skeleton
              isDark={isDark}
              height={12}
              width="40%"
              style={{ marginTop: 6 }}
            />
          </View>
          <Skeleton isDark={isDark} height={20} width={20} />
        </HStack>
        <HStack style={{ justifyContent: "space-between", marginTop: 12 }}>
          <VStack>
            <Skeleton isDark={isDark} height={10} width={40} />
            <Skeleton
              isDark={isDark}
              height={12}
              width={80}
              style={{ marginTop: 4 }}
            />
          </VStack>
          <VStack>
            <Skeleton isDark={isDark} height={10} width={40} />
            <Skeleton
              isDark={isDark}
              height={12}
              width={80}
              style={{ marginTop: 4 }}
            />
          </VStack>
        </HStack>
        <HStack
          style={{
            justifyContent: "space-around",
            marginTop: 16,
            borderTopWidth: 1,
            borderColor: isDark ? "#262626" : "#e5e5e5",
            paddingTop: 10,
          }}
        >
          <Skeleton isDark={isDark} height={14} width={50} />
          <Skeleton isDark={isDark} height={14} width={60} />
        </HStack>
      </Box>
    );
  };

  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        <Watermark />

        {/* Header */}
        <HStack className="justify-between items-center p-4 mt-2">
          <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>
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
                description: "",
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
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TournamentCardSkeleton key={i} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {tournaments.map((tournament: any) => (
                  <TournamentCard
                    key={tournament.tournamentId}
                    tournament={tournament}
                    onDelete={onDelete}
                    setIsEditMode={setIsEditMode}
                    setEditingCourse={setEditingCourse}
                    isEditMode={isEditMode}
                    setModalVisible={setModalVisible}
                    isDark={isDark}
                    userId={userId}
                  />
                ))}
              </>
            )}
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
        <View
          style={[
            styles.overlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" },
          ]}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#121212" : "#fff" },
            ]}
          >
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
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "white" : "black"}
                />
              </Pressable>
            </HStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack className="gap-3">
                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="Enter Tournament Name"
                        placeholderTextColor={isDark ? "#777" : "#9ca3af"}
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#9ca3af",
                            color: isDark ? "white" : "black",
                          },
                        ]}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  {errors.name && (
                    <Text style={{ color: "red" }}>
                      *{errors.name.message as string}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="courseId"
                    render={({ field: { onChange, value } }) => (
                      <Dropdown
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#9ca3af",
                          },
                        ]}
                        placeholderStyle={{
                          color: isDark ? "#777" : "#9ca3af",
                        }}
                        selectedTextStyle={{
                          color: isDark ? "white" : "black",
                        }}
                        containerStyle={{
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
                          borderColor: isDark ? "#333" : "#9ca3af",
                        }}
                        itemTextStyle={{ color: isDark ? "white" : "black" }}
                        activeColor={isDark ? "#333" : "#f0f0f0"}
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
                      *{errors.courseId.message as string}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="teeColor"
                    render={({ field: { onChange, value } }) => (
                      <Dropdown
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#9ca3af",
                          },
                        ]}
                        placeholderStyle={{
                          color: isDark ? "#777" : "#9ca3af",
                        }}
                        selectedTextStyle={{
                          color: isDark ? "white" : "black",
                        }}
                        containerStyle={{
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
                          borderColor: isDark ? "#333" : "#9ca3af",
                        }}
                        itemTextStyle={{ color: isDark ? "white" : "black" }}
                        activeColor={isDark ? "#333" : "#f0f0f0"}
                        data={teeBox}
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
                      *{errors.teeColor.message as string}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="scoringType"
                    render={({ field: { onChange, value } }) => (
                      <Dropdown
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#9ca3af",
                          },
                        ]}
                        placeholderStyle={{
                          color: isDark ? "#777" : "#9ca3af",
                        }}
                        selectedTextStyle={{
                          color: isDark ? "white" : "black",
                        }}
                        containerStyle={{
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
                          borderColor: isDark ? "#333" : "#9ca3af",
                        }}
                        itemTextStyle={{ color: isDark ? "white" : "black" }}
                        activeColor={isDark ? "#333" : "#f0f0f0"}
                        data={[
                          { label: "Standard (Gross/Net)", value: 1 },
                          { label: "Stableford", value: 2 },
                          { label: "Excluded (Practice)", value: 3 },
                          { label: "Double Peoria", value: 4 },
                          { label: "Double Peoria Net", value: 5 },
                          { label: "Double Peoria Stableford", value: 6 },
                        ]}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Scoring Type"
                        value={value?.[0]}
                        onChange={(item) => onChange([Number(item.value)])}
                      />
                    )}
                  />
                  {errors.scoringType && (
                    <Text style={{ color: "red" }}>
                      *
                      {(errors.scoringType.message as string) ||
                        (errors.scoringType as any)?.[0]?.message ||
                        "Invalid input"}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Pressable
                          onPress={() => setShowStartPicker(true)}
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? "#1a1a1a" : "#fff",
                              borderColor: isDark ? "#333" : "#9ca3af",
                            },
                          ]}
                        >
                          <Text style={{ color: isDark ? "white" : "black" }}>
                            {value
                              ? value?.toDateString()
                              : "Select Start Date"}
                          </Text>
                        </Pressable>

                        {showStartPicker && (
                          <DateTimePicker
                            value={value || new Date()}
                            mode="date"
                            maximumDate={watch("endDate") || undefined}
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
                      *{errors.startDate.message as string}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Pressable
                          onPress={() => setShowEndPicker(true)}
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? "#1a1a1a" : "#fff",
                              borderColor: isDark ? "#333" : "#9ca3af",
                            },
                          ]}
                        >
                          <Text style={{ color: isDark ? "white" : "black" }}>
                            {value ? value?.toDateString() : "Select End Date"}
                          </Text>
                        </Pressable>

                        {showEndPicker && (
                          <DateTimePicker
                            value={value || new Date()}
                            mode="date"
                            minimumDate={watch("startDate") || new Date()}
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
                      *{errors.endDate.message as string}
                    </Text>
                  )}
                </VStack>

                <VStack className="gap-1">
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="Optional Description"
                        placeholderTextColor={isDark ? "#777" : "#9ca3af"}
                        multiline
                        numberOfLines={3}
                        style={[
                          styles.textArea,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#9ca3af",
                            color: isDark ? "white" : "black",
                          },
                        ]}
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
                style={[
                  styles.cancelButton,
                  { borderColor: isDark ? "#333" : "#d1d5db" },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  reset();
                  setIsEditMode(false);
                  setEditingCourse(null);
                }}
              >
                <ThemedText style={{ color: isDark ? "#ccc" : "#374151" }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.createButton}
                onPress={handleSubmit(onSubmit)}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  {isEditMode ? "Update" : "Create"}
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
  onDelete,
  setIsEditMode,
  setEditingCourse,
  setModalVisible,
  userId,
}: any) {
  const routePage = useRouter();
  // useEffect(() => {
  //   console.log("cuserId", typeof(cuserId));
  // }, []);
  const [menuVisible, setMenuVisible] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      {userId == tournament?.creatorId && (
        <>
          <Box
            style={[
              styles.card,
              {
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
                onPress={() => {
                  routePage.push(
                    `/(drawer)/(subAdmin)/(tabs)/tournaments/manageRoaster?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}`,
                  );
                }}
              >
                <Ionicons name="person-add-outline" size={22} color="#3b82f6" />
                <ThemedText style={[styles.actionText, { color: "#3b82f6" }]}>
                  Roaster
                </ThemedText>
              </Pressable>
            </View>
          </Box>
          <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <Pressable
              style={styles.overlay}
              onPress={() => setMenuVisible(false)}
            >
              <View
                style={[
                  styles.menu,
                  {
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    borderColor: isDark ? "#333" : "#e5e5e5",
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    routePage.push(
                      `/(drawer)/(subAdmin)/(tabs)/tournaments/tournamentHistory?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}`,
                    );
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#06b6d4" />
                  <ThemedText
                    style={[
                      styles.menuText,
                      { color: isDark ? "white" : "#000" },
                    ]}
                  >
                    History
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    routePage.push(
                      `/(drawer)/(subAdmin)/(tabs)/tournaments/leaderboard?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}&teeboxId=${tournament?.teeBox?.teeBoxId || tournament?.teeBoxId}&scoringType=${tournament?.scoringType}`,
                    );
                  }}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={20}
                    color="#f59e0b"
                  />
                  <ThemedText
                    style={[
                      styles.menuText,
                      { color: isDark ? "white" : "#000" },
                    ]}
                  >
                    Leaderboard
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete(tournament?.tournamentId);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <ThemedText
                    style={[
                      styles.menuText,
                      { color: isDark ? "white" : "#000" },
                    ]}
                  >
                    Delete
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
