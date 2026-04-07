import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Mail, ChartBar, Flag, UserIcon, BookA } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
  BackHandler,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { HStack } from "@/components/hstack";
import { Avatar } from "@/components/avatar";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import { SafeAreaView } from "react-native-safe-area-context";
import Watermark from "@/components/watermark";
import { useEffect, useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { getProfile, uploadProfileImage } from "@/api/profile";
import { Image } from "expo-image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";

export default function AdminProfile() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.navigate("/(drawer)/(admin)/(tabs)/dashboard");
        return true;
      };

      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => backHandler.remove();
    }, [router])
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [pageLoading, setPageLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required to access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];

      setImage(selectedImage.uri);
      setImageError(false);

      try {
        setUploading(true);

        await uploadProfileImage(selectedImage);

        await fetchAdminProfile();
      } catch (error) {
        console.log("Upload failed", error);
      } finally {
        setUploading(false);
      }
    }
  };
  const fetchAdminProfile = async () => {
    try {
      setPageLoading(true);

      const adminProfile = await getProfile();

      setAdminProfile(adminProfile);
    } catch (error) {
      console.error("Failed to fetch admin profile", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const onSubmit = (data: any) => {
    console.log("Validated Data:", data);

  };

  const AdminProfileCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box className="rounded-3xl p-6 mb-6 bg-white/5">
        <VStack className="items-center">
          {/* Avatar */}
          <Skeleton
            isDark={isDark}
            height={90}
            width={90}
            borderRadius={999}
            style={{ marginBottom: 14 }}
          />

          {/* Name */}
          <Skeleton
            isDark={isDark}
            height={20}
            width="40%"
            style={{ marginBottom: 10 }}
          />

          {/* Role */}
          <Skeleton isDark={isDark} height={28} width="30%" borderRadius={20} />
        </VStack>
      </Box>
    );
  };

  const AdminDetailsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
        <VStack space="lg">
          <HStack className="items-center gap-3">
            <Skeleton isDark={isDark} height={20} width={20} />

            <VStack>
              <Skeleton
                isDark={isDark}
                height={10}
                width="30%"
                style={{ marginBottom: 6 }}
              />
              <Skeleton isDark={isDark} height={14} width="60%" />
            </VStack>
          </HStack>
        </VStack>
      </Box>
    );
  };

  const AdminButtonSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <VStack className="mt-6">
        <Skeleton isDark={isDark} height={48} borderRadius={12} />
      </VStack>
    );
  };
  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          // backgroundColor: isDark ? "#000" : "#f2f2f2",
        }}
      >
        <ThemedView className="flex-1 px-5">
          <Watermark />
          <ScrollView showsVerticalScrollIndicator={false}>
            {pageLoading ? (
              <>
                <HStack className="items-center my-6">
                  <Skeleton isDark={isDark} height={24} width={24} />
                  <Skeleton
                    isDark={isDark}
                    height={20}
                    width="30%"
                    borderRadius={4}
                    style={{ marginLeft: 12 }}
                  />
                </HStack>

                <AdminProfileCardSkeleton isDark={isDark} />
                <AdminDetailsSkeleton isDark={isDark} />
                <AdminButtonSkeleton isDark={isDark} />
              </>
            ) : (
              <>
                <HStack className="items-center my-6">
                  <Pressable onPress={() => router.back()}>
                    <Ionicons
                      name="arrow-back-outline"
                      size={24}
                      color={isDark ? "#fff" : "#020617"}
                    />
                  </Pressable>

                  <ThemedText
                    style={{ fontSize: 20, fontWeight: "700", marginLeft: 12 }}
                  >
                    Profile
                  </ThemedText>
                </HStack>

                <Box className="rounded-3xl p-6 mb-6 bg-white/5">
                  <VStack className="items-center">
                    <Pressable onPress={pickImage}>
                      <View
                        style={{
                          borderWidth: 3,
                          borderColor: "#8bc34a",
                          borderRadius: 999,
                          padding: 3,
                          marginBottom: 14,
                          position: "relative",
                        }}
                      >
                        {(image || (adminProfile?.profilePictureUrl && adminProfile.profilePictureUrl.trim() !== "" && adminProfile.profilePictureUrl !== "null")) && !imageError ? (
                          <Image
                            source={{
                              uri: image ? image : (adminProfile?.profilePictureUrl?.startsWith('http') ? adminProfile.profilePictureUrl : `https://kolve18freeswing.com${adminProfile.profilePictureUrl}`),
                            }}
                            style={{
                              width: 90,
                              height: 90,
                              borderRadius: 45,
                            }}
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <View
                            style={{
                              width: 90,
                              height: 90,
                              borderRadius: 45,
                              backgroundColor: isDark ? "#333" : "#C5E1A5",
                              justifyContent: "center",
                              alignItems: "center",
                              borderWidth: 2,
                              borderColor: "#8BC34A",
                            }}
                          >
                            <Text style={{ fontSize: 40, fontWeight: "bold", color: isDark ? "#fff" : "#2E7D32" }}>
                              {adminProfile?.username?.trim() ? adminProfile.username.trim()[0].toUpperCase() : "A"}
                            </Text>
                          </View>
                        )}

                        <View
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            backgroundColor: "#8bc34a",
                            borderRadius: 20,
                            padding: 6,
                          }}
                        >
                          <Ionicons name="camera" size={14} color="white" />
                        </View>

                        {uploading && (
                          <View
                            style={{
                              position: "absolute",
                              width: "100%",
                              height: "100%",
                              backgroundColor: "rgba(0,0,0,0.5)",
                              borderRadius: 999,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name="cloud-upload-outline"
                              size={22}
                              color="white"
                            />
                          </View>
                        )}
                      </View>
                    </Pressable>

                    <ThemedText style={{ fontSize: 22, fontWeight: "700" }}>
                      {adminProfile?.username}
                    </ThemedText>

                    <Box className="border border-gray-400 mt-3 px-5 py-2 rounded-full">
                      <ThemedText style={{ fontSize: 14 }}>
                        {adminProfile?.role}
                      </ThemedText>
                    </Box>
                  </VStack>
                </Box>

                <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
                  <VStack space="lg">
                    <HStack className="items-center gap-3">
                      <Mail size={20} color="#8bc34a" />
                      <VStack>
                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                          Email
                        </ThemedText>

                        <ThemedText>{adminProfile?.email}</ThemedText>
                      </VStack>
                    </HStack>

                    <Divider />
                  </VStack>
                </Box>
                <VStack space="md" className="mt-6">
                  <Pressable
                    onPress={() => setPasswordModal(true)}
                    style={{
                      backgroundColor: "#8BC34A",
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                      Change Password
                    </ThemedText>
                  </Pressable>
                </VStack>
              </>
            )}
          </ScrollView>
        </ThemedView>
        <Modal
          animationType="slide"
          transparent
          visible={passwordModal}
          onRequestClose={() => setPasswordModal(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#111" : "#fff",
                borderRadius: 16,
                padding: 18,
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
                  Change Password
                </ThemedText>

                <Pressable onPress={() => setPasswordModal(false)}>
                  <Ionicons
                    name="close"
                    size={22}
                    color={isDark ? "#fff" : "#000"}
                  />
                </Pressable>
              </HStack>

              <ThemedText
                style={{
                  fontSize: 13,
                  opacity: 0.6,
                  marginBottom: 14,
                }}
              >
                Enter your current and new password
              </ThemedText>

              <VStack space="md">
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <TextInput
                        placeholder="Current Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          borderWidth: 1,
                          borderColor: errors.currentPassword
                            ? "red"
                            : "#e5e5e5",
                          borderRadius: 10,
                          padding: 12,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />

                      {errors.currentPassword && (
                        <Text
                          style={{ color: "red", fontSize: 12, marginTop: 4 }}
                        >
                          *{errors.currentPassword.message}
                        </Text>
                      )}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <TextInput
                        placeholder="New Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          borderWidth: 1,
                          borderColor: errors.newPassword ? "red" : "#e5e5e5",
                          borderRadius: 10,
                          padding: 12,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />

                      {errors.newPassword && (
                        <Text
                          style={{ color: "red", fontSize: 12, marginTop: 4 }}
                        >
                          *{errors.newPassword.message}
                        </Text>
                      )}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <TextInput
                        placeholder="Confirm Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          borderWidth: 1,
                          borderColor: errors.confirmPassword
                            ? "red"
                            : "#e5e5e5",
                          borderRadius: 10,
                          padding: 12,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />

                      {errors.confirmPassword && (
                        <Text
                          style={{ color: "red", fontSize: 12, marginTop: 4 }}
                        >
                          *{errors.confirmPassword.message}
                        </Text>
                      )}
                    </View>
                  )}
                />
              </VStack>

              <HStack
                style={{
                  marginTop: 18,
                  justifyContent: "space-between",
                }}
              >
                <Pressable
                  onPress={() => setPasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    alignItems: "center",
                    marginRight: 8,
                  }}
                >
                  <ThemedText style={{ fontWeight: "600" }}>Cancel</ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: "#8BC34A",
                    alignItems: "center",
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Update
                  </Text>
                </Pressable>
              </HStack>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}
