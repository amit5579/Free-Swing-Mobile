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
import { Divider } from "@/components/divider";

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

  // ── Colors ──
  const colors = {
    bg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)",
    cardBorder: isDark ? "#1e293b" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    dimText: isDark ? "#64748b" : "#94a3b8",
    accent: "#84cc16",
    accentSoft: isDark ? "rgba(132,204,22,0.15)" : "rgba(132,204,22,0.1)",
    divider: isDark ? "#1e293b" : "#f1f5f9",
    iconBg: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.8)",
    modalBg: isDark ? "#1e293b" : "#ffffff",
    inputBg: isDark ? "#0f172a" : "#f8fafc",
    inputBorder: isDark ? "#334155" : "#cbd5e1",
  };

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
          setTeeBox(details.teeBoxes);
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
        const updatedData = {
          courseId: data.courseId[0],
          endDate: data.endDate,
          name: data.name,
          scoringType: scoringMap[data.scoringType[0]] || "standard",
          startDate: formatDate(data.startDate),
          teeBoxId: data.teeColor[0],
          tournamentId: editingCourse.tournamentId,
        };
        await updateTournament(editingCourse.tournamentId, updatedData);
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
      setModalVisible(false);
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

      setTournaments(data.filter((t: any) => t.creatorId == id));
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

  const handleCreate = () => {
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
          onPress={handleCreate}
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
      <ThemedView style={{ flex: 1 }}>
        <Watermark />
        {renderHeader()}

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
                        backgroundColor: colors.iconBg,
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
                        color: colors.text,
                        marginBottom: 6,
                      }}
                    >
                      No Tournaments Found
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        color: colors.subText,
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
                      userId={userId}
                    />
                  ))
                )}
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
                        data={teeBox.map((item: any) => ({
                          ...item,
                          label: `${item.name} (Slope:${item.slope} / Rating:${item.rating})`,
                          value: item.teeBoxId,
                        }))}
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
                          { label: "Net Score (Include Par 3)", value: 1 },
                          { label: "Net Score (Exclude Par 3)", value: 2 },
                          { label: "Stableford", value: 3 },
                          { label: "Double Peoria Gross / Net", value: 4 },
                          { label: "Double Peoria Stableford", value: 5 },
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

        <Divider className="my-2 opacity-50" />

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
            onPress={() => {
              routePage.push(
                `/(drawer)/(subAdmin)/(tabs)/tournaments/manageRoaster?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}`,
              );
            }}
            className="flex-1 flex-row justify-center items-center gap-2 bg-[#8bc34a] py-2.5 rounded-xl shadow-sm"
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Ionicons name="person-add" size={18} color="white" />
            <ThemedText
              style={{ color: "white", fontWeight: "700", fontSize: 13 }}
            >
              Roaster
            </ThemedText>
          </Pressable>
        </HStack>
      </Box>
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
                routePage.push(
                  `/(drawer)/(subAdmin)/(tabs)/tournaments/tournamentHistory?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}`,
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
                  `/(drawer)/(subAdmin)/(tabs)/tournaments/leaderboard?tournamentId=${tournament?.tournamentId}&tournamentName=${tournament?.name}&teeboxId=${tournament?.teeBox?.teeBoxId || tournament?.teeBoxId}&scoringType=${tournament?.scoringType}&secretHoles=${tournament?.secretHoles}`,
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
    fontWeight: "700",
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
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(139, 195, 74, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
