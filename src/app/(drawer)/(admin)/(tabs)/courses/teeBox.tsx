// Handlesubmit of rhf and , post - put api calls , edit values dynamic

import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
//               onPress={() => routePage.push("/newRound/scoreCard")}
//     const routePage = useRouter();

import { HStack } from "@/components/hstack";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View } from "react-native";

import { Divider } from "@/components/divider";
import { Text } from "@/components/text";
import { ThemedView } from "@/components/themed-view";
import { TextInput } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import {
  createTeeBox,
  deleteTeeBox,
  getTeeBox,
  updateTeeBox,
} from "@/api/admin/courses";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teeBoxSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";

export default function teeBoxPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [teeBox, setTeeBox] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(teeBoxSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      color: "",
      rating: 0,
      slope: 0,
    },
  });

  const { courseId } = useLocalSearchParams();
  // console.log("asdfgh", courseId);

  const fetchTeeDetails = async () => {
    try {
      setLoading(true);

      const response = await getTeeBox(courseId as string);
      setTeeBox(response);
    } catch (error) {
      console.error("Error fetching tee details:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any, teeBoxId?: number) => {
    const payloadData = {
      name: data.name,
      color: data.color,
      rating: data.rating,
      slope: data.slope,
    };
    try {
      if (isEditMode == true) {
        await updateTeeBox(teeBoxId as number, payloadData);
        Toast.show({
          type: "success",
          text1: "Teebox updated successfully",
        });
        // await updateTeeBox(courseId, data) ;
        // Toast.show({
        //         type: "success",
        //         text1: "Teebox updated successfully",
        //       });
      } else {
        await createTeeBox(courseId as string, payloadData);
        Toast.show({
          type: "success",
          text1: "Teebox created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating tee box:", error);
      Toast.show({
        type: "error",
        text1: "Failed to create teebox",
      });
    } finally {
      fetchTeeDetails();
      setModalVisible(false);
    }
  };

  const handleDelete = async (teeBoxId: number) => {
    try {
      await deleteTeeBox(teeBoxId);
      Toast.show({
        type: "success",
        text1: "Teebox deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting tee box:", error);
      Toast.show({
        type: "error",
        text1: "Failed to delete teebox",
      });
    } finally {
      fetchTeeDetails();
    }
  };

  useEffect(() => {
    if (isEditMode && editingCourse) {
      reset({
        name: editingCourse.name,
        color: editingCourse.color,
        rating: editingCourse.rating,
        slope: editingCourse.slope,
      });

      setSelectedColor(editingCourse.color); // for UI
    }
  }, [editingCourse, isEditMode]);

  useEffect(() => {
    fetchTeeDetails();
  }, [courseId]);

  const color = [
    { label: "Red", value: "red" },
    { label: "Blue", value: "blue" },
    { label: "Black", value: "black" },
    { label: "White", value: "white" },
    { label: "Gold", value: "gold" },
    { label: "Green", value: "green" },
    { label: "Silver", value: "silver" },
  ];

  const TeeCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        className="rounded-2xl p-5"
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#262626" : "#e5e5e5",
          marginBottom: 12,
        }}
      >
        {/* Color Badge */}
        <Skeleton
          isDark={isDark}
          height={20}
          width={60}
          borderRadius={20}
          style={{ position: "absolute", top: 12, right: 12 }}
        />

        {/* Title */}
        <Skeleton
          isDark={isDark}
          height={18}
          width="40%"
          style={{ marginBottom: 12 }}
        />

        {/* Rating + Slope */}
        <HStack className="justify-between my-3">
          <VStack>
            <Skeleton isDark={isDark} height={12} width={50} />
            <Skeleton
              isDark={isDark}
              height={14}
              width={30}
              style={{ marginTop: 4 }}
            />
          </VStack>

          <VStack>
            <Skeleton isDark={isDark} height={12} width={50} />
            <Skeleton
              isDark={isDark}
              height={14}
              width={30}
              style={{ marginTop: 4 }}
            />
          </VStack>
        </HStack>

        {/* Button */}
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 10 }}
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

const handleAddTeeBox = () => {
  setIsEditMode(false);
  setEditingCourse(null);

  reset({
    name: "",
    color: "",
    rating: 0,
    slope: 0,
  });

  setSelectedColor(null);
  setModalVisible(true);
};

const renderHeader = () => (
  <Box
    style={{
      backgroundColor: isDark ? "#020617" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      paddingBottom: 12,
    }}
  >
    {/* 🔝 TOP BAR */}
    <HStack
      style={{
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* 🔙 BACK */}
      <Pressable
        onPress={() => routePage.back()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
        }}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={isDark ? "#fff" : "#020617"}
        />
      </Pressable>

      {/* 🧠 TITLE BLOCK */}
      <VStack style={{ flex: 1, alignItems: "center" }}>
        <ThemedText
          style={{
            fontSize: 17,
            fontWeight: "700",
            marginTop: 2,
            color: isDark ? "#fff" : "#020617",
          }}
        >
          Tee Boxes
        </ThemedText>
      </VStack>

      {/* ➕ ICON ACTION */}
      {/* <Pressable
        onPress={handleAddTeeBox}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexDirection: "row",
          gap: 6,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#84cc16",
        }}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <ThemedText
        style={{
          color: "#fff",
          fontWeight: "600",
          fontSize: 14,
        }}
      >
        Add
      </ThemedText>
      </Pressable> */}
    </HStack>

    {/* 🔥 CTA BUTTON */}
    <Pressable
      onPress={handleAddTeeBox}
      style={{
        marginHorizontal: 16,
        marginTop: 6,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#84cc16",
        elevation: 2, // Android shadow
      }}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
    >
      <Ionicons name="add" size={18} color="#fff" />
      <ThemedText
        style={{
          color: "#fff",
          fontWeight: "600",
          fontSize: 14,
        }}
      >
        Add Tee Box
      </ThemedText>
    </Pressable>
  </Box>
);

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
        }}
      >
        {/* HEADER */}
        {renderHeader()}

        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pb-20 mt-3">
            <VStack className="gap-4">
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TeeCardSkeleton key={i} isDark={isDark} />
                  ))}
                </>
              ) : (
                <>
                  {teeBox?.length === 0 && (
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
                        <Ionicons name="apps" size={32} color={"#8bc34a"} />
                      </View>
                      <ThemedText
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: isDark ? "#f1f5f9" : "#0f172a",
                          marginBottom: 6,
                        }}
                      >
                        No Tee Box Found
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 14,
                          color: isDark ? "#94a3b8" : "#64748b",
                          textAlign: "center",
                          lineHeight: 20,
                        }}
                      >
                        You haven't created any tee box yet. Tap "Add
                        Tee Box" to start managing your tee box.
                      </ThemedText>
                    </VStack>
                  )}
                  {teeBox?.map((tee: any) => (
                    <TeeCardAdmin
                      key={tee.id}
                      tee={tee}
                      isDark={isDark}
                      handleDelete={handleDelete}
                      openModal={() => setModalVisible(true)}
                      setIsEditMode={setIsEditMode}
                      setEditingCourse={setEditingCourse}
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
                  fontSize: 17,
                  fontWeight: "700",
                  color: isDark ? "white" : "black",
                }}
              >
                {isEditMode ? "Edit Tee Box" : "Add Tee Box"}
              </Text>

              <Pressable
                onPress={() => {
                  setSelectedColor(null);
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

            {/* Form */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <VStack className="mb-4">
                {/* <Text
                  style={{ fontSize: 15, fontWeight: "500", marginBottom: 6 }}
                >
                  Name
                </Text> */}

                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="Enter tee name"
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
                  )}
                />
                {errors.name && (
                  <Text style={styles.errorText}>*{errors.name.message}</Text>
                )}
              </VStack>

              {/* Color */}
              <VStack className="mb-4">
                {/* <Text
                  style={{ fontSize: 15, fontWeight: "500", marginBottom: 6 }}
                >
                  Color
                </Text> */}

                <Controller
                  control={control}
                  name="color"
                  render={({ field: { onChange, value } }) => (
                    <Dropdown
                      style={[
                        {
                          borderWidth: 1,
                          borderColor: isDark ? "#333" : "#818589",
                          borderRadius: 10,
                          padding: 14,
                          marginBottom: 14,
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
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
                      data={color}
                      labelField="label"
                      valueField="value"
                      placeholder="Select color"
                      value={isEditMode ? value : selectedColor}
                      onChange={(item) => {
                        onChange(item.value); // ✅ form update
                        setSelectedColor(item.value); // UI
                      }}
                    />
                  )}
                />
                {errors.color && (
                  <Text style={styles.errorText}>*{errors.color.message}</Text>
                )}
              </VStack>

              {/* Rating + Slope Row */}
              <HStack className="justify-between mb-4" style={{ gap: 10 }}>
                <VStack style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>Rating</ThemedText>

                  <Controller
                    control={control}
                    name="rating"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="Rating"
                        placeholderTextColor={isDark ? "#777" : "#999"}
                        keyboardType="numeric"
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#818589",
                            color: isDark ? "white" : "black",
                          },
                        ]}
                        value={value?.toString()}
                        onChangeText={(text) => onChange(Number(text))}
                      />
                    )}
                  />
                  {errors.rating && (
                    <Text style={styles.errorText}>
                      *{errors.rating.message}
                    </Text>
                  )}
                </VStack>

                <VStack style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>Slope</ThemedText>

                  <Controller
                    control={control}
                    name="slope"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="Slope"
                        placeholderTextColor={isDark ? "#777" : "#999"}
                        keyboardType="numeric"
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#818589",
                            color: isDark ? "white" : "black",
                          },
                        ]}
                        value={value?.toString()}
                        onChangeText={(text) => onChange(Number(text))}
                      />
                    )}
                  />
                  {errors.slope && (
                    <Text style={styles.errorText}>
                      *{errors.slope.message}
                    </Text>
                  )}
                </VStack>
              </HStack>

              {/* Color Dropdown */}

              {/* <Text className="text-gray-500 mb-4">
                *Premium tees are only available to subscribed members.
              </Text> */}
            </ScrollView>

            {/* Footer */}
            <HStack className="justify-end mt-4 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedColor(null);
                  setModalVisible(false);
                }}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  const teeboxId = editingCourse?.teeBoxId ?? editingCourse?.id;
                  handleSubmit(
                    (data) => onSubmit(data, teeboxId),
                    () => {
                      Toast.show({
                        type: "error",
                        text1: "Please fix the highlighted fields",
                      });
                    },
                  )();
                }}
                style={styles.startButton}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  {isEditMode ? "Save Changes" : "Create Tee Box"}
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------- tee CARD ---------- */

function TeeCardAdmin({
  tee,
  isDark,
  handleDelete,
  openModal,
  setIsEditMode,
  setEditingCourse,
}: any) {
  const teeColors: Record<string, string> = {
    red: "#ef4444",
    blue: "#3b82f6",
    black: "#111827",
    white: "#f3f4f6",
    gold: "#d4af37",
    green: "#16a34a",
    silver: "#9ca3af",
  };
  const routePage = useRouter();

  return (
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
      {/* Color Badge */}
      {/* Color Badge */}
      {tee.color &&
        (() => {
          const bgColor =
            teeColors[tee.color.toLowerCase()] || (isDark ? "#111" : "#fff");

          const textColor =
            tee.color.toLowerCase() === "white" ? "#000" : "#fff";

          return (
            <Box
              className="absolute top-3 right-3 px-3 py-1 rounded-full"
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#262626" : "#e5e5e5",
                backgroundColor: bgColor,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: textColor,
                }}
              >
                {tee.color}
              </ThemedText>
            </Box>
          );
        })()}

      {/* tee Name */}
      <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
        {tee.name}
      </ThemedText>

      {/* Location */}
      <HStack className="items-center justify-between my-3">
        <VStack>
          <ThemedText>Rating</ThemedText>
          <ThemedText>{tee.rating}</ThemedText>
        </VStack>
        <VStack>
          <ThemedText>Slope</ThemedText>
          <ThemedText>{tee.slope}</ThemedText>
        </VStack>
      </HStack>

      {/*setup holes button */}
      <Pressable
        onPress={() =>
          routePage.push(`/courses/holes?teeBoxId=${tee.teeBoxId}`)
        }
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
              Setup Holes
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
            setEditingCourse(tee);
            setIsEditMode(true);
            openModal();
          }}
          className="flex-row items-center gap-1"
        >
          <Ionicons
            name="pencil-outline"
            size={15}
            color={isDark ? "#b2c1e0ff" : "#6b7280"}
          />
          <ThemedText
            style={{
              color: isDark ? "#b2c1e0ff" : "#6b7280",
              fontWeight: "400",
            }}
          >
            Edit
          </ThemedText>
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={() => handleDelete(tee.id)}
          className="flex-row items-center gap-1"
        >
          <Ionicons name="trash-outline" size={15} color="#ef4444" />
          <ThemedText style={{ color: "#ef4444", fontWeight: "400" }}>
            Delete
          </ThemedText>
        </Pressable>
      </HStack>
    </Box>
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
  input: {
    borderWidth: 1,
    borderColor: "#818589",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },

  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 1,
  },
});
