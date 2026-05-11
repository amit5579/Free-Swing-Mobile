import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View, Text } from "react-native";

import { getCourse } from "@/api/modules/admin/courses.api";
import { Divider } from "@/components/divider";
import { Skeleton } from "@/components/Skeleton";
import { Dropdown } from "react-native-element-dropdown";
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioLabel,
} from "@/components/radio";
import { getCourseBySearch, getHandicapDetails, saveExternalCourse } from "@/api/modules/newRound.api";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newRoundSchema, NewRoundFormValues } from "@/schema/userSchemas";
import Toast from "react-native-toast-message";

export default function StartNewRoundPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [courseList, setCourseList] = useState<any>([]);
  const [searchedCourseList, setSearchedCourseList] = useState<any>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const ccs = await getCourse();
      // console.log("tee detailllllsss", ccs);

      setCourseList(ccs);
    } catch (error) {
      throw console.log("Error fetching courses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
    fetchCourses();
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchedCourseList([]);
      return;
    }
    try {
      setSearchLoading(true);
      const response = await getCourseBySearch(search);
      setSearchedCourseList(response || []);
    } catch (error) {
      console.error("Error searching courses", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCourseSave = async (sourceCourse: any) => {
    try {
      setSearchLoading(true);
      await saveExternalCourse(sourceCourse);
      Toast.show({ type: "success", text1: "Course added successfully" });
      
      // Refresh local course list
      fetchCourses();
      
      // Update the searched list to show "Saved" for this course
      setSearchedCourseList((prevList: any[]) => 
        prevList.map(c => 
          c.externalCourseId === sourceCourse.id 
            ? { ...c, alreadyImported: true } 
            : c
        )
      );
    } catch (error) {
      console.error("Error saving courses", error);
      Toast.show({ type: "error", text1: "Failed to add course" });
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [search]);




  const RenderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
            alignItems: "center",
          }}
        >
          {/* 🧠 TITLE */}
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#fff" : "#020617",
            }}
          >
            Start New Round
          </ThemedText>

          {/* 📌 SUBTITLE */}
          <ThemedText
            style={{
              marginTop: 4,
              fontSize: 13,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
              maxWidth: "90%",
            }}
          >
            Select a course to begin your round
          </ThemedText>
        </VStack>
      </Box>
    );
  };

  const CourseCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        className="rounded-2xl p-5 relative"
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#262626" : "#e5e5e5",
          marginBottom: 12,
        }}
      >
        {/* Badge */}
        <Skeleton
          isDark={isDark}
          height={20}
          width={60}
          borderRadius={20}
          style={{ position: "absolute", top: 12, right: 12 }}
        />

        {/* Icon */}
        <Skeleton
          isDark={isDark}
          height={28}
          width={28}
          borderRadius={6}
          style={{ marginBottom: 12 }}
        />

        {/* Title */}
        <Skeleton
          isDark={isDark}
          height={18}
          width="60%"
          style={{ marginBottom: 10 }}
        />

        {/* Row */}
        <HStack className="justify-between">
          <Skeleton isDark={isDark} height={14} width="40%" />
          <Skeleton isDark={isDark} height={14} width="30%" />
        </HStack>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: isDark ? "#262626" : "#e5e5e5",
            marginVertical: 12,
          }}
        />

        {/* Button */}
        <Skeleton isDark={isDark} height={36} borderRadius={10} />
      </Box>
    );
  };

  const SearchCourseSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.5)" : "#fff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <HStack className="justify-between items-start mb-4">
          <View style={{ flex: 1 }}>
            <Skeleton isDark={isDark} height={18} width="70%" />
            <Skeleton isDark={isDark} height={14} width="40%" style={{ marginTop: 6 }} />
          </View>
          <Skeleton isDark={isDark} height={24} width={50} borderRadius={6} />
        </HStack>
        <Skeleton isDark={isDark} height={14} width="90%" style={{ marginBottom: 12 }} />
        <HStack className="gap-2">
          <Skeleton isDark={isDark} height={24} width={80} borderRadius={12} />
          <Skeleton isDark={isDark} height={24} width={80} borderRadius={12} />
          <Skeleton isDark={isDark} height={24} width={100} borderRadius={12} />
        </HStack>
      </View>
    );
  };


  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        {/* Header */}

        <RenderHeader />
        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-6 pb-20">
            <VStack className="gap-4">
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CourseCardSkeleton key={i} isDark={isDark} />
                  ))}
                </>
              ) : (
                <>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: isDark ? "#1e293b" : "#e2e8f0",
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginBottom: 12,
                    }}
                  >
                    <TextInput
                      placeholder="Search golf courses..."
                      placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                      value={search}
                      onChangeText={setSearch}
                      style={{
                        color: isDark ? "#fff" : "#000",
                      }}
                    />
                  </View>
                  {search.length > 0 ? (
                    <>
                      {/* Search Results Header */}
                      <HStack className="justify-between items-center mb-4">
                        <VStack>
                          <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                            Search Results
                          </ThemedText>
                          <ThemedText style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>
                            Query: {search}
                          </ThemedText>
                        </VStack>
                        <Box className="bg-[#f1f5f9] px-2 py-1 rounded-md">
                          <ThemedText style={{ fontSize: 12, fontWeight: "600", color: "#475569" }}>
                            {searchedCourseList.length} result(s)
                          </ThemedText>
                        </Box>
                      </HStack>

                      {searchLoading ? (
                        <>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <SearchCourseSkeleton key={i} isDark={isDark} />
                          ))}
                        </>
                      ) : searchedCourseList.length > 0 ? (
                        searchedCourseList.map((course: any) => (
                          <ExternalCourseCard
                            key={course.externalCourseId}
                            course={course}
                            isDark={isDark}
                            handleCourseSave={handleCourseSave}
                          />
                        ))
                      ) : (
                        <ThemedText style={{ textAlign: "center", marginTop: 20 }}>
                          No golf courses found for "{search}"
                        </ThemedText>
                      )}
                    </>
                  ) : (
                    courseList.map((course: any) => (
                      <CourseCard
                        key={course.courseId}
                        course={course}
                        isDark={isDark}
                      />
                    ))
                  )}
                </>
              )}
            </VStack>
          </VStack>
        </ScrollView>
      </View>
    </>
  );
}

/* ---------- EXTERNAL COURSE CARD ---------- */
function ExternalCourseCard({ course, isDark , handleCourseSave }: any) {
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <Box
      className="rounded-2xl p-4 mb-4"
      style={{
        borderWidth: 1,
        backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
      }}
    >
      {/* Top Row: Name and ID */}
      <HStack className="justify-between items-start mb-1">
        <VStack className="flex-1 mr-2">
          <ThemedText style={{ fontSize: 17, fontWeight: "700", color: textColor }}>
            {course.courseName}
          </ThemedText>
          <ThemedText style={{ fontSize: 13, color: subTextColor }}>
            {course.clubName}
          </ThemedText>
        </VStack>
        <Box className="bg-[#f1f5f9] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
          <ThemedText style={{ fontSize: 10, fontWeight: "700", color: "#64748b" }}>
            ID {course.externalCourseId}
          </ThemedText>
        </Box>
      </HStack>

      {/* Save Button Row */}
      <HStack className="justify-end mb-3">
        {course.alreadyImported ? (
          <Box className="flex-row items-center gap-1 border border-[#8bc34a] px-4 py-1.5 rounded-lg bg-[#f0f9eb]">
            <Ionicons name="checkmark-circle" size={16} color="#8bc34a" />
            <ThemedText style={{ fontSize: 13, fontWeight: "700", color: "#8bc34a" }}>
              Saved
            </ThemedText>
          </Box>
        ) : (
          <Pressable
          onPress={() => handleCourseSave(course.sourceCourse)}
            className="flex-row items-center gap-1 bg-[#8bc34a] px-5 py-2 rounded-lg"
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          >
            <Ionicons name="download-outline" size={16} color="#fff" />
            <ThemedText style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
              Save
            </ThemedText>
          </Pressable>
        )}
      </HStack>

      {/* Address Row */}
      <HStack className="items-start gap-1 mb-4 pr-4">
        <Ionicons name="location" size={16} color="#ef4444" style={{ marginTop: 2 }} />
        <ThemedText 
          numberOfLines={2}
          style={{ fontSize: 13, color: subTextColor, lineHeight: 18, flex: 1 }}
        >
          {course.address || "Address not available"}
        </ThemedText>
      </HStack>

      {/* Bottom Badges */}
      <HStack className="gap-2 flex-wrap">
        <Box className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-full">
          <ThemedText style={{ fontSize: 11, fontWeight: "600", color: "#475569" }}>
            Male Tees: {course.maleTeeCount}
          </ThemedText>
        </Box>
        <Box className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-full">
          <ThemedText style={{ fontSize: 11, fontWeight: "600", color: "#475569" }}>
            Female Tees: {course.femaleTeeCount}
          </ThemedText>
        </Box>
        <Box 
          className="px-2.5 py-1 rounded-full"
          style={{ 
            backgroundColor: course.alreadyImported ? "#ecfdf5" : "#f1f5f9",
            borderWidth: 1,
            borderColor: course.alreadyImported ? "#10b981" : "#94a3b8"
          }}
        >
          <ThemedText style={{ 
            fontSize: 11, 
            fontWeight: "700", 
            color: course.alreadyImported ? "#047857" : "#475569" 
          }}>
            {course.alreadyImported ? "Already in DB" : "Not saved locally"}
          </ThemedText>
        </Box>
      </HStack>
    </Box>
  );
}

/* ---------- COURSE CARD ---------- */
function CourseCard({ course, isDark }: any) {
  const routePage = useRouter();

  /* ---------- CONSTANTS ---------- */
  const scoringOptions = {
    net_including: { excluded: false, stableford: false },
    net_excluding: { excluded: true, stableford: false },
    stableford: { excluded: false, stableford: true },
  };

  const holesOptions = {
    "18": "18",
    front9: "front9",
    back9: "back9",
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [teeBoxList, setTeeBoxList] = useState<any[]>([]);
  const [handicapDetails, setHandicapDetails] = useState<any>([]);
  const [handicapView, setHandicapView] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<NewRoundFormValues>({
    resolver: zodResolver(newRoundSchema),
    defaultValues: {
      teeBoxId: 0,
      scoreType: "net_including",
      holesToPlay: "18",
    },
  });

  const selectedTeeBoxId = watch("teeBoxId");
  const scoreType = watch("scoreType");
  const holesToPlay = watch("holesToPlay");
  const textColor = isDark ? "#fff" : "#000";
  const subTextColor = isDark ? "#aaa" : "#555";
  const cardBg = isDark ? "#1e1e1e" : "#f9f9f9";
  const borderColor = isDark ? "#333" : "#ddd";

  const fetchHandiCap = async () => {
    try {
      const response = await getHandicapDetails(selectedTeeBoxId);
      setHandicapDetails(response);
    } catch (error) {
      console.error("Fetching handicap scorecard Error:", error);
      throw error;
    }
  };
  useEffect(() => {
    if (selectedTeeBoxId > 0) {
      fetchHandiCap();
    }
  }, [selectedTeeBoxId]);

  const selectedScore = scoringOptions[scoreType];
  const selectedHoles = holesOptions[holesToPlay];

  return (
    <>
      <Box
        className="rounded-2xl p-5 relative"
        style={{
          borderWidth: 1,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
        }}
      >
        {/* Free Badge */}
        <Box
          className="absolute top-3 right-3 px-3 py-1 rounded-full"
          style={{
            backgroundColor:
              course.isPremium === false ? "#8b8b8bff" : "#EFBF04",
          }}
        >
          <ThemedText
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: course.isPremium ? "#3D2412" : "#fff",
            }}
          >
            {course.isPremium === false ? "Free" : "Premium"}
          </ThemedText>
        </Box>

        {/* Flag */}
        <HStack className="mb-3">
          <Svg width={28} height={28} viewBox="0 0 448 512">
            <Path
              fill="#8bc34a"
              d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V358.4l62.7-18.8c41.9-12.6 87.1-8.7 126.2 10.9 42.7 21.4 92.5 24 137.2 7.2l37.1-13.9c12.5-4.7 20.8-16.6 20.8-30V65.1c0-23-24.2-38-44.8-27.7l-11.8 5.9c-44.9 22.5-97.8 22.5-142.8 0-36.4-18.2-78.3-21.8-117.2-10.1L64 54.4V32z"
            />
          </Svg>
        </HStack>

        {/* Course Name */}
        <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
          {course.name}
          {/* {courseList.name} */}
        </ThemedText>

        <HStack className="justify-between gap-4">
          {/* Location */}
          <HStack className="items-center mt-2" style={{ flex: 1 }}>
            <Ionicons name="location" size={18} color="#ef4444" />
            <ThemedText
              numberOfLines={2}
              style={{
                marginLeft: 6,
                fontSize: 14,
                opacity: 0.7,
                flex: 1,
              }}
            >
              {course.location}
              {/* course location */}
            </ThemedText>
          </HStack>
        </HStack>
         {/* Tee Boxes */}
          <HStack className="items-center mt-2" style={{ flexShrink: 0 }}>
            <Ionicons name="cube" size={18} color="blue" />
            <ThemedText
              style={{
                marginLeft: 6,
                fontSize: 14,
                opacity: 0.7,
              }}
            >
              {course.teeBoxes.length} Tee Boxes
            </ThemedText>
          </HStack>
        <Divider className="my-3 h-[1px] bg-[#e5e5e5]" />

        <Pressable
          onPress={() => {
            setModalVisible(true);
            setTeeBoxList(course.teeBoxes);
            reset(); // reset form to defaults
          }}
          className="mt-3 rounded-xl py-2 items-center border border-[#8bc34a] flex-row justify-center gap-2"
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#8bc34a" : "transparent",
          })}
        >
          {({ pressed }) => (
            <>
              <Ionicons
                name={pressed ? "apps" : "apps-outline"}
                size={18}
                color={pressed ? "white" : "#8bc34a"}
              />
              <ThemedText
                style={{
                  color: pressed ? "white" : "#8bc34a",
                  fontWeight: "600",
                }}
              >
                Select Tee Box
              </ThemedText>
            </>
          )}
        </Pressable>
      </Box>

      <Modal animationType="slide" transparent visible={modalVisible}>
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
            {/* HEADER */}
            <HStack className="justify-between items-center mb-4">
              <ThemedText
                style={{ fontSize: 18, fontWeight: "700", lineHeight: 27 }}
              >
                Select Tee Box
              </ThemedText>

              <Pressable
                onPress={() => {
                  reset();
                  setHandicapView(false);
                  setModalVisible(false);
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
              <ThemedText>
                You are now starting a round for {course.name}
              </ThemedText>
              <Controller
                control={control}
                name="teeBoxId"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: cardBg,
                        borderColor: errors.teeBoxId ? "#ef4444" : borderColor,
                        borderWidth: 1,
                      },
                    ]}
                    placeholderStyle={{ color: subTextColor }}
                    selectedTextStyle={{ color: textColor }}
                    itemTextStyle={{ color: textColor }}
                    containerStyle={{
                      backgroundColor: isDark ? "#333" : "#eee",
                      borderRadius: 8,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: borderColor,
                    }}
                    itemContainerStyle={{
                      backgroundColor: isDark ? "#333" : "#eee",
                    }}
                    activeColor={isDark ? "#333" : "#eee"}
                    data={teeBoxList.map((item: any) => ({
                      ...item,
                      label: `${item.name} (Slope:${item.slope} / Rating:${item.rating})`,
                    }))}
                    labelField="label"
                    valueField="teeBoxId"
                    placeholder={"Choose Tee Box"}
                    value={value}
                    onChange={(item: any) => {
                      // console.log("TeeItem", item);
                      setHandicapView(true);
                      onChange(item.teeBoxId);
                    }}
                  />
                )}
              />
              {errors.teeBoxId && (
                <Text style={styles.errorText}>{errors.teeBoxId.message}</Text>
              )}

              {handicapView && (
                <HStack
                  className={`justify-between items-center rounded-md p-3 border ${isDark ? "border-gray-700" : "border-gray-300"}`}
                >
                  <VStack>
                    <ThemedText>Your Handicap</ThemedText>
                    <ThemedText>
                      Based on Index: {handicapDetails.handicapIndex}
                    </ThemedText>
                  </VStack>
                  <ThemedText style={{ fontSize: 20, fontWeight: 700 }}>
                    {handicapDetails.handicap}
                  </ThemedText>
                </HStack>
              )}

              <View style={styles.container}>
                <Controller
                  control={control}
                  name="scoreType"
                  render={({ field: { onChange, value } }) => (
                    <RadioGroup value={value} onChange={onChange}>
                      <ThemedText style={{ color: textColor, marginBottom: 8 }}>
                        Scoring Mode
                      </ThemedText>

                      {[
                        {
                          label: "Net Score (including par 3)",
                          value: "net_including",
                        },
                        {
                          label: "Net Score (excluding par 3)",
                          value: "net_excluding",
                        },
                        {
                          label: "Stableford Scoring",
                          value: "stableford",
                        },
                      ].map((item) => (
                        <Radio
                          key={item.value}
                          value={item.value}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 10,
                          }}
                        >
                          <RadioIndicator
                            style={{
                              borderColor: textColor,
                              borderWidth: 2,
                              marginRight: 10,
                            }}
                          >
                            {value === item.value && (
                              <View
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: textColor,
                                }}
                              />
                            )}
                          </RadioIndicator>

                          <RadioLabel style={{ color: textColor }}>
                            {item.label}
                          </RadioLabel>
                        </Radio>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.scoreType && (
                  <Text style={styles.errorText}>
                    {errors.scoreType.message}
                  </Text>
                )}
              </View>

              {/* Holes to play */}
              <View style={styles.container}>
                <Controller
                  control={control}
                  name="holesToPlay"
                  render={({ field: { onChange, value } }) => (
                    <RadioGroup value={value} onChange={onChange}>
                      <ThemedText style={{ color: textColor, marginBottom: 8 }}>
                        Holes to Play
                      </ThemedText>

                      {[
                        {
                          label: "18 Holes",
                          value: "18",
                        },
                        {
                          label: "Front Nine (1-9)",
                          value: "front9",
                        },
                        {
                          label: "Back Nine (10-18)",
                          value: "back9",
                        },
                      ].map((item) => (
                        <Radio
                          key={item.value}
                          value={item.value}
                          style={{ flexDirection: "row", marginBottom: 10 }}
                        >
                          <RadioIndicator
                            style={{
                              borderColor: textColor,
                              borderWidth: 2,
                              marginRight: 10,
                            }}
                          >
                            {value === item.value && (
                              <View
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: textColor,
                                }}
                              />
                            )}
                          </RadioIndicator>

                          <RadioLabel style={{ color: textColor }}>
                            {item.label}
                          </RadioLabel>
                        </Radio>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.holesToPlay && (
                  <Text style={styles.errorText}>
                    {errors.holesToPlay.message}
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* BUTTONS */}
            <HStack style={styles.buttonRow}>
              <Pressable
                style={[
                  styles.cancelBtn,
                  { borderColor: isDark ? "#444" : "#ccc" },
                ]}
                onPress={() => {
                  // reset();
                  setHandicapView(false);
                  setModalVisible(false);
                }}
              >
                <Text style={{ color: isDark ? "#ccc" : "#333" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit((data) => {
                  const selectedScore = scoringOptions[data.scoreType];
                  const selectedHoles = holesOptions[data.holesToPlay];

                  setHandicapView(false);
                  setModalVisible(false);
                  routePage.push(
                    `/newRound/scoreCardUser?excluded=${selectedScore.excluded}&stableford=${selectedScore.stableford}&holes=${selectedHoles}&handicap=${handicapDetails.handicap}&courseId=${course.courseId}&teeBoxId=${data.teeBoxId}`,
                  );
                })}
                style={styles.createBtn}
              >
                <Text style={{ color: "#fff" }}>Start Game</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
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

  deleteButton: {
    backgroundColor: "#ef4444",
    padding: 3,
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
  input: {
    borderWidth: 1,
    borderColor: "#818589",
    borderRadius: 10,
    padding: 14,
    // marginBottom: 9,
    fontSize: 16,
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
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 1,
  },
  buttonRow: {
    justifyContent: "space-between",
    marginTop: 10,
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
});
