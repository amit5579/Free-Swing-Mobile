import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
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
import { createCourse, deleteCourse } from "@/api/courses";
import { getCourse } from "@/api/courses";
import { courseSchema } from "@/schema/adminSchemas";
export default function adminTournamentPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedPremium, setSelectedPremium] = useState<string | null>(null);
  const [scoringMode, setScoringMode] = useState("netInclude");
  const [courseList, setCourseList] = useState<any>([]);

  const [isEditMode, setIsEditMode] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any>(null);

  // const courses = [
  //   { id: 1, name: "ASC AEPTA", location: "Bangalore", tees: 2, free: true },
  //   { id: 2, name: "Royal Greens", location: "Delhi", tees: 4, free: false },
  //   { id: 3, name: "Palm Meadows", location: "Mumbai", tees: 3, free: true },
  // ];

  // const premium = [
  //   { label: "Free", value: false },
  //   { label: "Premium", value: true },
  // ];

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
      const response = await getCourse();
      setCourseList(response);
      // console.log("courseList: ", courseList);
    } catch (error) {
      console.error("Failed to fetch course list", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        location: data.location,
        isPremium: data.isPremium,
      };

      if (isEditMode) {
        console.log("EDIT MODE");

        // 👉 when backend ready
        // await updateCourse(editingCourse.courseId, payload);
      } else {
        console.log("CREATE MODE");
        await createCourse(payload);
      }

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
                debugger;
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
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <HStack className="justify-between items-center mb-4">
              <Text style={{ fontSize: 18, fontWeight: "700", lineHeight: 27 }}>
                {isEditMode ? "Edit Course" : "Add Course"}
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} />
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
                      placeholderTextColor="#999"
                      style={styles.input}
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
                      style={styles.input}
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
                      style={styles.input}
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

            <Text className="text-gray-500">
              *Premium courses are only available to subscribed members.
            </Text>
            {/* Footer Buttons */}
            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedPremium(null);
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

  return (
    <>
      <Box
        className="rounded-2xl p-5 relative"
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#262626" : "#e5e5e5",
        }}
      >
        {/* Free Badge */}
        <Box
          className="absolute top-3 right-3 px-3 py-1 rounded-full"
          style={{
            backgroundColor: isDark ? "#262626" : "#e5e5e5",
          }}
        >
          <ThemedText style={{ fontSize: 12, fontWeight: "600" }}>
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
          onPress={() => routePage.push("/courses/teeBox")}
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
            <Ionicons name="pencil-outline" size={15} color="#6b7280" />
            <ThemedText style={{ color: "#6b7280", fontWeight: "400" }}>
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
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
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
});
