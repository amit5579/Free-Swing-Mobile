import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { getCourse } from "@/api/admin/courses";
import { Divider } from "@/components/divider";
import { Skeleton } from "@/components/Skeleton";

export default function StartNewRoundPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [courseList, setCourseList] = useState<any>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const ccs = await getCourse();
      setCourseList(ccs);
    } catch (error) {
      throw console.log("Error fetching courses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const RenderHeader = () => {
    return (
      <>
        <HStack
          className="px-3 mt-3 items-center"
          style={{ justifyContent: "space-between" }}
        >
          {/* CENTER: Title */}
          <ThemedText
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 30,
            }}
          >
            Start new round
          </ThemedText>

        </HStack>
        <ThemedText
          style={{
            textAlign: "center",
            fontSize: 16,
            fontWeight: "400",
            lineHeight: 30,
          }}
        >
          Select a course to begin your round.
        </ThemedText>
      </>
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

  return (
    <>
      <View
        style={{
          flex: 1,
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
                  {courseList.map((course: any) => (
                    <CourseCard
                      key={course.courseId}
                      course={course}
                      isDark={isDark}
                      //   onPress={() => routePage.push("/newRound/scoreCard")}
                    />
                  ))}
                </>
              )}
            </VStack>
          </VStack>
        </ScrollView>
      </View>
    </>
  );
}

/* ---------- COURSE CARD ---------- */
function CourseCard({ course, isDark }: any) {
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

        <HStack className="justify-between">
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

          {/* Tee Boxes */}
          <HStack className="items-center mt-2">
            <Ionicons name="cube-outline" size={18} color="blue" />
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
        </HStack>

        <Divider className="my-3 h-[1px] bg-[#e5e5e5]" />

        <Pressable
          //   onPress={() =>
          //     }
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
                  //   onDelete(course.courseId);
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
