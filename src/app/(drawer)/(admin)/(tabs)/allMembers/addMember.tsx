import React, { useState, useEffect } from "react";
import {
  Pressable,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { Ionicons } from "@expo/vector-icons";
import { createMember } from "@/api/admin/allMembers";
import { addMemberSchema, AddMemberType } from "@/schema/adminSchemas";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { getCourse } from "@/api/admin/courses";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AddMemberScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const colors = {
    bg: isDark ? "#020617" : "#f8fafc",
    text: isDark ? "#f1f5f9" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    dimText: isDark ? "#64748b" : "#94a3b8",
    inputBg: isDark ? "#0f172a" : "#f8fafc",
    inputBorder: isDark ? "#334155" : "#cbd5e1",
    disabledBg: isDark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.6)",
    cardBg: isDark ? "rgba(15,23,42,0.8)" : "#ffffff",
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMemberType>({
    resolver: zodResolver(addMemberSchema) as any,
    defaultValues: {
      username: "",
      email: "",
      password: "",
      membershipNo: "",
      mobileNumber: "",
      dateOfBirth: "",
      teeBoxId: 0,
      homeCourseId: 0,
      homeCourse: "",
      handicap: 0,
      handicapIndex: 0,
      courseSlope: 0,
      courseRating: 0,
    },
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const courseData = await getCourse();
        setCourses(courseData);
      } catch (e) {
        console.error("Failed to load courses", e);
      }
    };
    loadCourses();
  }, []);

  const handleCreate = async (data: AddMemberType) => {
    try {
      setSubmitting(true);
      const payload = {
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        handicap: data.handicap,
        handicapIndex: data.handicapIndex,
        homeCourseId: data.homeCourseId,
        homeCourse: data.homeCourse,
        membershipNo: data.membershipNo,
        mobileNumber: data.mobileNumber,
        password: data.password,
        rating: data.courseRating,
        slope: data.courseSlope,
        username: data.username,
        teeBoxId: data.teeBoxId,
      };
      await createMember(payload);
      Toast.show({ type: "success", text1: "Member created successfully" });
      reset();
      router.back();
    } catch (error) {
      console.log("Failed to create member", error);
      Toast.show({ type: "error", text1: "Failed to create member" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#f8fafc" }}
    >
      <Watermark />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <HStack
          style={{
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
            zIndex: 10,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
              borderRadius: 12,
              padding: 8,
              marginRight: 14,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#fff" : "#0f172a"}
            />
          </Pressable>
          <VStack style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}>
              Add Member
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: colors.subText, marginTop: 1 }}>
              Fill in the details to create a new member
            </ThemedText>
          </VStack>

        </HStack>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {/* ── Row: Name + Email ── */}
          <View style={styles.formRow}>
            <FormField label="Name" required error={errors.username?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Full name"
                    placeholderTextColor={colors.dimText}
                    value={value}
                    onChangeText={onChange}
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.username ? "#ef4444" : colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>

            <FormField label="Email" required error={errors.email?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="email@example.com"
                    placeholderTextColor={colors.dimText}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.email ? "#ef4444" : colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>
          </View>

          {/* ── Row: Password + Membership ── */}
          <View style={styles.formRow}>
            <FormField label="Password" required error={errors.password?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Set password"
                    placeholderTextColor={colors.dimText}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.password ? "#ef4444" : colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>

            <FormField label="Membership No." required error={errors.membershipNo?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="membershipNo"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Membership Number"
                    placeholderTextColor={colors.dimText}
                    value={value}
                    onChangeText={onChange}
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.membershipNo ? "#ef4444" : colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>
          </View>

          {/* ── Row: Mobile + Date of Birth ── */}
          <View style={styles.formRow}>
            <FormField label="Mobile" required error={errors.mobileNumber?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="mobileNumber"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Phone number"
                    placeholderTextColor={colors.dimText}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.mobileNumber ? "#ef4444" : colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>

            <FormField label="Date of Birth" error={errors.dateOfBirth?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                    >
                      <ThemedText style={{ fontSize: 14, color: value ? colors.text : colors.dimText }}>
                        {formatDateDisplay(value || "")}
                      </ThemedText>
                      <Ionicons name="calendar-outline" size={18} color={colors.dimText} />
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={value ? new Date(value) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(e: any, selectedDate?: Date) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            onChange(selectedDate.toISOString().split("T")[0]);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              />
            </FormField>
          </View>

          {/* ── Row: Home Course + Tee Box ── */}
          <View style={styles.formRow}>
            <FormField label="Home Course" required error={errors.homeCourseId?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="homeCourseId"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.homeCourseId ? "#ef4444" : colors.inputBorder }]}
                    placeholderStyle={{ color: colors.dimText, fontSize: 14 }}
                    selectedTextStyle={{ color: colors.text, fontSize: 14 }}
                    data={courses.map((c: any) => ({ label: c.name, value: c.courseId }))}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Course"
                    value={value}
                    onChange={(item) => {
                      onChange(item.value);
                      setValue("homeCourse", item.label);
                      setValue("teeBoxId", 0);
                      setValue("courseSlope", 0);
                      setValue("courseRating", 0);
                      setSelectedCourse(item.value);
                    }}
                  />
                )}
              />
            </FormField>

            <FormField label="Tee Box" required error={errors.teeBoxId?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="teeBoxId"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.teeBoxId ? "#ef4444" : colors.inputBorder }]}
                    placeholderStyle={{ color: colors.dimText, fontSize: 14 }}
                    selectedTextStyle={{ color: colors.text, fontSize: 14 }}
                    data={courses.find((c: any) => c.courseId === watch("homeCourseId"))?.teeBoxes?.map((t: any) => ({
                      label: `${t.name} (S:${t.slope} R:${t.rating})`,
                      value: t.teeBoxId,
                      slope: t.slope,
                      rating: t.rating,
                    })) || []}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Tee"
                    value={value || null}
                    onChange={(item) => {
                      onChange(item.value);
                      setValue("courseSlope", item.slope);
                      setValue("courseRating", item.rating);
                    }}
                  />
                )}
              />
            </FormField>
          </View>

          {/* ── Row: Handicap + Handicap Index ── */}
          <View style={styles.formRow}>
            <FormField label="Handicap" error={errors.handicap?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="handicap"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={colors.dimText}
                    value={value?.toString() || ""}
                    onChangeText={(t) => onChange(t === "" ? 0 : Number(t))}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>

            <FormField label="Handicap Index" error={errors.handicapIndex?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="handicapIndex"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="0.0"
                    placeholderTextColor={colors.dimText}
                    value={value?.toString() || ""}
                    onChangeText={(t) => onChange(t === "" ? 0 : Number(t))}
                    keyboardType="decimal-pad"
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>
          </View>

          {/* ── Row: Course Slope + Course Rating ── */}
          <View style={styles.formRow}>
            <FormField label="Course Slope" error={errors.courseSlope?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="courseSlope"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={colors.dimText}
                    value={value?.toString() || ""}
                    onChangeText={(t) => onChange(t === "" ? 0 : Number(t))}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: colors.disabledBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>

            <FormField label="Course Rating" error={errors.courseRating?.message} halfWidth colors={colors}>
              <Controller
                control={control}
                name="courseRating"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="0.0"
                    placeholderTextColor={colors.dimText}
                    value={value?.toString() || ""}
                    onChangeText={(t) => onChange(t === "" ? 0 : Number(t))}
                    keyboardType="decimal-pad"
                    style={[styles.input, { backgroundColor: colors.disabledBg, borderColor: colors.inputBorder, color: colors.text }]}
                  />
                )}
              />
            </FormField>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
            backgroundColor: isDark ? "#020617" : "#f8fafc",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
            }}
          >
            <ThemedText style={{ fontSize: 14, fontWeight: "600", color: colors.subText }}>
              Cancel
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handleSubmit(handleCreate) as any}
            disabled={submitting}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: "#8BC34A",
              shadowColor: "#8BC34A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
                Create Member
              </ThemedText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Helpers ──
function FormField({
  label,
  required,
  error,
  children,
  halfWidth,
  colors,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  halfWidth?: boolean;
  colors: any;
}) {
  return (
    <VStack style={{ width: halfWidth ? "48%" : "100%", marginBottom: 12 }}>
      <HStack style={{ marginBottom: 6, gap: 4 }}>
        <ThemedText style={{ fontSize: 13, fontWeight: "600", color: "#64748b" }}>
          {label}
        </ThemedText>
        {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
      </HStack>
      {children}
      {error && (
        <ThemedText style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
          {error}
        </ThemedText>
      )}
    </VStack>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
});
