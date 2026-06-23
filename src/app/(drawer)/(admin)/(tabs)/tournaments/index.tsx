import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { Badge, BadgeText } from "@/components/badge";
import { Divider } from "@/components/divider";
import {
  createTournament,
  deleteTournament,
  getTournaments,
  updateTournament,
} from "@/api/modules/admin/tournaments.api";
import { getCourse, getTeeBox } from "@/api/modules/admin/courses.api";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function adminTournamentsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [tournaments, setTournaments] = useState<any>([]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTournaments();
    setRefreshing(false);
  }, []);
  const [courses, setCourses] = useState<any>([]);
  const [teeBox, setTeeBox] = useState<any>([]);
  // const [scoringTypes, setScoringTypes] = useState<any>([]);
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
      startDate: null,
      endDate: null,
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

  useEffect(() => {
    const courseId = watchedCourseId?.[0];
    if (!courseId) {
      setTeeBox([]);
      return;
    }
    getTeeBox(String(courseId)).then((boxes: any[]) => {
      setTeeBox(boxes);
    });
  }, [watchedCourseId?.[0]]);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const onSubmit = async (data: any) => {
    try {
      const tournamentData = {
        courseId: data.courseId[0],
        creatorId: Number(userId) || 1,
        description: data.description || "",
        endDate: formatDate(data.endDate),
        name: data.name,
        scoringType: scoringMap[data.scoringType[0]] || "include",
        startDate: formatDate(data.startDate),
        teeBoxId: data.teeColor[0],
      };

      if (isEditMode) {
        const updatedData = {
          courseId: data.courseId[0],
          endDate: formatDate(data.endDate),
          name: data.name,
          scoringType: scoringMap[data.scoringType[0]] || "standard",
          startDate: formatDate(data.startDate),
          teeBoxId: data.teeColor[0],
          tournamentId: editingCourse.tournamentId,
          description: data.description || "",
        };
        // console.log("UPDATE API", tournamentData);
        await updateTournament(updatedData, editingCourse.tournamentId);
      } else {
        // console.log("CREATE API", tournamentData);
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
      setModalVisible(false);
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
  const fetchTournaments = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const id = await AsyncStorage.getItem("userId");
      if (id) setUserId(id);
      const data = await getTournaments();
      const courseData = await getCourse();

      // 🔥 transform courses here
      const formattedCourses = courseData.map((item: any) => ({
        label: item.name,
        value: item.courseId,
      }));

      setTournaments(data);
      setCourses(formattedCourses);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTournaments(true);
      // 🔥 refetch when screen is focused again
    }, []),
  );

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
  }, [isEditMode, editingCourse, courses]);

  const TournamentCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          borderColor: isDark ? "#262626" : "#e5e5e5",
        }}
      >
        {/* HEADER */}
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

        {/* DATES */}
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

        {/* ACTIONS */}
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

  const renderHeader = () => (
    <HStack
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      {/* 🧠 TITLE */}
      <ThemedText
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: isDark ? "#fff" : "#020617",
        }}
      >
        Tournaments
      </ThemedText>

      {/* ➕ CREATE BUTTON */}
      <Pressable
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
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: "#84cc16",
        }}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
      >
        <Ionicons name="add" size={18} color="#fff" />

        <ThemedText
          style={{
            color: "#fff",
            fontWeight: "600",
            fontSize: 13,
            marginLeft: 6,
          }}
        >
          Create
        </ThemedText>
      </Pressable>
    </HStack>
  );

  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        <Watermark />

        {/* Header */}
        {renderHeader()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8BC34A"]}
              tintColor="#8BC34A"
            />
          }
        >
          <VStack className="px-4 pb-20 mt-4 gap-4">
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TournamentCardSkeleton key={i} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {tournaments.length == 0 ? (
                  <VStack
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 60,
                      paddingHorizontal: 24,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: isDark
                          ? "rgba(30,41,59,0.5)"
                          : "rgba(241,245,249,0.8)",
                        padding: 18,
                        borderRadius: 50,
                        marginBottom: 16,
                      }}
                    >
                      <Ionicons name="trophy" size={32} color={"#8bc34a"} />
                    </View>
                    <ThemedText
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: isDark ? "#f1f5f9" : "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      No Tournaments Found
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        color: isDark ? "#94a3b8" : "#64748b",
                        textAlign: "center",
                        lineHeight: 20,
                      }}
                    >
                      You haven't created any tournaments yet. Tap "Create
                      Tournament" to start managing your competitions.
                    </ThemedText>
                  </VStack>
                ) : (
                  tournaments.map((tournament: any) => (
                    <TournamentCard
                      key={tournament.tournamentId}
                      tournament={tournament}
                      onDelete={onDelete}
                      setIsEditMode={setIsEditMode}
                      setEditingCourse={setEditingCourse}
                      isEditMode={isEditMode}
                      setModalVisible={setModalVisible}
                      isDark={isDark}
                    />
                  ))
                )}
              </>
            )}
          </VStack>
        </ScrollView>
      </View>

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
                  {/* <Text>Tournament Name</Text> */}
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
                        mode="modal"
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
                        data={teeBox.map((item: any) => ({
                          ...item,
                          label: `${item.name}(Slope:${item.slope} / Rating:${item.rating})`,
                          value: item.teeBoxId,
                        }))}
                        labelField="label"
                        valueField="value"
                        mode="modal"
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
                          { label: "Net Score (Inclued Par 3)", value: 1 },
                          { label: "Net Score (Exclude Par 3)", value: 3 },
                          { label: "Stableford", value: 2 },
                          { label: "DP Gross / Net", value: 4 },
                          { label: "DP Stableford", value: 5 },
                        ]}
                        labelField="label"
                        valueField="value"
                        mode="modal"
                        placeholder="Select Scoring Type"
                        value={value?.[0]}
                        onChange={(item) => onChange([Number(item.value)])}
                      />
                    )}
                  />
                  {errors.scoringType && (
                    <Text style={{ color: "red" }}>
                      *
                      {errors.scoringType.message ||
                        (errors.scoringType as any)?.[0]?.message ||
                        "Invalid input"}
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
  onDelete,
  setIsEditMode,
  setEditingCourse,
  setModalVisible,
}: any) {
  const routePage = useRouter();

  function routePlayersPage(tournamentId: string, tournamentName: string) {
    // console.log(tournamentId);
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

  return (
    <>
      <Box
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
          },
        ]}
      >
        {/* Header Section */}
        <HStack className="justify-between items-start mb-2">
          <VStack style={{ flex: 1 }}>
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 2,
              }}
            >
              {tournament?.name || "No Name"}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 13,
                opacity: 0.6,
                fontWeight: "600",
                color: "#8bc34a",
              }}
            >
              {tournament?.course?.name || "No Course"}
            </ThemedText>
          </VStack>

          <HStack className="items-center gap-2">
            <View style={styles.iconContainer}>
              <Ionicons name="trophy" size={20} color="#8bc34a" />
            </View>
            <Pressable
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [
                styles.iconBtn,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Ionicons name="ellipsis-vertical" size={22} color="#6b7280" />
            </Pressable>
          </HStack>
        </HStack>

        {/* Info Row: Dates */}
        <HStack
          className="p-3 rounded-xl mb-4 mt-2"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)",
            justifyContent: "space-between",
          }}
        >
          <HStack className="items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color="#8bc34a" />
            <VStack>
              <ThemedText style={{ fontSize: 10, opacity: 0.5 }}>
                START
              </ThemedText>
              <ThemedText style={{ fontSize: 12, fontWeight: "600" }}>
                {formatDate(tournament?.startDate)}
              </ThemedText>
            </VStack>
          </HStack>

          <HStack className="items-center gap-2">
            <Ionicons name="time-outline" size={16} color="#ef4444" />
            <VStack>
              <ThemedText style={{ fontSize: 10, opacity: 0.5 }}>
                END
              </ThemedText>
              <ThemedText style={{ fontSize: 12, fontWeight: "600" }}>
                {formatDate(tournament?.endDate)}
              </ThemedText>
            </VStack>
          </HStack>
        </HStack>
        <Divider
          style={{
            marginVertical: 4,
            backgroundColor: isDark ? "#333" : "#F0F0F0",
          }}
        />

        {/* Primary Actions Section */}
        <HStack className="gap-2 mt-2">
          <Pressable
            onPress={() => {
              setIsEditMode(true);
              setEditingCourse(tournament);
              setModalVisible(true);
            }}
            className="flex-1 flex-row justify-center items-center gap-2 border border-slate-400 py-2.5 rounded-xl"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name="create"
              size={18}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
            <ThemedText
              style={{
                color: isDark ? "#94a3b8" : "#64748b",
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              Edit
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() =>
              routePlayersPage(tournament?.tournamentId, tournament?.name)
            }
            className="flex-1 flex-row justify-center items-center gap-2 bg-[#8bc34a] py-2.5 rounded-xl shadow-sm"
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Ionicons name="person-add" size={18} color="white" />
            <ThemedText
              style={{ color: "white", fontWeight: "700", fontSize: 13 }}
            >
              Manage
            </ThemedText>
          </Pressable>
        </HStack>
      </Box>

      {/* MODAL MENU */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
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
                routeTournamentHistory(
                  tournament?.tournamentId,
                  tournament?.name,
                );
              }}
            >
              <Ionicons name="time" size={20} color="#06b6d4" />
              <ThemedText
                style={[styles.menuText, { color: isDark ? "white" : "#000" }]}
              >
                History
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                routePage.push(
                  `/(drawer)/(admin)/(tabs)/tournaments/leaderboard?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}&teeboxId=${tournament?.teeBox?.teeBoxId}&scoringType=${tournament?.scoringType}&secretHoles=${tournament?.secretHoles}`,
                );
              }}
            >
              <Ionicons name="stats-chart" size={20} color="#f59e0b" />
              <ThemedText
                style={[styles.menuText, { color: isDark ? "white" : "#000" }]}
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
              <Ionicons name="trash" size={20} color="#ef4444" />
              <ThemedText
                style={[styles.menuText, { color: isDark ? "white" : "#000" }]}
              >
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
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(139, 195, 74, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
