import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";
import { Avatar, AvatarFallbackText } from "@/components/avatar";
import { Badge, BadgeText } from "@/components/badge";
import {
  createSubAdmin,
  deleteSubAdmin,
  // getCourse,
  getSubAdminList,
  updateSubAdmin,
} from "@/api/modules/admin/subAdmins.api";
import { MultiSelect } from "react-native-element-dropdown";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subAdminSchema } from "@/schema/adminSchemas";
import { Controller } from "react-hook-form";
import { getCourse } from "@/api/modules/admin/courses.api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";

export default function subAdminsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [subAdminList, setSubAdminList] = useState<any>([]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubAdmin();
    setRefreshing(false);
  }, []);

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
      upiId: "",
      upiPayeeName: "",
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
        upiId: data.upiId,
        upiPayeeName: data.upiPayeeName,
      };
      if (isEditMode) {
        await updateSubAdmin(editingAdmin.id, payload);
        setPageLoading(true);
        setIsEditMode(false);
        setEditingAdmin(null);
        Toast.show({
          type: "success",
          text1: "Sub Admin updated successfully",
        });
      } else {
        await createSubAdmin(payload);
        Toast.show({
          type: "success",
          text1: "Sub Admin created successfully",
        });
      }
      setModalVisible(false);
      reset();

      // setSelectedCourses([]);
      fetchSubAdmin();
      setPageLoading(false);
    } catch (error) {
      console.error("Failed to create sub admin", error);
    }
  };

  const fetchSubAdmin = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setPageLoading(true);

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
      if (showSkeleton) setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmin(true);
  }, []);

  useEffect(() => {
    if (isEditMode && editingAdmin) {
      reset({
        username: editingAdmin.username,
        email: editingAdmin.email,
        password: "",
        mobileNumber: editingAdmin.mobileNumber,
        courseIds: editingAdmin.courses.map((c: any) => c.courseId),
        upiId: editingAdmin.upiId || "",
        upiPayeeName: editingAdmin.upiPayeeName || "",
      });
    }
  }, [editingAdmin, isEditMode]);

  const SubAdminCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        className="rounded-2xl p-4"
        style={{
          borderWidth: 1,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
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

  const handleCreate = () => {
    setIsEditMode(false);
    setEditingAdmin(null);
    reset();
    setModalVisible(true);
  };

  const renderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      <HStack
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 🔙 BACK */}
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={isDark ? "#fff" : "#020617"}
          />
        </Pressable>

        {/* 🧠 TITLE */}
        <ThemedText
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
            color: isDark ? "#fff" : "#020617",
          }}
        >
          Sub Admins
        </ThemedText>
      </HStack>

      {/* 🔥 PRIMARY CTA */}
      <Pressable
        onPress={handleCreate}
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
          backgroundColor: "#84cc16",
        }}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <ThemedText
          style={{
            color: "#fff",
            fontWeight: "600",
            fontSize: 14,
          }}
        >
          Create Sub-Admin
        </ThemedText>
      </Pressable>
    </Box>
  );

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        <Watermark />

        {/* Header */}
        {renderHeader()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8BC34A"]}
              tintColor="#8BC34A"
            />
          }
        >
          <VStack className="px-4 pb-20 mt-4 gap-4">
            {pageLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SubAdminCardSkeleton key={i} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {subAdminList.length == 0 ? (
                  <VStack
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 80,
                    }}
                  >
                    <Ionicons name="cube-outline" size={40} color="#8bc34a" />

                    <ThemedText
                      style={{
                        marginTop: 10,
                        fontWeight: "600",
                        fontSize: 17,
                      }}
                    >
                      No Sub Admins found
                    </ThemedText>

                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "#6b7280",
                        textAlign: "center",
                      }}
                    >
                      You haven't created any Sub Admin yet. Tap "Create Sub
                      Admin" to start managing your Sub Admins.
                    </Text>
                  </VStack>
                ) : (
                  subAdminList.map((sbadmin: any) => (
                    <SubAdminCard
                      key={sbadmin.id}
                      sbadmin={sbadmin}
                      isDark={isDark}
                      setPageLoading={setPageLoading}
                      setModalVisible={setModalVisible}
                      setIsEditMode={setIsEditMode}
                      setEditingAdmin={setEditingAdmin}
                      fetchSubAdmin={fetchSubAdmin}
                      // setDeleteModalVisible={setDeleteModalVisible}
                    />
                  ))
                )}
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
                  name="upiId"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <TextInput
                        placeholder="UPI ID (e.g. user@bank)"
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
                      {errors.upiId && (
                        <Text style={styles.errorText}>
                          *{errors.upiId.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </VStack>

              <VStack>
                <Controller
                  control={control}
                  name="upiPayeeName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <TextInput
                        placeholder="UPI Payee Name"
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
                      {errors.upiPayeeName && (
                        <Text style={styles.errorText}>
                          *{errors.upiPayeeName.message}
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
                        mode="modal"
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
  setPageLoading,
  setModalVisible,
  setIsEditMode,
  setEditingAdmin,
  fetchSubAdmin,
}: any) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleDelete = async (id: number) => {
    try {
      await deleteSubAdmin(id);
      setPageLoading(true);
      fetchSubAdmin();
      setPageLoading(false);
      Toast.show({
        type: "success",
        text1: "Sub Admin deleted successfully",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <>
      <Box
        style={[
          styles.card,
          {
            borderWidth: 1,
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
          },
        ]}
      >
        <VStack className="gap-4">
          {/* Header Section: Avatar + Name + Basic Info */}
          <HStack className="items-center gap-3">
            <Avatar size="md" style={{ backgroundColor: "#8bc34a" }}>
              <AvatarFallbackText>
                {getInitials(sbadmin.username)}
              </AvatarFallbackText>
            </Avatar>
            <VStack style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                {sbadmin.username}
              </ThemedText>
              <HStack className="items-center gap-1">
                <Ionicons
                  name="mail"
                  size={12}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <ThemedText
                  style={{
                    fontSize: 13,
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  {sbadmin.email}
                </ThemedText>
              </HStack>
            </VStack>
          </HStack>

          {/* Details Section */}
          <VStack className="gap-3">
            <HStack className="items-center gap-2">
              <View style={styles.iconContainer}>
                <Ionicons name="call" size={14} color="#8bc34a" />
              </View>
              <ThemedText style={{ fontSize: 14 }}>
                {sbadmin.mobileNumber}
              </ThemedText>
            </HStack>

            <Divider style={{ opacity: 0.5 }} />

            {/* Courses & Players Row */}
            <HStack className="justify-between items-start">
              <VStack className="gap-2" style={{ flex: 1 }}>
                <ThemedText
                  style={{ fontSize: 12, fontWeight: "600", opacity: 0.6 }}
                >
                  COURSES
                </ThemedText>
                <HStack className="flex-wrap gap-2">
                  {sbadmin.courses?.length > 0 ? (
                    sbadmin.courses?.map((course: any, index: number) => (
                      <Badge
                        key={index}
                        size="sm"
                        action="success"
                        variant="outline"
                        style={{ borderColor: "#8bc34a" }}
                      >
                        <BadgeText style={{ fontSize: 10, color: "#8bc34a" }}>
                          {course.name}
                        </BadgeText>
                      </Badge>
                    ))
                  ) : (
                    <ThemedText style={{ fontSize: 12, opacity: 0.5 }}>
                      None
                    </ThemedText>
                  )}
                </HStack>
              </VStack>

              <VStack className="items-end gap-2" style={{ marginLeft: 10 }}>
                <ThemedText
                  style={{ fontSize: 12, fontWeight: "600", opacity: 0.6 }}
                >
                  PLAYERS
                </ThemedText>
                <Badge
                  action="info"
                  variant="solid"
                  style={{ borderRadius: 12 }}
                >
                  <BadgeText
                    style={{
                      color: isDark ? "white" : "black",
                      fontWeight: "600",
                      fontSize: 17,
                    }}
                  >
                    {sbadmin.playerCount}
                  </BadgeText>
                </Badge>
              </VStack>
            </HStack>
          </VStack>

          {/* Action Bar */}
          <HStack
            className="justify-between items-center"
            style={[
              styles.actionBar,
              { borderTopColor: isDark ? "#334155" : "#f1f5f9" },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setIsEditMode(true);
                setEditingAdmin(sbadmin);
                setModalVisible(true);
              }}
              style={styles.actionButton}
            >
              <Ionicons name="pencil" size={16} color="#3b82f6" />
              <ThemedText style={{ color: "#3b82f6", fontWeight: "600" }}>
                Edit
              </ThemedText>
            </TouchableOpacity>

            <View
              style={{
                width: 1,
                height: "60%",
                backgroundColor: isDark ? "#334155" : "#f1f5f9",
              }}
            />

            <TouchableOpacity
              onPress={() => setDeleteModalVisible(true)}
              style={styles.actionButton}
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
              <ThemedText style={{ color: "#ef4444", fontWeight: "600" }}>
                Delete
              </ThemedText>
            </TouchableOpacity>
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
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(139, 195, 74, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
});
