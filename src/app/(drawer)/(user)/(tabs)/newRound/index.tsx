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
import { Modal, Pressable, useColorScheme, View, Text } from "react-native";

import { getCourse } from "@/api/admin/courses";
import { Divider } from "@/components/divider";
import { Skeleton } from "@/components/Skeleton";
import { Dropdown } from "react-native-element-dropdown";
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioLabel,
} from "@/components/radio";
import { getHandicapDetails } from "@/api/newRound";

export default function StartNewRoundPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [courseList, setCourseList] = useState<any>([]);
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
  const [selectedTeeBoxId, setSelectedTeeBoxId] = useState<number>(0);
  const [handicapDetails, setHandicapDetails] = useState<any>([]);
  const [scoreType, setScoreType] =
    useState<keyof typeof scoringOptions>("net_including");
  const [holesToPlay, setHolesToPlay] =
    useState<keyof typeof holesOptions>("18");
  const [handicapView, setHandicapView] = useState(false);
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
            backgroundColor: course.isPremium === false ? "#8b8b8bff" : "#EFBF04",
          }}
        >
          <ThemedText style={{ fontSize: 12, fontWeight: "600", color:course.isPremium? "#3D2412" : "#fff" }}>
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
          onPress={() => {
            setModalVisible(true);
            setTeeBoxList(course.teeBoxes);
            setSelectedTeeBoxId(0); // reset selection 
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
                  // reset();
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
              <Dropdown
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: cardBg,
                    borderColor: borderColor,
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
                value={selectedTeeBoxId}
                onChange={(item: any) => {
                  console.log("TeeItem", item);
                  setHandicapView(true);
                  setSelectedTeeBoxId(item.teeBoxId); // ✅ store ID
                }}
              />

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
                <RadioGroup value={scoreType} onChange={setScoreType}>
                  <ThemedText style={{ color: textColor, marginBottom: 8 }}>
                    Scoring Mode
                  </ThemedText>

                  {[
                    {
                      label: "Net Score (including par 3)",
                      value: "net_including",
                      excluded: false,
                      stableford: false,
                    },
                    {
                      label: "Net Score (excluding par 3)",
                      value: "net_excluding",
                      excluded: true,
                      stableford: false,
                    },
                    {
                      label: "Stableford Scoring",
                      value: "stableford",
                      excluded: false,
                      stableford: true,
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
                        {scoreType === item.value && (
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
              </View>

              {/* Holes to play */}
              <View style={styles.container}>
                <RadioGroup value={holesToPlay} onChange={setHolesToPlay}>
                  <ThemedText style={{ color: textColor, marginBottom: 8 }}>
                    Holes to Play
                  </ThemedText>

                  {[
                    {
                      label: "18 Holes",
                      value: "18",
                      holes: 18,
                    },
                    {
                      label: "Front Nine (1-9)",
                      value: "front9",
                      holes: 9,
                    },
                    {
                      label: "Back Nine (10-18)",
                      value: "back9",
                      holes: 10,
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
                        {holesToPlay === item.value && (
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
                onPress={
                  // handleSubmit(onSubmit)
                  () => {
                    setHandicapView(false);
                    setModalVisible(false);
                    routePage.push(
                      `/newRound/scoreCardUser?excluded=${selectedScore.excluded}&stableford=${selectedScore.stableford}&holes=${selectedHoles}&handicap=${handicapDetails.handicap}&courseId=${course.courseId}&teeBoxId=${selectedTeeBoxId}`,
                    );
                  }
                }
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
