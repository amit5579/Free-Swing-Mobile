import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Toast from "react-native-toast-message";
import { Dropdown } from "react-native-element-dropdown";

import { ThemedText } from "@/components/themed-text";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { updateProfile } from "@/api/modules/profile.api";
import { getAllCourses } from "@/api/modules/teeTime.api";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: any;
  onUpdateSuccess: () => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  profile,
  onUpdateSuccess,
}: EditProfileModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubAdmin = profile?.role === "SubAdmin";

  const schema = z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address"),
    mobileNumber: z.string().min(1, "Mobile Number is required"),
    homeCourse: z.string().min(1, "Home Course is required"),
    rating: isSubAdmin ? z.number({ coerce: true }).min(0) : z.number().optional(),
    slope: isSubAdmin ? z.number({ coerce: true }).min(0) : z.number().optional(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      mobileNumber: "",
      homeCourse: "",
      rating: 0,
      slope: 0,
    },
  });

  useEffect(() => {
    if (visible && profile) {
      reset({
        username: profile.username || "",
        email: profile.email || "",
        mobileNumber: profile.mobileNumber || "",
        homeCourse: profile.homeCourse || "",
        rating: profile.rating || 0,
        slope: profile.slope || 0,
      });
      fetchCourses();
    }
  }, [visible, profile, reset]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const data = await getAllCourses();
      // The dropdown needs label/value
      const formattedCourses = data.map((c: any) => ({
        label: c.name,
        value: c.name, // The API expects the course name directly
      }));
      
      // If the current homeCourse isn't in the list, we might want to add it so the dropdown displays correctly
      if (profile?.homeCourse && !formattedCourses.find((c: any) => c.value === profile.homeCourse)) {
         formattedCourses.push({ label: profile.homeCourse, value: profile.homeCourse });
      }
      
      setCourses(formattedCourses);
    } catch (error) {
      console.log("Error fetching courses", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const payload: any = {
        Username: data.username,
        Email: data.email,
        MobileNumber: data.mobileNumber,
        HomeCourse: data.homeCourse,
      };

      if (isSubAdmin) {
        payload.Rating = Number(data.rating);
        payload.Slope = Number(data.slope);
      }

      await updateProfile(payload);
      Toast.show({
        type: "success",
        text1: "Profile Updated",
      });
      onUpdateSuccess();
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to update profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const textColor = isDark ? "#fff" : "#000";
  const subTextColor = isDark ? "#888" : "#9ca3af";
  const inputBg = isDark ? "#111" : "#fff";
  const borderColor = isDark ? "#333" : "#e5e5e5";

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: inputBg,
            borderRadius: 16,
            padding: 18,
            maxHeight: "90%",
          }}
        >
          <HStack
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
              Edit Profile
            </ThemedText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={textColor} />
            </Pressable>
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="md" style={{ paddingBottom: 20 }}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <ThemedText style={{ marginBottom: 4, fontSize: 13, fontWeight: "600" }}>
                      Username
                    </ThemedText>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholderTextColor={subTextColor}
                      style={{
                        borderWidth: 1,
                        borderColor: errors.username ? "red" : borderColor,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        color: textColor,
                      }}
                    />
                    {errors.username && (
                      <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                        *{String(errors.username.message)}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <ThemedText style={{ marginBottom: 4, fontSize: 13, fontWeight: "600" }}>
                      Email
                    </ThemedText>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={subTextColor}
                      style={{
                        borderWidth: 1,
                        borderColor: errors.email ? "red" : borderColor,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        color: textColor,
                      }}
                    />
                    {errors.email && (
                      <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                        *{String(errors.email.message)}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="mobileNumber"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <ThemedText style={{ marginBottom: 4, fontSize: 13, fontWeight: "600" }}>
                      Mobile Number
                    </ThemedText>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                      placeholderTextColor={subTextColor}
                      style={{
                        borderWidth: 1,
                        borderColor: errors.mobileNumber ? "red" : borderColor,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        color: textColor,
                      }}
                    />
                    {errors.mobileNumber && (
                      <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                        *{String(errors.mobileNumber.message)}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="homeCourse"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <ThemedText style={{ marginBottom: 4, fontSize: 13, fontWeight: "600" }}>
                      Home Course
                    </ThemedText>
                    <Dropdown
                      mode="modal"
                      backgroundColor={isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"}
                      style={{
                        borderWidth: 1,
                        borderColor: errors.homeCourse ? "red" : borderColor,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        height: 50,
                      }}
                      containerStyle={{
                        backgroundColor: inputBg,
                        borderColor: borderColor,
                        borderRadius: 8,
                      }}
                      itemTextStyle={{ color: textColor }}
                      selectedTextStyle={{ color: textColor }}
                      activeColor={isDark ? "#333" : "#eee"}
                      data={courses}
                      labelField="label"
                      valueField="value"
                      placeholder={loadingCourses ? "Loading..." : "Select Home Course"}
                      placeholderStyle={{ color: subTextColor }}
                      value={value}
                      onChange={(item) => onChange(item.value)}
                      search
                      searchPlaceholder="Search courses..."
                      inputSearchStyle={{
                         color: textColor,
                         borderColor: borderColor,
                         borderRadius: 8,
                      }}
                    />
                    {errors.homeCourse && (
                      <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                        *{String(errors.homeCourse.message)}
                      </Text>
                    )}
                  </View>
                )}
              />

              {isSubAdmin && (
                <HStack style={{ gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name="rating"
                      render={({ field: { onChange, value } }) => (
                        <View>
                          <ThemedText style={{ marginBottom: 4, fontSize: 13, fontWeight: "600" }}>
                            Rating
                          </ThemedText>
                          <TextInput
                            value={String(value)}
                            onChangeText={onChange}
                            keyboardType="numeric"
                            placeholderTextColor={subTextColor}
                            style={{
                              borderWidth: 1,
                              borderColor: errors.rating ? "red" : borderColor,
                              borderRadius: 10,
                              paddingHorizontal: 12,
                              paddingVertical: 12,
                              color: textColor,
                            }}
                          />
                          {errors.rating && (
                            <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                              *{String(errors.rating.message)}
                            </Text>
                          )}
                        </View>
                      )}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name="slope"
                      render={({ field: { onChange, value } }) => (
                        <View>
                          <ThemedText style={{ marginBottom: 4, fontSize: 13, fontWeight: "600" }}>
                            Slope
                          </ThemedText>
                          <TextInput
                            value={String(value)}
                            onChangeText={onChange}
                            keyboardType="numeric"
                            placeholderTextColor={subTextColor}
                            style={{
                              borderWidth: 1,
                              borderColor: errors.slope ? "red" : borderColor,
                              borderRadius: 10,
                              paddingHorizontal: 12,
                              paddingVertical: 12,
                              color: textColor,
                            }}
                          />
                          {errors.slope && (
                            <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                              *{String(errors.slope.message)}
                            </Text>
                          )}
                        </View>
                      )}
                    />
                  </View>
                </HStack>
              )}
            </VStack>
          </ScrollView>

          <HStack style={{ marginTop: 18, justifyContent: "space-between" }}>
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#d1d5db",
                alignItems: "center",
                marginRight: 8,
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              <ThemedText style={{ fontWeight: "600" }}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "#8BC34A",
                alignItems: "center",
                marginLeft: 8,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600" }}>Update</Text>
              )}
            </Pressable>
          </HStack>
        </View>
      </View>
    </Modal>
  );
}
