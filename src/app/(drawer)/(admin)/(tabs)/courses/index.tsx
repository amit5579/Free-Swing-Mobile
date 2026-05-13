import React, { useEffect, useState } from "react";
import { GestureResponderEvent, StyleSheet } from "react-native";
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
import { TextInput } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCourse, deleteCourse } from "@/api/modules/admin/courses.api";
import { getCourse } from "@/api/modules/admin/courses.api";
import { courseSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
import { Badge, BadgeText } from "@/components/badge";
import { getCourseBySearch, saveExternalCourse } from "@/api/modules/newRound.api";
import Toast from "react-native-toast-message";
export default function adminCoursePage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const [courseList, setCourseList] = useState<any>([]);

  const [isEditMode, setIsEditMode] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [searchedCourseList, setSearchedCourseList] = useState<any>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      location: "",
      isPremium: undefined,
    },
  });

  const fetchCourse = async () => {
    try {
      setLoading(true);

      const response = await getCourse();
      setCourseList(response);
      // console.log("courseList: ", courseList);
    } catch (error) {
      console.error("Failed to fetch course list", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        location: data.location,
        isPremium: data.isPremium,
      };
      await createCourse(payload);

      setModalVisible(false);
      reset();
      fetchCourse();
    } catch (error) {
      console.error("Submit failed", error);
    }
  };

  const onDelete = async (courseId: number) => {
    try {
      await deleteCourse(courseId);
      Toast.show({ type: "success", text1: "Course deleted successfully" });
      fetchCourse();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to delete course" });
      console.error("Delete course failed", error);
    }
  };

  useEffect(() => {
    if (isEditMode && editingCourse) {
      reset({
        name: editingCourse.name,
        location: editingCourse.location,
        isPremium: editingCourse.isPremium,
      });
    } else {
      // 👉 CLEAR FORM when not editing
      reset({
        name: "",
        location: "",
        isPremium: undefined,
      });
    }
  }, [editingCourse, isEditMode]);

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
      fetchCourse();
      
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

  useEffect(() => {
    fetchCourse();
  }, []);

  const CourseCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        className="rounded-2xl p-5"
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

        {/* Location */}
        <Skeleton isDark={isDark} height={14} width="70%" />

        {/* Button */}
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 12 }}
        />

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: isDark ? "#262626" : "#e5e5e5",
            marginVertical: 12,
          }}
        />

        {/* Actions */}
        <HStack style={{ justifyContent: "space-between" }}>
          <Skeleton isDark={isDark} height={14} width={50} />
          <Skeleton isDark={isDark} height={14} width={50} />
        </HStack>
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


  const renderHeader = () => (
    <Box
      style={{
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      <HStack
        style={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 🧠 LEFT CONTENT */}
        <VStack style={{ flex: 1, paddingRight: 10 }}>
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#fff" : "#020617",
            }}
          >
            Golf Courses
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              marginTop: 2,
            }}
          >
            Manage and explore your courses
          </ThemedText>
        </VStack>

        {/* ➕ ADD BUTTON */}
        <Pressable
          onPress={() => {
            setIsEditMode(false);
            setEditingCourse(null);
            reset();
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
            Add
          </ThemedText>
        </Pressable>
      </HStack>
    </Box>
  );

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* HEADER */}
        {renderHeader()}
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
                          <ThemedText style={{ fontSize: 18, fontWeight: "700", color: isDark ? "#fff" : "#0f172a" }}>
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
                      <CourseCardAdmin
                        key={course.courseId}
                        course={course}
                        isDark={isDark}
                        setIsEditMode={setIsEditMode}
                        setEditingCourse={setEditingCourse}
                        onDelete={onDelete}
                        openModal={() => setModalVisible(true)}
                      />
                    ))
                  )}
                </>
              )}
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
            {/* Header */}
            <HStack className="justify-between items-center mb-4">
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  lineHeight: 27,
                  color: isDark ? "white" : "black",
                }}
              >
                {isEditMode ? "Edit Course" : "Add Course"}
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "white" : "black"}
                />
              </Pressable>
            </HStack>

            {/* Course Name */}
            <VStack className="mb-3">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TextInput
                      placeholder="Enter course name"
                      placeholderTextColor={isDark ? "#777" : "#999"}
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
                          borderColor: isDark ? "#333" : "#818589",
                          color: isDark ? "white" : "black",
                        },
                      ]}
                      value={value}
                      onChangeText={onChange}
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>
                        *{errors.name.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </VStack>

            {/* Location */}
            <VStack className="mb-3">
              <Controller
                control={control}
                name="location"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TextInput
                      placeholder="Enter course location"
                      placeholderTextColor={isDark ? "#777" : "#999"}
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
                          borderColor: isDark ? "#333" : "#818589",
                          color: isDark ? "white" : "black",
                        },
                      ]}
                      value={value}
                      onChangeText={onChange}
                    />
                    {errors.location && (
                      <Text style={styles.errorText}>
                        *{errors.location.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </VStack>

            {/* Premium Status */}
            <VStack className="mb-3">
              <Controller
                control={control}
                name="isPremium"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Dropdown
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
                          borderColor: isDark ? "#333" : "#818589",
                        },
                      ]}
                      placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                      selectedTextStyle={{ color: isDark ? "white" : "black" }}
                      containerStyle={{
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#818589",
                      }}
                      itemTextStyle={{ color: isDark ? "white" : "black" }}
                      activeColor={isDark ? "#333" : "#f0f0f0"}
                      data={[
                        { label: "Free", value: false },
                        { label: "Premium", value: true },
                      ]}
                      labelField="label"
                      valueField="value"
                      mode="modal"
                      placeholder="Premium Status"
                      value={value}
                      onChange={(item) => onChange(item.value)}
                    />

                    {errors.isPremium && (
                      <Text style={styles.errorText}>
                        *{errors.isPremium.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </VStack>

            <Text style={{ color: isDark ? "#777" : "#6B7280" }}>
              *Premium courses are only available to subscribed members.
            </Text>
            {/* Footer Buttons */}
            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleSubmit(onSubmit)}
                style={styles.startButton}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  {isEditMode ? "Save Changes" : "Add Course"}
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------- EXTERNAL COURSE CARD ---------- */
function ExternalCourseCard({ course, isDark, handleCourseSave }: any) {
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
          {course.address || course.locationSummary || "Address not available"}
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


function CourseCardAdmin({
  course,
  isDark,
  openModal,
  setIsEditMode,
  setEditingCourse,
  onDelete,
}: any) {
  const routePage = useRouter();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  function routeTeeBox(courseId: string) {
    routePage.push(`/courses/teeBox?courseId=${courseId}`);
  }

  return (
    <>
      <Box
        className="rounded-3xl p-5 relative"
        style={{
          borderWidth: 1,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
        }}
      >
        {/* Header Section with Badge */}
        <HStack className="justify-between items-start mb-4">
          <View style={styles.iconContainer}>
            <Svg width={24} height={24} viewBox="0 0 448 512">
              <Path
                fill="#8bc34a"
                d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V358.4l62.7-18.8c41.9-12.6 87.1-8.7 126.2 10.9 42.7 21.4 92.5 24 137.2 7.2l37.1-13.9c12.5-4.7 20.8-16.6 20.8-30V65.1c0-23-24.2-38-44.8-27.7l-11.8 5.9c-44.9 22.5-97.8 22.5-142.8 0-36.4-18.2-78.3-21.8-117.2-10.1L64 54.4V32z"
              />
            </Svg>
          </View>
          <Badge
            action={course.isPremium ? "warning" : "muted"}
            variant="solid"
            style={{
              backgroundColor: course.isPremium ? "#EFBF04" : "#94a3b8",
              borderRadius: 12,
              paddingHorizontal: 10,
            }}
          >
            <BadgeText
              style={{
                color: course.isPremium ? "#3D2412" : "#fff",
                fontWeight: "700",
                fontSize: 10,
              }}
            >
              {course.isPremium ? "PREMIUM" : "FREE"}
            </BadgeText>
          </Badge>
        </HStack>

        {/* Course Info */}
        <VStack className="mb-4">
          <ThemedText
            style={{ fontSize: 20, fontWeight: "800", marginBottom: 4 }}
          >
            {course.name}
          </ThemedText>
          <HStack className="items-center">
            <Ionicons name="location" size={16} color="#ef4444" />
            <ThemedText
              numberOfLines={2}
              style={{
                marginLeft: 4,
                fontSize: 14,
                opacity: 0.7,
                fontWeight: "500",
                flex: 1,
              }}
            >
              {course.location}
            </ThemedText>
          </HStack>
        </VStack>

        {/* Primary Action */}
        <Pressable
          onPress={() => routeTeeBox(course.courseId)}
          className="rounded-xl py-3 items-center border border-[#8bc34a] flex-row justify-center gap-2 mb-2"
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#8bc34a" : "transparent",
            borderWidth: 1.5,
          })}
        >
          {({ pressed }) => (
            <>
              <Ionicons
                name={pressed ? "apps" : "apps-outline"}
                size={20}
                color={pressed ? "white" : "#8bc34a"}
              />
              <ThemedText
                style={{
                  color: pressed ? "white" : "#8bc34a",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                Manage Tees
              </ThemedText>
            </>
          )}
        </Pressable>

        {/* Secondary Actions Bar */}
        <HStack
          className="justify-between items-center mt-3 pt-3"
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? "#334155" : "#f1f5f9",
          }}
        >
          <Pressable
            onPress={() => {
              setEditingCourse(course);
              setIsEditMode(true);
              openModal();
            }}
            className="flex-row items-center gap-2 flex-1 justify-center mt-3"
          >
            <Ionicons
              name="pencil"
              size={16}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
            <ThemedText
              style={{
                color: isDark ? "#94a3b8" : "#64748b",
                fontWeight: "600",
              }}
            >
              Edit
            </ThemedText>
          </Pressable>

          <View
            style={{
              width: 1,
              height: 20,
              backgroundColor: isDark ? "#334155" : "#f1f5f9",
            }}
          />

          <Pressable
            onPress={() => setDeleteModalVisible(true)}
            className="flex-row items-center gap-2 flex-1 justify-center "
          >
            <Ionicons name="trash" size={16} color="#ef4444" />
            <ThemedText style={{ color: "#ef4444", fontWeight: "600" }}>
              Delete
            </ThemedText>
          </Pressable>
        </HStack>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.overlay}>
          <Box
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1e293b" : "#ffffff" },
            ]}
          >
            <VStack className="items-center gap-4">
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="alert-circle" size={40} color="#ef4444" />
              </View>
              <VStack className="items-center gap-1">
                <ThemedText style={{ fontSize: 20, fontWeight: "700" }}>
                  Delete Course?
                </ThemedText>
                <ThemedText style={{ textAlign: "center", opacity: 0.7 }}>
                  Are you sure you want to delete "{course.name}"? This action
                  cannot be undone.
                </ThemedText>
              </VStack>

              <HStack className="w-full gap-3 mt-2">
                <Pressable
                  style={[
                    styles.cancelButton,
                    {
                      flex: 1,
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                    },
                  ]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <ThemedText
                    style={{
                      color: isDark ? "#fff" : "#374151",
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    Cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={{
                    flex: 1,
                    paddingHorizontal: 7,
                    paddingVertical: 5,
                    borderRadius: 7,
                    backgroundColor: "#ef4444",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    onDelete(course.courseId);
                  }}
                >
                  <ThemedText
                    style={{
                      color: "white",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    Delete
                  </ThemedText>
                </Pressable>
              </HStack>
            </VStack>
          </Box>
        </View>
      </Modal>
    </>
  );
}

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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(139, 195, 74, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
