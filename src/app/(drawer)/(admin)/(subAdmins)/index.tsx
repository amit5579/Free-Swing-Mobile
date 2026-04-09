import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import Checkbox from "expo-checkbox";

import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";
import {
  createSubAdmin,
  deleteSubAdmin,
  // getCourse,
  getSubAdminList,
} from "@/api/admin/subAdmins";
import { MultiSelect } from "react-native-element-dropdown";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subAdminSchema } from "@/schema/adminSchemas";
import { Controller } from "react-hook-form";
import { getCourse } from "@/api/admin/courses";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Skeleton } from "@/components/Skeleton";

export default function subAdminsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);

  const [subAdminList, setSubAdminList] = useState<any>([]);

  const [courseList, setCourseList] = useState<any>([]);

  // const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const [isEditMode, setIsEditMode] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(subAdminSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      mobileNumber: "",
      courseIds: [] as number[],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        mobileNumber: data.mobileNumber,
        courseIds: data.courseIds,
      };
      // console.log("Payload:", payload);

      //
      if (isEditMode) {
        console.log("EDIT MODE");

        // 👉 later when backend works:
        // await updateSubAdmin(editingAdmin.id, payload);
      } else {
        console.log("CREATE MODE");
        await createSubAdmin(payload);
      }
      setModalVisible(false);
      reset();
      // setSelectedCourses([]);
      fetchSubAdmin();
    } catch (error) {
      console.error("Failed to create sub admin", error);
    }
  };

  const fetchSubAdmin = async () => {
    try {
      setPageLoading(true);

      const subAdminList = await getSubAdminList();
      const courseData = await getCourse();

      setSubAdminList(subAdminList);

      // Transform API response to { label, value } format for MultiSelect
      const formattedCourses = courseData.map((course: any) => ({
        label: course.name,
        value: String(course.courseId),
      }));
      setCourseList(formattedCourses);
      // console.log("courseList", formattedCourses);
    } catch (error) {
      console.error("Failed to fetch sub admin list", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmin();
  }, []);

  useEffect(() => {
    if (isEditMode && editingAdmin) {
      console.log("SETTING EDIT DATA");

      reset({
        username: editingAdmin.username,
        email: editingAdmin.email,
        password: "",
        mobileNumber: editingAdmin.mobileNumber,
        courseIds: editingAdmin.courses.map((c: any) => c.courseId),
      });

      // setSelectedCourses(
      //   editingAdmin.courses.map((c: any) => String(c.courseId)),
      // );
    }
  }, [editingAdmin, isEditMode]);

  const SubAdminCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        className="rounded-2xl p-4"
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#262626" : "#e5e5e5",
          marginBottom: 12,
        }}
      >
        <VStack className="gap-2">
          {/* Name */}
          <Skeleton isDark={isDark} height={16} width="50%" />

          {/* Email */}
          <Skeleton isDark={isDark} height={12} width="70%" />

          {/* Mobile */}
          <Skeleton isDark={isDark} height={12} width="60%" />

          {/* Courses */}
          <Skeleton
            isDark={isDark}
            height={12}
            width="30%"
            style={{ marginTop: 6 }}
          />

          <HStack style={{ flexWrap: "wrap", marginTop: 6 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                isDark={isDark}
                height={20}
                width={60}
                borderRadius={6}
                style={{ marginRight: 6, marginBottom: 6 }}
              />
            ))}
          </HStack>

          {/* Players */}
          <HStack style={{ marginTop: 6 }}>
            <Skeleton isDark={isDark} height={12} width={60} />
            <Skeleton
              isDark={isDark}
              height={20}
              width={30}
              borderRadius={6}
              style={{ marginLeft: 8 }}
            />
          </HStack>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark ? "#262626" : "#e5e5e5",
              marginVertical: 8,
            }}
          />

          {/* Actions */}
          <HStack style={{ justifyContent: "space-between" }}>
            <Skeleton isDark={isDark} height={14} width={50} />
            <Skeleton isDark={isDark} height={14} width={50} />
          </HStack>
        </VStack>
      </Box>
    );
  };

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <Watermark />

        {/* Header */}
        <HStack className="justify-between items-center px-4 my-3">
          <TouchableOpacity
            onPress={() => router.back()}
            style={
              {
                // borderRadius: 12,
                // backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e8f5e9",
              }
            }
          >
            <Ionicons name="arrow-back" size={24} color="#8bc34a" />
          </TouchableOpacity>

          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Sub Admins
          </ThemedText>

          <Pressable
            onPress={() => {
              setIsEditMode(false);
              setEditingAdmin(null);
              reset();
              // setSelectedCourses([]);
              setModalVisible(true);
            }}
            className="flex-row items-center gap-1"
            style={styles.createButton}
          >
            <Ionicons name="add-circle-outline" size={18} color="white" />

            <ThemedText style={{ color: "white", fontWeight: "600" }}>
              Create Sub-Admins
            </ThemedText>
          </Pressable>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pb-20 mt-4 gap-4">
            {pageLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SubAdminCardSkeleton key={i} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {subAdminList.map((sbadmin: any) => (
                  <SubAdminCard
                    key={sbadmin.id}
                    sbadmin={sbadmin}
                    isDark={isDark}
                    setModalVisible={setModalVisible}
                    setIsEditMode={setIsEditMode}
                    setEditingAdmin={setEditingAdmin}
                    fetchSubAdmin={fetchSubAdmin}
                    // setDeleteModalVisible={setDeleteModalVisible}
                  />
                ))}
              </>
            )}
          </VStack>
        </ScrollView>
      </SafeAreaView>

      {/* CREATE SUB ADMIN MODAL */}
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
                className="text-xl font-bold"
                style={{ color: isDark ? "white" : "black" }}
              >
                {isEditMode
                  ? `Edit Sub-Admin — ${editingAdmin?.username}`
                  : "Create Sub Admin"}
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "white" : "black"}
                />
              </Pressable>
            </HStack>

            {/* FORM */}
            <VStack className="gap-3">
              <VStack>
                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <TextInput
                        placeholder="Full name"
                        placeholderTextColor={isDark ? "#777" : "#999"}
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#d1d5db",
                            color: isDark ? "white" : "black",
                          },
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                      {errors.username && (
                        <Text style={styles.errorText}>
                          *{errors.username.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </VStack>

              <VStack>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <TextInput
                        placeholder="email@example.com"
                        placeholderTextColor={isDark ? "#777" : "#999"}
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#d1d5db",
                            color: isDark ? "white" : "black",
                          },
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {errors.email && (
                        <Text style={styles.errorText}>
                          *{errors.email.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </VStack>

              <VStack>
                <Controller
                  control={control}
                  name="mobileNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <TextInput
                        placeholder="Phone number"
                        placeholderTextColor={isDark ? "#777" : "#999"}
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#d1d5db",
                            color: isDark ? "white" : "black",
                          },
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="phone-pad"
                      />
                      {errors.mobileNumber && (
                        <Text style={styles.errorText}>
                          *{errors.mobileNumber.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </VStack>

              <VStack>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <TextInput
                        placeholder="Set password"
                        placeholderTextColor={isDark ? "#777" : "#999"}
                        secureTextEntry
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#d1d5db",
                            color: isDark ? "white" : "black",
                          },
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                      {errors.password && (
                        <Text style={styles.errorText}>
                          *{errors.password.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </VStack>

              <VStack>
                <Controller
                  control={control}
                  name="courseIds"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <MultiSelect
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderColor: isDark ? "#333" : "#d1d5db",
                          },
                        ]}
                        placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                        selectedTextStyle={{
                          color: isDark ? "white" : "black",
                        }}
                        containerStyle={{
                          backgroundColor: isDark ? "#1a1a1a" : "#fff",
                          borderColor: isDark ? "#333" : "#d1d5db",
                        }}
                        itemTextStyle={{ color: isDark ? "white" : "black" }}
                        activeColor={isDark ? "#333" : "#f0f0f0"}
                        data={courseList}
                        labelField="label"
                        valueField="value"
                        placeholder="Assign Courses"
                        value={value?.map((v: number) => String(v)) || []}
                        onChange={(selectedValues: string[]) => {
                          // setSelectedCourses(selectedValues);
                          onChange(selectedValues.map((v) => Number(v)));
                        }}
                        renderItem={(item: any) => {
                          // const isSelected = selectedCourses.includes(item.value);
                          const isSelected = value?.includes(
                            Number(item.value),
                          );

                          return (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                padding: 15,
                                backgroundColor: isDark ? "#1a1a1a" : "#fff",
                              }}
                            >
                              <Checkbox
                                value={isSelected}
                                onValueChange={() => {}}
                                color={isSelected ? "#8bc34a" : undefined}
                              />

                              <Text
                                style={{
                                  marginLeft: 10,
                                  color: isDark ? "white" : "black",
                                }}
                              >
                                {item.label}
                              </Text>
                            </View>
                          );
                        }}
                      />
                      {errors.courseIds && (
                        <Text style={styles.errorText}>
                          *{errors.courseIds.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </VStack>
            </VStack>

            {/* Buttons */}
            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={[
                  styles.cancelButton,
                  { borderColor: isDark ? "#333" : "#d1d5db" },
                ]}
                onPress={() => setModalVisible(false)}
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
                  {isEditMode ? "Save" : "Create"}
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SubAdminCard({
  sbadmin,
  isDark,
  setModalVisible,
  setIsEditMode,
  setEditingAdmin,
  fetchSubAdmin,
}: any) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleDelete = async (id: number) => {
    try {
      await deleteSubAdmin(id);
      fetchSubAdmin();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <Box
        className="rounded-2xl p-4"
        style={{
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
        }}
      >
        <VStack className="gap-2">
          <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
            {sbadmin.username}
          </ThemedText>

          <ThemedText style={{ opacity: 0.7 }}>{sbadmin.email}</ThemedText>

          <ThemedText style={{ opacity: 0.7 }}>
            {sbadmin.mobileNumber}
          </ThemedText>

          {/* Courses */}
          <Box className="flex-row flex-wrap mt-2 gap-2">
            <ThemedText style={{ fontWeight: "600", width: "100%" }}>
              Courses:
            </ThemedText>

            {sbadmin.courses?.map((course: any, index: number) => (
              <Box key={index} style={styles.courseBadge}>
                <ThemedText style={{ color: "#8bc34a", fontSize: 12 }}>
                  {course.name}
                </ThemedText>
              </Box>
            ))}
          </Box>

          {/* Players */}
          <HStack className="items-center mt-2 gap-2">
            <ThemedText style={{ fontWeight: "600" }}>Players:</ThemedText>

            <Box style={styles.playerBadge}>
              <ThemedText style={{ color: "#8bc34a" }}>
                {sbadmin.playerCount}
              </ThemedText>
            </Box>
          </HStack>

          <Divider className="my-2" />

          {/* Actions */}
          <HStack className="justify-between">
            <Pressable
              onPress={() => {
                setIsEditMode(true);
                setEditingAdmin(sbadmin);
                setModalVisible(true);
              }}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="pencil-outline" size={16} color="#3b82f6" />

              <ThemedText style={{ color: "#3b82f6" }}>Edit</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setDeleteModalVisible(true)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />

              <ThemedText style={{ color: "#ef4444" }}>Delete</ThemedText>
            </Pressable>
          </HStack>
        </VStack>
      </Box>
      {/* Delete Sub Admin Modal */}

      <Modal
        animationType="slide"
        transparent
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
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
            {/* FORM */}
            <VStack className="gap-3">
              <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                Delete sub-admin "{sbadmin.username}"? Their invited players
                will be preserved.
              </ThemedText>
            </VStack>

            {/* Buttons */}
            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={[
                  styles.cancelButton,
                  { borderColor: isDark ? "#333" : "#d1d5db" },
                ]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <ThemedText style={{ color: isDark ? "#ccc" : "#374151" }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDeleteModalVisible(false);
                  handleDelete(sbadmin.id);
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
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
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

  courseBadge: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgba(139, 195, 74, 0.1)", // Consistent translucent green
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  playerBadge: {
    backgroundColor: "rgba(139, 195, 74, 0.1)", // Consistent translucent green
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 3,
  },
});
