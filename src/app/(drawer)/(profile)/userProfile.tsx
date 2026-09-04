import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Mail, ChartBar, Flag, BookA } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { HStack } from "@/components/hstack";
import { Avatar } from "@/components/avatar";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  getCertificateByUserId,
  getProfile,
  uploadProfileImage,
} from "@/api/modules/profile.api";
import { Image } from "expo-image";
import ImageCropPicker from "react-native-image-crop-picker";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import EditProfileModal from "@/components/EditProfileModal";

export default function UserProfile() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";

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

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userCertificate, setUserCertificate] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  // const [image, setImage] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  }, []);

  const fetchUserProfile = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setPageLoading(true);
      const profile = await getProfile();
      const certificate = await getCertificateByUserId();
      setUserProfile(profile);
      setUserCertificate(certificate);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    } finally {
      if (showSkeleton) setPageLoading(false);
    }
  };

  const handleCertificateClick = async () => {
    try {
      let cert = userCertificate;
      if (!cert) {
        cert = await getCertificateByUserId();
        setUserCertificate(cert);
      }
      if (cert?.isEligible) {
        router.push("/(drawer)/(profile)/certificate");
      } else {
        Toast.show({
          type: "error",
          text1: "You are not eligible for handicap certificate",
          text2: `You are not eligible. You have only completed ${cert?.completedHolesCount || 0} holes (requires 180).`,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load certificate eligibility",
      });
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: "photo",
        cropping: true,
        cropperChooseText: "Done/Submit",
        cropperToolbarTitle: "Edit Image",
      });

      setImageError(false);

      try {
        setUploading(true);
        await uploadProfileImage({
          uri: result.path,
          type: result.mime || "image/jpeg",
          name: result.filename || result.path.split('/').pop() || "screenshot.jpg",
          size: result.size,
        } as any);
        Toast.show({
          type: "success",
          text1: "Profile Picture Updated",
        });
        await fetchUserProfile();
      } catch (error) {
        console.log("Upload failed", error);
        Toast.show({
          type: "error",
          text1: "Failed to upload profile Picture",
        });
      } finally {
        setUploading(false);
      }
    } catch (error: any) {
      if (error.code !== "E_PICKER_CANCELLED") {
        console.log("Image picker error:", error);
      }
    }
  };

  const onSubmit = (data: any) => {
    console.log("Validated Data:", data);
    // call API here
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, []),
  );

  const ProfileCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
          borderWidth: 1,
          borderRadius: 24,
        }}
        className="p-6 mb-6"
      >
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
          <Skeleton isDark={isDark} height={30} width="30%" borderRadius={20} />
        </VStack>
      </Box>
    );
  };

  const StatsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <HStack className="justify-between mb-6">
        {[1, 2].map((_, i) => (
          <Box key={i} className="flex-1 mx-1 p-4 rounded-xl bg-white/10">
            <VStack className="items-center">
              <Skeleton
                isDark={isDark}
                height={20}
                width={20}
                style={{ marginBottom: 8 }}
              />
              <Skeleton
                isDark={isDark}
                height={18}
                width="40%"
                style={{ marginBottom: 6 }}
              />
              <Skeleton isDark={isDark} height={12} width="60%" />
            </VStack>
          </Box>
        ))}
      </HStack>
    );
  };

  const DetailsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10">
        <VStack space="lg">
          {[1, 2].map((_, i) => (
            <View key={i}>
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
              {i === 0 && <Divider style={{ marginVertical: 12 }} />}
            </View>
          ))}
        </VStack>
      </Box>
    );
  };

  const ButtonsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <VStack space="md" className="mt-6">
        <Skeleton isDark={isDark} height={48} borderRadius={12} />
        <Skeleton isDark={isDark} height={48} borderRadius={12} />
      </VStack>
    );
  };

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}
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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <View style={{ position: "absolute", left: 0, zIndex: 10 }}>
                    <Skeleton
                      isDark={isDark}
                      height={24}
                      width={24}
                      borderRadius={12}
                    />
                  </View>
                  <Skeleton
                    isDark={isDark}
                    height={22}
                    width="30%"
                    borderRadius={4}
                    style={{ marginLeft: 36, alignSelf: "flex-start" }}
                  />
                </View>
                <ProfileCardSkeleton isDark={isDark} />
                <StatsSkeleton isDark={isDark} />
                <DetailsSkeleton isDark={isDark} />
                <ButtonsSkeleton isDark={isDark} />
              </>
            ) : (
              <>
                <HStack className="items-center my-6">
                  <Pressable onPress={() => router.back()} hitSlop={20}>
                    <Ionicons
                      name="arrow-back-outline"
                      size={24}
                      color="#8BC34A"
                    />
                  </Pressable>
                  <ThemedText
                    style={{ fontSize: 22, fontWeight: "700", marginLeft: 12 }}
                  >
                    Profile
                  </ThemedText>
                </HStack>

                <Box
                  style={{
                    backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark
                      ? "rgba(139, 195, 74, 0.35)"
                      : "rgba(139, 195, 74, 0.45)",
                    borderWidth: 1,
                    borderRadius: 24,
                  }}
                  className="p-6 mb-6"
                >
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
                        <Avatar size="xl">
                          {userProfile?.profilePictureUrl &&
                          userProfile.profilePictureUrl.trim() !== "" &&
                          userProfile.profilePictureUrl !== "null" &&
                          !imageError ? (
                            <Image
                              source={{
                                uri: userProfile?.profilePictureUrl?.startsWith(
                                  "http",
                                )
                                  ? userProfile.profilePictureUrl
                                  : `https://kolve18freeswing.com${userProfile.profilePictureUrl}`,
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
                                backgroundColor: isDark
                                  ? "rgba(139,195,74,0.15)"
                                  : "rgba(139,195,74,0.1)",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <ThemedText
                                style={{
                                  fontSize: 32,
                                  fontWeight: "bold",
                                  color: "#8BC34A",
                                }}
                              >
                                {userProfile?.username?.trim()
                                  ? userProfile.username.trim()[0].toUpperCase()
                                  : "U"}
                              </ThemedText>
                            </View>
                          )}
                        </Avatar>
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
                      {userProfile?.username}
                    </ThemedText>
                    {/* <Box className="border border-gray-400 mt-3 px-5 py-2 rounded-full">
                      <ThemedText style={{ fontSize: 14 }}>{userProfile?.role}</ThemedText>
                    </Box> */}
                  </VStack>
                </Box>

                <HStack className="justify-between mb-6">
                  <Box
                    style={{
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                    }}
                    className="flex-1 mr-2 p-4 rounded-xl border border-[#8bc34a]"
                  >
                    <VStack className="items-center">
                      <ChartBar size={22} color="#8bc34a" />
                      <ThemedText
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          marginTop: 4,
                        }}
                      >
                        {userProfile?.handicapIndex}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                        Handicap Index
                      </ThemedText>
                    </VStack>
                  </Box>
                  <Box
                    style={{
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                    }}
                    className="flex-1 ml-2 p-4 rounded-xl bg-white/10 border border-[#8bc34a]"
                  >
                    <VStack className="items-center">
                      <Flag size={22} color="#8bc34a" />
                      <ThemedText
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          marginTop: 4,
                        }}
                      >
                        {userProfile?.handicap}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                        Handicap
                      </ThemedText>
                    </VStack>
                  </Box>
                </HStack>

                <Box
                  style={{
                    backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                  }}
                  className="rounded-2xl border border-[#8bc34a] p-5 bg-white/10"
                >
                  <VStack space="lg">
                    <HStack className="items-center gap-3">
                      <Mail size={20} color="#8bc34a" />
                      <VStack>
                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                          Email
                        </ThemedText>
                        <ThemedText>{userProfile?.email}</ThemedText>
                      </VStack>
                    </HStack>
                    <Divider />
                    <HStack className="items-center gap-3">
                      <BookA size={20} color="#8bc34a" />
                      <VStack>
                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                          Account Status
                        </ThemedText>
                        <ThemedText
                          style={{
                            color:
                              userProfile?.isBlocked === false
                                ? "#8bc34a"
                                : "#E81515",
                            fontWeight: "600",
                          }}
                        >
                          {userProfile?.isBlocked === false
                            ? "Active"
                            : "Inactive"}
                        </ThemedText>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>

                <VStack space="md" className="mt-6">
                  <Pressable
                    onPress={() => setEditProfileModal(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#8BC34A",
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <ThemedText style={{ color: "#8BC34A", fontWeight: "600" }}>
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

                  {userProfile?.role === "Player" && (
                    <Pressable
                      onPress={() => handleCertificateClick()}
                      style={{ borderRadius: 12 }}
                    >
                      <LinearGradient
                        colors={["#8bc34a", "#558b2f"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          alignItems: "center",
                          shadowColor: "#8bc34a",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.35,
                          shadowRadius: 8,
                          elevation: 5,
                        }}
                      >
                        <ThemedText style={{ fontWeight: "800", color: "#fff" }}>
                          Handicap Certificate
                        </ThemedText>
                      </LinearGradient>
                    </Pressable>
                  )}
                </VStack>
              </>
            )}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>

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
              Enter your current and new password
            </ThemedText>
            <VStack space="md">
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: errors.currentPassword ? "red" : "#e5e5e5",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                      }}
                    >
                      <TextInput
                        placeholder="Current Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showCurrentPassword}
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                      <Pressable
                        onPress={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        <Ionicons
                          name={
                            showCurrentPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={20}
                          color={isDark ? "#888" : "#9ca3af"}
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
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: errors.newPassword ? "red" : "#e5e5e5",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                      }}
                    >
                      <TextInput
                        placeholder="New Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showNewPassword}
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                      <Pressable
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons
                          name={
                            showNewPassword ? "eye-outline" : "eye-off-outline"
                          }
                          size={20}
                          color={isDark ? "#888" : "#9ca3af"}
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
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: errors.confirmPassword ? "red" : "#e5e5e5",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                      }}
                    >
                      <TextInput
                        placeholder="Confirm Password"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={isDark ? "#888" : "#9ca3af"}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                      <Pressable
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={20}
                          color={isDark ? "#888" : "#9ca3af"}
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
                style={{ flex: 1, marginLeft: 8, borderRadius: 10 }}
              >
                <LinearGradient
                  colors={["#8bc34a", "#558b2f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    shadowColor: "#8bc34a",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Update</Text>
                </LinearGradient>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>

      <EditProfileModal
        visible={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        profile={userProfile}
        onUpdateSuccess={() => fetchUserProfile(false)}
      />
    </>
  );
}
