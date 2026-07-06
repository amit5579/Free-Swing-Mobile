import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Mail, UserIcon, ChartBar, Flag } from "lucide-react-native";
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
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import { SafeAreaView } from "react-native-safe-area-context";
import Watermark from "@/components/watermark";
import { useEffect, useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { getProfile, uploadProfileImage } from "@/api/modules/profile.api";
import { Image } from "expo-image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import EditProfileModal from "@/components/EditProfileModal";

export default function SubAdminProfile() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.navigate("/(drawer)/(subAdmin)/(tabs)/dashboard");
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [router]),
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
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  // const [image, setImage] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, []);

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
      setImageError(false);

      try {
        setUploading(true);
        await uploadProfileImage(selectedImage);
        Toast.show({
          type: "success",
          text1: "Profile  Picture Updated",
        });
        await fetchProfile();
      } catch (error) {
        console.log("Upload failed", error);
        Toast.show({
          type: "error",
          text1: "Failed to upload profile Picture",
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const fetchProfile = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setPageLoading(true);
      const data = await getProfile();
      setProfileData(data);
    } catch (error) {
      console.error("Failed to fetch sub-admin profile", error);
    } finally {
      if (showSkeleton) setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(true);
  }, []);

  const onSubmit = (data: any) => {
    console.log("Validated Data:", data);
  };

  const ProfileCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box className="rounded-3xl p-6 mb-6 bg-white/5">
        <VStack className="items-center">
          <Skeleton
            isDark={isDark}
            height={90}
            width={90}
            borderRadius={999}
            style={{ marginBottom: 14 }}
          />
          <Skeleton
            isDark={isDark}
            height={20}
            width="40%"
            style={{ marginBottom: 10 }}
          />
          <Skeleton isDark={isDark} height={28} width="30%" borderRadius={20} />
        </VStack>
      </Box>
    );
  };

  // const StatsSkeleton = ({ isDark }: { isDark: boolean }) => {
  //   return (
  //     <HStack className="justify-between mb-6">
  //       {[1, 2].map((_, i) => (
  //         <Box key={i} className="flex-1 mx-1 p-4 rounded-xl bg-white/10">
  //           <VStack className="items-center">
  //             <Skeleton isDark={isDark} height={20} width={20} style={{ marginBottom: 8 }} />
  //             <Skeleton isDark={isDark} height={18} width="40%" style={{ marginBottom: 6 }} />
  //             <Skeleton isDark={isDark} height={12} width="60%" />
  //           </VStack>
  //         </Box>
  //       ))}
  //     </HStack>
  //   );
  // };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}
      edges={["top", "left", "right"]}
    >
      <ThemedView className="flex-1 px-5">
        <Watermark />
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
              <ProfileCardSkeleton isDark={isDark} />
              {/* <StatsSkeleton isDark={isDark} /> */}
              <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
                <Skeleton
                  isDark={isDark}
                  height={20}
                  width="60%"
                  style={{ marginBottom: 10 }}
                />
                <Skeleton isDark={isDark} height={14} width="80%" />
              </Box>
            </>
          ) : (
            <>
              <HStack className="items-center my-6">
                <Pressable
                  onPress={() =>
                    router.navigate("/(drawer)/(subAdmin)/(tabs)/dashboard")
                  }
                  hitSlop={20}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={24}
                    color="#8BC34A"
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
                      {profileData?.profilePictureUrl &&
                      profileData.profilePictureUrl.trim() !== "" &&
                      profileData.profilePictureUrl !== "null" &&
                      !imageError ? (
                        <Image
                          source={{
                            uri: profileData?.profilePictureUrl?.startsWith(
                              "http",
                            )
                              ? profileData.profilePictureUrl
                              : `https://kolve18freeswing.com${profileData.profilePictureUrl}`,
                          }}
                          style={{ width: 90, height: 90, borderRadius: 45 }}
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
                          <Text
                            style={{
                              fontSize: 40,
                              fontWeight: "bold",
                              color: isDark ? "#fff" : "#2E7D32",
                            }}
                          >
                            {profileData?.username?.trim()
                              ? profileData.username.trim()[0].toUpperCase()
                              : "S"}
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
                    {profileData?.username}
                  </ThemedText>
                  {/* <Box className="border border-gray-400 mt-3 px-5 py-2 rounded-full">
                    <ThemedText style={{ fontSize: 14 }}>{profileData?.role || "Sub Admin"}</ThemedText>
                  </Box> */}
                </VStack>
              </Box>

              {/* <HStack className="justify-between mb-6">
                <Box className="flex-1 mr-2 p-4 rounded-xl bg-white/10 border border-[#8bc34a]">
                  <VStack className="items-center">
                    <ChartBar size={22} color="#8bc34a" />
                    <ThemedText style={{ fontSize: 18, fontWeight: "700", marginTop: 4 }}>
                      {profileData?.handicapIndex || "0.0"}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>Handicap Index</ThemedText>
                  </VStack>
                </Box>
                <Box className="flex-1 ml-2 p-4 rounded-xl bg-white/10 border border-[#8bc34a]">
                  <VStack className="items-center">
                    <Flag size={22} color="#8bc34a" />
                    <ThemedText style={{ fontSize: 18, fontWeight: "700", marginTop: 4 }}>
                      {profileData?.handicap || "0"}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>Handicap</ThemedText>
                  </VStack>
                </Box>
              </HStack> */}

              <Box 
              style={{
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                    }}
              className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
                <VStack space="lg">
                  <HStack className="items-center gap-3">
                    <Mail size={20} color="#8bc34a" />
                    <VStack>
                      <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                        Email Address
                      </ThemedText>
                      <ThemedText style={{ fontSize: 15, fontWeight: "500" }}>
                        {profileData?.email}
                      </ThemedText>
                    </VStack>
                  </HStack>
                  <Divider />
                  <HStack className="items-center gap-3">
                    <Ionicons
                      name="shield-checkmark"
                      size={20}
                      color="#8bc34a"
                    />
                    <VStack>
                      <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                        Role Control
                      </ThemedText>
                      <ThemedText style={{ fontSize: 15, fontWeight: "500" }}>
                        Exclusive Sub-Administrator
                      </ThemedText>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>

              <VStack space="md" className="mt-6">
                <Pressable
                  onPress={() => setEditProfileModal(true)}
                  style={{
                    backgroundColor: "#8BC34A",
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                    Edit Profile
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setPasswordModal(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#8BC34A",
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={{ color: "#8BC34A", fontWeight: "600" }}>
                    Change Password
                  </ThemedText>
                </Pressable>

                {/* <Pressable
                  onPress={() => router.push('/(drawer)/(profile)/certificate')}
                  style={{ borderWidth: 1, borderColor: "#8BC34A", padding: 14, borderRadius: 12, alignItems: "center" }}
                >
                  <ThemedText style={{ fontWeight: "600", color: "#8BC34A" }}>Handicap Certificate</ThemedText>
                </Pressable> */}
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
              style={{ fontSize: 13, opacity: 0.6, marginBottom: 14 }}
            >
              Update your account security
            </ThemedText>

            <VStack space="md">
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <View style={{ position: "relative" }}>
                      <TextInput
                        placeholder="Current Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showCurrentPassword}
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          borderWidth: 1,
                          borderColor: errors.currentPassword
                            ? "red"
                            : "#e5e5e5",
                          borderRadius: 10,
                          padding: 12,
                          paddingRight: 45,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                      <Pressable
                        onPress={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        style={{ position: "absolute", right: 12, top: 12 }}
                      >
                        <Ionicons
                          name={
                            showCurrentPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={20}
                          color={isDark ? "#888" : "#666"}
                        />
                      </Pressable>
                    </View>
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
                    <View style={{ position: "relative" }}>
                      <TextInput
                        placeholder="New Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showNewPassword}
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          borderWidth: 1,
                          borderColor: errors.newPassword ? "red" : "#e5e5e5",
                          borderRadius: 10,
                          padding: 12,
                          paddingRight: 45,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                      <Pressable
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: "absolute", right: 12, top: 12 }}
                      >
                        <Ionicons
                          name={
                            showNewPassword ? "eye-outline" : "eye-off-outline"
                          }
                          size={20}
                          color={isDark ? "#888" : "#666"}
                        />
                      </Pressable>
                    </View>
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
                    <View style={{ position: "relative" }}>
                      <TextInput
                        placeholder="Confirm Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          borderWidth: 1,
                          borderColor: errors.confirmPassword
                            ? "red"
                            : "#e5e5e5",
                          borderRadius: 10,
                          padding: 12,
                          paddingRight: 45,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                      <Pressable
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        style={{ position: "absolute", right: 12, top: 12 }}
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={20}
                          color={isDark ? "#888" : "#666"}
                        />
                      </Pressable>
                    </View>
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

            <HStack style={{ marginTop: 18, justifyContent: "space-between" }}>
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
                <Text style={{ color: "#fff", fontWeight: "600" }}>Update</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>

      <EditProfileModal
        visible={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        profile={profileData}
        onUpdateSuccess={() => fetchProfile(false)}
      />
    </SafeAreaView>
  );
}
