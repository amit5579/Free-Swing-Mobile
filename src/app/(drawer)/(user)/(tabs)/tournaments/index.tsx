import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  View,
  Text,
  TextInput,
  useColorScheme,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { MaxContentWidth, Spacing } from "@/constants/theme";
import { HStack } from "@/components/hstack";
import { Ionicons } from "@expo/vector-icons";
import Watermark from "@/components/watermark";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Dropdown } from "react-native-element-dropdown";
import { useRouter } from "expo-router";
import {
  createMiniTournament,
  getAllTournaments,
} from "@/api/admin/tournaments";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCourse } from "@/api/admin/courses";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema } from "@/schema/adminSchemas";
import { userTournamentSchema } from "@/schema/userSchemas";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";

export default function TournamentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [isModalVisible, setModalVisible] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tModalVisible, setTModalVisible] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [tournaments, setTournaments] = useState<any>([]);
  const [userId, setUserId] = useState<any>("");

  const [loading, setLoading] = useState(true);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userTournamentSchema),
    defaultValues: {
      name: "",
      courseId: 0,
      scoringType: "",
      teeBox: 0,
      startDate: null,
      endDate: null,
      maxPlayers: 0,
      description: "",
    },
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);

      const response = await getAllTournaments();
      const gc = await getCourse();
      setTournaments(response);
      setCourses(gc);
    } catch (error) {
      console.error("Fetching tournaments Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // console.log(courses);

    const getUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };

    getUserId();
    fetchTournaments();
  }, []);


  useFocusEffect(
  React.useCallback(() => {
        fetchTournaments();
 // 🔥 refetch when screen is focused again
  }, [])
);


  //  const userId = AsyncStorage.getItem("userId");
  // console.log("uuuuuuuuu",userId, "type:", typeof(userId));

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const onSubmit = (data: any) => {
    // console.log("FORM DATA:", data);
    setTModalVisible(false);
    const tournamentData = {
      description: "",
      endDate: formatDate(data.endDate),
      maxPlayers: data.maxPlayers,

      name: data.name,
      scoringType: data.scoringType,
      startDate: formatDate(data.startDate),
      teeBoxId: data.teeBox,

      courseId: data.courseId,
    };
    // console.log("FINAL PAYLOAD:", tournamentData);
    createMiniTournament(
      tournamentData.courseId,
      tournamentData.description,
      tournamentData.endDate,
      tournamentData.maxPlayers,
      tournamentData.name,
      tournamentData.scoringType,
      tournamentData.startDate,
      tournamentData.teeBoxId,
    );

    Toast.show({
      type: "success",
      text1: "Tournament created successfully",
    });

    fetchTournaments();
    reset();
    setModalVisible(false);
  };

  const TournamentCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: "#8bc34a",
        }}
      >
        {/* Title */}
        <Skeleton isDark={isDark} height={18} width="60%" />

        {/* Description */}
        <Skeleton
          isDark={isDark}
          height={12}
          width="90%"
          style={{ marginTop: 6 }}
        />

        {/* Dates */}
        <HStack className="justify-between mt-3">
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

        {/* Buttons */}
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 12 }}
        />
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 8 }}
        />
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 8 }}
        />
      </Box>
    );
  };

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
              Tournaments
            </ThemedText>

            <Pressable
              style={styles.createButton}
              onPress={() => setTModalVisible(true)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-outline" size={28} color="white" />
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Create Mini Tournament
              </ThemedText>
            </Pressable>
          </HStack>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TournamentCardSkeleton key={i} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {tournaments.map((tournament: any) => (
                  <React.Fragment key={tournament.tournamentId}>
                    <Box key={tournament.tournamentId} style={styles.card}>
                      <ThemedText style={styles.title}>
                        {tournament.name}
                      </ThemedText>

                      <ThemedText style={styles.description}>
                        {tournament.description}
                      </ThemedText>

                      {/* Dates */}

                      <HStack className="justify-between mt-2">
                        <VStack>
                          <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                            Start
                          </ThemedText>

                          <ThemedText>
                            {formatDateTime(tournament.startDate)}
                          </ThemedText>
                        </VStack>

                        <VStack>
                          <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                            End
                          </ThemedText>

                          <ThemedText>
                            {formatDateTime(tournament.endDate)}
                          </ThemedText>
                        </VStack>
                      </HStack>
                      {/* Leaderboard */}
                      <Pressable
                        onPress={() =>
                          routePage.push(
                            `/tournaments/leaderboardUser?tournamentId=${tournament.tournamentId}&tournamentName=${tournament.name}&teeboxId=${tournament.teeBoxId}&scoringType=${tournament.scoringType}`,
                          )
                        }
                        className="flex-row justify-center items-center gap-2 border border-[#f59e0b] p-2 rounded-lg"
                      >
                        <Ionicons
                          name="stats-chart-outline"
                          size={23}
                          color="#f59e0b"
                        />

                        <ThemedText style={styles.outlineButtonText2}>
                          View Leaderboard
                        </ThemedText>
                      </Pressable>

                      {tournament.isPlayed == true && (
                        <Pressable
                          onPress={() =>
                            routePage.push(
                              `/(drawer)/(user)/(tabs)/tournaments/tournamentHistory?tournamentId=${tournament.tournamentId}&tournamentName=${tournament.name}&teeBoxId=${tournament.teeBoxId}&scoringType=${tournament.scoringType}`,
                            )
                          }
                          className="flex-row justify-center items-center gap-2 border border-[#06b6d4] p-2 rounded-lg"
                        >
                          <Ionicons
                            name="time-outline"
                            size={23}
                            color="#06b6d4"
                          />

                          <ThemedText style={styles.outlineButtonText}>
                            My History
                          </ThemedText>
                        </Pressable>
                      )}

                      {/* Manage button */}
                      {userId === String(tournament.creatorId) && (
                        <Pressable
                          onPress={() =>
                            routePage.push(
                              `/tournaments/manageTournament?tournamentId=${tournament.tournamentId}&tournamentName=${tournament.name}`,
                            )
                          }
                          className="flex-row justify-center items-center gap-2 border border-[#0d6efd] p-2 rounded-lg"
                        >
                          <Ionicons
                            name="create-outline"
                            size={23}
                            color="#0d6efd"
                          />
                          <ThemedText style={styles.outlineButtonText3}>
                            Manage
                          </ThemedText>
                        </Pressable>
                      )}

                      {/* Play Button */}
                      {tournament.isPlayed ? (
                        ""
                      ) : (
                        <Pressable
                          onPress={() => setModalVisible(true)}
                          className="flex-row justify-center items-center gap-2  bg-[#8bc34a] p-2 rounded-lg"
                        >
                          <Ionicons name="play" size={23} color="white" />

                          <ThemedText style={styles.playText}>Play</ThemedText>
                        </Pressable>
                      )}
                    </Box>

                    {/* user agreement modal */}
                    <Modal
                      animationType="slide"
                      transparent
                      visible={isModalVisible}
                      onRequestClose={() => setModalVisible(false)}
                    >
                      <View
                        style={[
                          styles.overlay,
                          {
                            backgroundColor: isDark
                              ? "rgba(0,0,0,0.7)"
                              : "rgba(0,0,0,0.5)",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.modalContainer,
                            { backgroundColor: isDark ? "#121212" : "white" },
                          ]}
                        >
                          {/* HEADER */}
                          <HStack style={styles.header}>
                            <Text style={styles.headerTitle}>
                              IMPORTANT – LEGAL AGREEMENT
                            </Text>
                          </HStack>

                          {/* BASIC INFO */}
                          <VStack style={styles.infoBox}>
                            <Text style={{ color: isDark ? "#eee" : "#000" }}>
                              <Text
                                style={[
                                  styles.bold,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                Tournament Name:
                              </Text>
                              BMW
                            </Text>
                            <Text style={{ color: isDark ? "#eee" : "#000" }}>
                              <Text
                                style={[
                                  styles.bold,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                Organized By:
                              </Text>{" "}
                              KOLVE18FREESWING LLP
                            </Text>
                            <Text style={{ color: isDark ? "#eee" : "#000" }}>
                              <Text
                                style={[
                                  styles.bold,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                Effective Date:
                              </Text>{" "}
                              Auto-generated upon acceptance
                            </Text>
                          </VStack>

                          {/* WARNING BOX */}
                          <View
                            style={[
                              styles.warningBox,
                              {
                                backgroundColor: isDark ? "#3e2723" : "#fff3cd",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.warningText,
                                { color: isDark ? "#ffe0b2" : "#854d0e" },
                              ]}
                            >
                              Before completing your tournament registration,
                              you must read and agree to this Liability Waiver.
                            </Text>
                          </View>

                          {/* WAIVER CONTENT */}
                          <ScrollView showsVerticalScrollIndicator={false}>
                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                1. Assumption of Risk
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                I understand that participation in golf
                                tournaments involves inherent risks including
                                injury, collisions, equipment hazards and
                                weather related risks.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                2. Medical Fitness Declaration
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                I declare that I am medically fit to participate
                                in this tournament.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                3. Release of Liability
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                I release the organizers and sponsors from any
                                liability related to injuries, damages or losses
                                arising from my participation.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                4. Indemnity
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                I agree to indemnify the organizers against
                                claims arising from my participation.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                5. Compliance With Rules
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                I will comply with tournament rules and play
                                fairly.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                6. Personal Property
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                The organizer is not responsible for lost or
                                stolen property.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                7. Weather & Event Changes
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                The organizer may reschedule or cancel events
                                due to weather or safety concerns.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                8. Photography & Media Consent
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                I grant permission to use images or videos from
                                the tournament for promotional use.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                9. Digital Scoring & Data Use
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                I agree that scores and tournament data may be
                                stored digitally.
                              </Text>
                            </VStack>

                            <VStack style={styles.section}>
                              <Text
                                style={[
                                  styles.sectionTitle,
                                  { color: isDark ? "white" : "black" },
                                ]}
                              >
                                10. Governing Law
                              </Text>
                              <Text
                                style={[
                                  styles.sectionText,
                                  { color: isDark ? "#aaa" : "#555" },
                                ]}
                              >
                                This agreement is governed by the laws of India.
                              </Text>
                            </VStack>
                          </ScrollView>

                          {/* DIGITAL ACCEPTANCE */}
                          <View style={styles.acceptanceBox}>
                            <Text
                              style={[
                                styles.acceptanceTitle,
                                { color: isDark ? "white" : "black" },
                              ]}
                            >
                              DIGITAL ACCEPTANCE
                            </Text>

                            {/* MINOR CHECKBOX */}
                            <Pressable
                              style={styles.checkboxRow}
                              onPress={() => setIsMinor(!isMinor)}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  { borderColor: isDark ? "#444" : "#999" },
                                  isMinor && styles.checkboxActive,
                                ]}
                              />
                              <Text
                                style={[
                                  styles.checkboxText,
                                  { color: isDark ? "#ccc" : "#000" },
                                ]}
                              >
                                I am under 18 years of age
                              </Text>
                            </Pressable>

                            {/* GUARDIAN FORM */}
                            {isMinor && (
                              <VStack style={styles.guardianForm}>
                                <Text style={styles.formTitle}>
                                  Parent / Guardian Details
                                </Text>
                                <TextInput
                                  placeholder="Name"
                                  placeholderTextColor={
                                    isDark ? "#777" : "#999"
                                  }
                                  style={[
                                    styles.input,
                                    {
                                      backgroundColor: isDark
                                        ? "#1a1a1a"
                                        : "#fff",
                                    },
                                  ]}
                                />

                                <TextInput
                                  placeholder="Mobile Number"
                                  placeholderTextColor={
                                    isDark ? "#777" : "#999"
                                  }
                                  keyboardType="phone-pad"
                                  style={[
                                    styles.input,
                                    {
                                      backgroundColor: isDark
                                        ? "#1a1a1a"
                                        : "#fff",
                                    },
                                  ]}
                                />

                                <TextInput
                                  placeholder="Relation"
                                  placeholderTextColor={
                                    isDark ? "#777" : "#999"
                                  }
                                  style={[
                                    styles.input,
                                    {
                                      backgroundColor: isDark
                                        ? "#1a1a1a"
                                        : "#fff",
                                    },
                                  ]}
                                />
                              </VStack>
                            )}

                            {/* ACCEPT CHECKBOX */}
                            <Pressable
                              style={styles.checkboxRow}
                              onPress={() => setAccepted(!accepted)}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  { borderColor: isDark ? "#444" : "#999" },
                                  accepted && styles.checkboxActive,
                                ]}
                              />
                              <Text
                                style={[
                                  styles.checkboxText,
                                  { color: isDark ? "#ccc" : "#000" },
                                ]}
                              >
                                I confirm I have read and understood the waiver
                              </Text>
                            </Pressable>
                            {/* ACCEPT CHECKBOX */}
                            <Pressable
                              style={styles.checkboxRow}
                              onPress={() => {
                                setAccepted(!accepted);
                              }}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  { borderColor: isDark ? "#444" : "#999" },
                                  accepted && styles.checkboxActive,
                                ]}
                              />
                              <Text
                                style={[
                                  styles.checkboxText,
                                  { color: isDark ? "#ccc" : "#000" },
                                ]}
                              >
                                I agree to the terms above.
                              </Text>
                            </Pressable>
                          </View>

                          {/* ACTION BUTTONS */}
                          <HStack style={styles.buttonRow}>
                            <Pressable
                              onPress={() => {
                                setModalVisible(false);
                              }}
                              style={styles.declineBtn}
                            >
                              <Text
                                style={{ color: "#e53935", fontWeight: "600" }}
                              >
                                DECLINE
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={() => {
                                setModalVisible(false);
                                routePage.push(
                                  `/(drawer)/(user)/(tabs)/tournaments/playScoreCard?tournamentId=${tournament.tournamentId}&courseId=${tournament.courseId}&teeBoxId=${tournament.teeBoxId}&scoringType=${tournament.scoringType}`,
                                );
                              }}
                              style={styles.acceptBtn}
                            >
                              <Text
                                style={{ color: "#fff", fontWeight: "600" }}
                              >
                                I AGREE & REGISTER
                              </Text>
                            </Pressable>
                          </HStack>
                        </View>
                      </View>
                    </Modal>
                  </React.Fragment>
                ))}
              </>
            )}
          </ScrollView>
        </ThemedView>
      </ThemedView>

      {/* Create mini tournament modal */}
      <Modal animationType="slide" transparent visible={tModalVisible}>
        <View
          style={[
            styles.overlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#121212" : "#fff" },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* HEADER */}
              <HStack className="justify-between items-center mb-4">
                <ThemedText
                  style={{ fontSize: 18, fontWeight: "700", lineHeight: 27 }}
                >
                  Create Mini Tournament
                </ThemedText>

                <Pressable
                  onPress={() => {
                    reset();
                    setTModalVisible(false);
                  }}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={isDark ? "white" : "black"}
                  />
                </Pressable>
              </HStack>
              {/* TOURNAMENT NAME */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Tournament Name
              </Text> */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter Tournament Name"
                    placeholderTextColor={isDark ? "#777" : "#999"}
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
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

              {/* DATE ROW */}
              <HStack style={styles.row}>
                <VStack style={{ flex: 1 }}>
                  {/* <Text
                    style={[
                      styles.label,
                      { color: isDark ? "white" : "black" },
                    ]}
                  >
                    Start Date
                  </Text> */}

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
                              borderColor: isDark ? "#333" : "#ddd",
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

                <VStack style={{ flex: 1 }}>
                  {/* <Text
                    style={[
                      styles.label,
                      { color: isDark ? "white" : "black" },
                    ]}
                  >
                    End Date
                  </Text> */}

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
                              borderColor: isDark ? "#333" : "#ddd",
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
              </HStack>

              {/* COURSE */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Course
              </Text> */}
              <Controller
                control={control}
                name="courseId"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Course"
                    data={
                      courses?.map((item: any) => {
                        return {
                          label: item.name,
                          value: item.courseId,
                        };
                      }) || []
                    }
                    labelField="label"
                    valueField="value"
                    value={value}
                    onChange={(item) => {
                      onChange(item.value);
                      setSelectedCourse(item.value);
                    }}
                  />
                )}
              />
              {errors.courseId && (
                <Text style={{ color: "red" }}>*{errors.courseId.message}</Text>
              )}

              {/* TEE BOX */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Tee Box
              </Text> */}

              <Controller
                control={control}
                name="teeBox"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Tee Box"
                    data={
                      courses
                        .find((c: any) => c.courseId === selectedCourse)
                        ?.teeBoxes?.map((item: any) => {
                          return {
                            label: item.name,
                            value: item.teeBoxId,
                          };
                        }) || []
                    }
                    labelField="label"
                    valueField="value"
                    value={value}
                    onChange={(item) => {
                      onChange(Number(item.value));
                    }}
                  />
                )}
              />
              {errors.teeBox && (
                <Text style={{ color: "red" }}>*{errors.teeBox.message}</Text>
              )}

              {/* SCORING TYPE */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Scoring Type
              </Text> */}
              <Controller
                control={control}
                name="scoringType"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Scoring Type"
                    data={[
                      { label: "Standard (Gross/Net)", value: "1" },
                      { label: "Stableford", value: "2" },
                      { label: "Excluded(practice)", value: "3" },
                      { label: "DP Gross / Net", value: "4" },
                      { label: "DP Stableford", value: "5" },
                    ]}
                    labelField="label"
                    valueField="value"
                    value={value}
                    onChange={(item) => onChange(item.value)}
                  />
                )}
              />
              {errors.scoringType && (
                <Text style={{ color: "red" }}>
                  *{errors.scoringType.message}
                </Text>
              )}
              {/* MAX PLAYERS */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Max Players
              </Text> */}

              <Controller
                control={control}
                name="maxPlayers"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Max Players"
                    data={[
                      { label: "4 Players", value: 4 },
                      { label: "8 Players", value: 8 },
                      { label: "16 Players", value: 16 },
                    ]}
                    labelField="label"
                    valueField="value"
                    value={value}
                    onChange={(item) => onChange(item.value)}
                  />
                )}
              />
              {errors.maxPlayers && (
                <Text style={{ color: "red" }}>
                  *{errors.maxPlayers.message}
                </Text>
              )}
            </ScrollView>

            {/* BUTTONS */}
            <HStack style={styles.buttonRow}>
              <Pressable
                style={[
                  styles.cancelBtn,
                  { borderColor: isDark ? "#444" : "#ccc" },
                ]}
                onPress={() => {
                  reset();
                  setTModalVisible(false);
                }}
              >
                <Text style={{ color: isDark ? "#ccc" : "#333" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit(onSubmit)}
                style={styles.createBtn}
              >
                <Text style={{ color: "#fff" }}>Create Tournament</Text>
              </Pressable>
            </HStack>
          </View>
        </View>

        {/* START DATE PICKER */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {/* END DATE PICKER */}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 9,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.one,
    // paddingBottom: BottomTabInset + Spacing.two,
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

  card: {
    borderRadius: 14,
    padding: Spacing.four,
    gap: Spacing.two,
    borderColor: "#8bc34a",
    borderWidth: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
  },

  description: {
    opacity: 0.6,
  },

  dateRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },

  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  dateText: {
    fontSize: 12,
  },

  secondaryButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: Spacing.two,
  },

  secondaryButtonText: {
    fontWeight: "500",
  },

  outlineButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: Spacing.two,
    borderWidth: 1,
  },

  outlineButtonText: {
    fontWeight: "500",
    color: "#06b6d4",
  },
  outlineButtonText2: {
    fontWeight: "500",
    color: "#f59e0b",
  },
  outlineButtonText3: {
    fontWeight: "500",
    color: "#0d6efd",
  },

  playText: {
    color: "white",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 10,
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    maxHeight: "90%",
  },

  header: {
    justifyContent: "center",
    marginBottom: 10,
  },

  headerTitle: {
    fontWeight: "700",
    fontSize: 19,
    color: "#dc3545",
  },

  infoBox: {
    marginBottom: 10,
  },

  bold: {
    fontWeight: "600",
  },

  warningBox: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  warningText: {
    color: "#854d0e",
    fontWeight: "500",
  },

  section: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontWeight: "600",
  },

  sectionText: {
    fontSize: 13,
    color: "#555",
  },

  acceptanceBox: {
    marginTop: 10,
  },

  acceptanceTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#999",
    marginRight: 10,
    borderRadius: 4,
  },

  checkboxActive: {
    backgroundColor: "#8bc34a",
  },

  checkboxText: {
    flex: 1,
  },

  guardianForm: {
    marginBottom: 10,
  },

  formTitle: {
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },

  buttonRow: {
    justifyContent: "space-between",
    marginTop: 10,
  },

  declineBtn: {
    borderWidth: 1,
    borderColor: "#e53935",
    padding: 10,
    borderRadius: 5,
  },

  acceptBtn: {
    backgroundColor: "#8bc34a",
    padding: 10,
    borderRadius: 5,
  },
  label: {
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 10,
  },

  row: {
    gap: 10,
  },

  cancelBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },

  createBtn: {
    backgroundColor: "#8bc34a",
    padding: 10,
    borderRadius: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    marginTop: 6,
  },
});
