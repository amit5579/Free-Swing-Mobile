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

import { Divider } from "@/components/divider";
import { Text } from "@/components/text";
import { TextInput } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCourse, deleteCourse } from "@/api/admin/courses";
import { getCourse } from "@/api/admin/courses";
import { courseSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
export default function adminCoursePage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const [courseList, setCourseList] = useState<any>([]);

  const [isEditMode, setIsEditMode] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any>(null);

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
      fetchCourse();
    } catch (error) {
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

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* HEADER */}
        <VStack>
          <ThemedText
            style={{
              fontSize: 20,
              fontWeight: "500",
              textAlign: "center",
              lineHeight: 30,
              marginTop: 10,
            }}
          >
            Manage and explore your golf courses
          </ThemedText>
          <HStack
            className="p-3 items-center"
            style={{ justifyContent: "flex-end" }}
          >
            {/* LEFT: Back button */}
            {/* <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
              <Ionicons
                name="arrow-back-outline"
                size={22}
                color={colorScheme === "dark" ? "#ffffff" : "#020617"}
              />
            </Pressable> */}
            {/* <View>
  {" "}
</View> */}

            {/* RIGHT: Add Button */}
            <Pressable
              onPress={() => {
                // debugger;
                setIsEditMode(false);
                setEditingCourse(null);
                reset();
                setModalVisible(true);
              }}
              style={styles.createButton}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-outline" size={28} color="white" />
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Add Courses
              </ThemedText>
            </Pressable>
          </HStack>
        </VStack>
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
                  {courseList.map((course: any) => (
                    <CourseCardAdmin
                      key={course.courseId}
                      course={course}
                      isDark={isDark}
                      setIsEditMode={setIsEditMode}
                      setEditingCourse={setEditingCourse}
                      onDelete={onDelete}
                      openModal={() => setModalVisible(true)}
                    />
                  ))}
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
        <View style={[styles.overlay, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" }]}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? "#121212" : "#fff" }]}>
            {/* Header */}
            <HStack className="justify-between items-center mb-4">
              <Text style={{ fontSize: 18, fontWeight: "700", lineHeight: 27, color: isDark ? "white" : "black" }}>
                {isEditMode ? "Edit Course" : "Add Course"}
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? "white" : "black"} />
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
            backgroundColor: isDark ? course.isPremium === false ? "#262626" : "#EFBF04" : "#e5e5e5",
          }}
        >
          <ThemedText style={{ fontSize: 12, fontWeight: "600", color: course.isPremium === false ? "white" : "#3D2412" }}>
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
            {/* course location */}
          </ThemedText>
        </HStack>

        <Pressable
          onPress={() => routeTeeBox(course.courseId)}
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
                Manage Tees
              </ThemedText>
            </>
          )}
        </Pressable>

        <Divider className="my-3 h-[1px] bg-[#e5e5e5]" />

        {/* Edit / Delete Actions */}
        <HStack className="justify-between">
          {/* Edit */}
          <Pressable
            onPress={() => {
              setEditingCourse(course);
              setIsEditMode(true);
              openModal();
            }}
            className="flex-row items-center gap-1"
          >
            <Ionicons name="pencil-outline" size={15} color={isDark? "#b2c1e0ff" : "#6b7280"} />
            <ThemedText style={{ color:isDark? "#b2c1e0ff" : "#6b7280", fontWeight: "400" }}>
              Edit
            </ThemedText>
          </Pressable>

          {/* Delete */}
          <Pressable
            onPress={() => {
              setDeleteModalVisible(true);
            }}
            className="flex-row items-center gap-1"
          >
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
            <ThemedText style={{ color: "#ef4444", fontWeight: "400" }}>
              Delete
            </ThemedText>
          </Pressable>
        </HStack>
      </Box>

      <Modal
        animationType="slide"
        transparent
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={[styles.overlay, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" }]}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? "#121212" : "#fff" }]}>
            {/* FORM */}
            <VStack className="gap-3">
              <ThemedText
                style={{ fontSize: 16, fontWeight: "700", textAlign: "center" }}
              >
                Delete Course
              </ThemedText>
              <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                Are you sure you want to delete this course?
              </ThemedText>
            </VStack>

            {/* Buttons */}
            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <ThemedText style={{ color: "white" }}>Cancel</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDeleteModalVisible(false);
                  onDelete(course.courseId);
                }}
                style={styles.createButton}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Yes, I'm sure
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
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
});
