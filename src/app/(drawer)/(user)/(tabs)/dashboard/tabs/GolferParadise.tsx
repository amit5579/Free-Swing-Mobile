import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Keyboard,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Divider } from "@/components/divider";
import { Button, ButtonText } from "@/components/button";
import ImageCropPicker from "react-native-image-crop-picker";
import https from "@/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postParadise } from "@/api/modules/dashboard.api";
import { ThemedText } from "@/components/themed-text";
import { LinearGradient } from "expo-linear-gradient";
import { resolveMediaUrl } from "@/utils/mediaUtils";
import { formatCommentDate, formatPostDate } from "@/utils/dateUtils";

export interface ParadisePost {
  id: number;
  userId: number;
  playerName: string;
  playerAvatar: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  caption: string;
  createdAt: string;
  likeCount: number;
  isLikedByMe: boolean;
  commentCount: number;
  comments: ParadiseComment[];
    canDelete?: boolean;
}

export interface ParadiseComment {
  id: number;
  userId: number;
  userName?: string;
  playerName?: string;
  user?: string;
  text?: string;
  comment?: string;
  createdAt: string;
  playerAvatar?: string | null;
  profilePictureUrl?: string | null;
}

const PostImage = ({
  imageUrl,
  isDark,
  onImagePress,
}: {
  imageUrl: string;
  isDark: boolean;
  onImagePress?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [imageUrl]);

  if (hasError || !imageUrl) {
    return (
      <View
        style={{
          width: "100%",
          aspectRatio: 4 / 3,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.02)",
        }}
      >
        <Ionicons
          name="image-outline"
          size={32}
          color={isDark ? "#6B7280" : "#9CA3AF"}
        />
        <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 8 }}>
          Image not available
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onImagePress}
      style={{ width: "100%", aspectRatio: 4 / 3, position: "relative" }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(err) => {
          console.warn("[PostImage] Error loading image:", imageUrl, err);
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.02)",
          }}
        >
          <ActivityIndicator color="#8BC34A" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function GolferParadise({
  searchQuery = "",
}: {
  searchQuery?: string;
}) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [posts, setPosts] = useState<ParadisePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [posting, setPosting] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("U");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeOptionsPostId, setActiveOptionsPostId] = useState<number | null>(
    null,
  );
  const [expandedComments, setExpandedComments] = useState<
    Record<number, boolean>
  >({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<
    Record<number, boolean>
  >({});
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    loadUserAvatar();
    const loadRole = async () => {
      const role = await AsyncStorage.getItem("role");
      setUserRole(role?.toLowerCase() || null);
    };
    loadRole();
  }, []);

  const loadUserAvatar = async () => {
    try {
      const avatar = await AsyncStorage.getItem("userAvatar");
      setUserAvatar(avatar);
      const name = await AsyncStorage.getItem("username");
      if (name) setUserName(name);
      const uidStr = await AsyncStorage.getItem("userId");
      if (uidStr) setCurrentUserId(parseInt(uidStr, 10));
    } catch (e) {}
  };

  const fetchPosts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await https.get("paradise?page=1&pageSize=20");
      setPosts(response.data || []);
    } catch (error) {
      console.error("Fetch Paradise error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      "Image Selection",
      "Would you like to crop the image or use the original?",
      [
        {
          text: "Crop (4:3)",
          onPress: () => pickImage(true),
        },
        {
          text: "Original (No Crop)",
          onPress: () => pickImage(false),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    );
  };

  const pickImage = async (allowsEditing: boolean) => {
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: "photo",
        cropping: allowsEditing,
        cropperChooseText: "Done/Submit",
        cropperToolbarTitle: "Edit Image",
      });

      setSelectedImage({
        uri: result.path,
        type: result.mime || "image/jpeg",
        fileName: result.filename || result.path.split('/').pop() || "image.jpg",
      } as any);
    } catch (error: any) {
      if (error.code !== "E_PICKER_CANCELLED") {
        console.error("Image picker error:", error);
      }
    }
  };

  const handlePost = async () => {
    if (!caption && !selectedImage) {
      Alert.alert("Error", "Please add some text or an image.");
      return;
    }

    try {
      setPosting(true);
      const formData = new FormData();

      if (selectedImage) {
        const uri = selectedImage.uri;
        const filename =
          selectedImage.fileName || uri.split("/").pop() || "image.jpg";
        const type = selectedImage.mimeType || "image/jpeg";
        formData.append("Images", { uri, name: filename, type } as any);
      }
      formData.append("Caption", caption);

      console.log("fff",formData);
      
      await postParadise(formData);
      // await https.post("paradise", formData, {
      //           headers: {
      //               "Content-Type": "multipart/form-data",
      //           },
      //       });

      setCaption("");
      setSelectedImage(null);
      fetchPosts();
    } catch (error: any) {
      console.error("Post error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to create post.\n" + error.response.data);
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                    try {
                      await https.delete(`paradise/${postId}`);
                      setPosts((prev) => prev.filter((p) => p.id !== postId));
                      setActiveOptionsPostId(null);
                    } catch (error) {
                      console.error("Delete error:", error);
                      Alert.alert("Error", "Failed to delete post.");
                    }
                    }
                }
            ]
        );
  };

  const handleLike = async (postId: number) => {
    try {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isLikedByMe: !p.isLikedByMe,
              likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1,
            };
          }
          return p;
        }),
      );
      await https.post(`paradise/like/${postId}`);
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const toggleComments = (postId: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = async (postId: number) => {
    const text = commentTexts[postId]?.trim();
    if (!text || submittingComment[postId]) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      await https.post(`paradise/comment/${postId}`, { text });
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      await fetchPosts(true);
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handlePressProfile = (userId: number) => {
    const path =
      userRole === "admin"
        ? `/(drawer)/(admin)/(tabs)/allMembers/${userId}`
        : `/(drawer)/(user)/(tabs)/dashboard/tabs/${userId}`;
    router.push(path as any);
  };

  if (loading && posts.length === 0) {
    return (
      <View className="py-20 items-center">
        <ActivityIndicator color="#8BC34A" size="large" />
      </View>
    );
  }

  return (
    <VStack space="md" className="pb-4">
      <Box
        className="p-4 rounded-2xl border"
        style={{
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
          borderRadius: 20,
          shadowColor: "#8BC34A",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 10,
        }}
      >
        <HStack space="md" className="items-start">
          <Box
            style={{
              width: 45,
              height: 45,
              borderRadius: 22.5,
              backgroundColor: isDark ? "#222" : "#eee",
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: "#8BC34A",
            }}
          >
            {userAvatar && userAvatar !== "null" ? (
              <Image
                source={{
                  uri: resolveMediaUrl(userAvatar),
                }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Text className="font-bold text-xl" style={{ color: "#8BC34A" }}>
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </Text>
            )}
          </Box>
          <VStack className="flex-1">
            <TextInput
              placeholder="What's on your mind, Golfer?"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              multiline
              style={{
                color: isDark ? "#fff" : "#111",
                fontSize: 16,
                minHeight: 60,
                textAlignVertical: "top",
                paddingTop: 4,
              }}
              value={caption}
              onChangeText={setCaption}
            />
            {selectedImage?.uri && (
              <Box
                className="mt-2 rounded-xl overflow-hidden relative"
                style={{ height: 150 }}
              >
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{ width: "100%", height: "100%" }}
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderRadius: 12,
                    padding: 4,
                  }}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </Box>
            )}
          </VStack>
        </HStack>
        <Divider
          className="my-3"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
          }}
        />
        <HStack className="justify-between items-center">
          <TouchableOpacity
            onPress={handlePickImage}
            className="flex-row items-center px-4 py-2 rounded-full"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6",
            }}
          >
            <Ionicons name="image-outline" size={20} color="#8BC34A" />
            <Text
              className="ml-2 font-bold"
              style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}
            >
              Upload Image
            </Text>
          </TouchableOpacity>
          <Pressable
            onPress={handlePost}
            disabled={posting || (!caption && !selectedImage)}
            style={{ borderRadius: 9999 }}
          >
            <LinearGradient
              colors={["#8bc34a", "#558b2f"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 24,
                height: 40,
                borderRadius: 9999,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#8bc34a",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
                opacity: posting || (!caption && !selectedImage) ? 0.6 : 1,
              }}
            >
              {posting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ color: "white", fontWeight: "800", fontSize: 14 }}>
                  Post
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </HStack>
      </Box>

      {posts.length > 0 && (
        <View style={{ paddingTop: 8 }}>
          {posts
            .filter((p) => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return (
                p.caption?.toLowerCase().includes(q) ||
                p.playerName?.toLowerCase().includes(q)
              );
            })
            .map((post) => (
              <View key={post.id}>
                <Box
                  className="rounded-2xl border"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark
                      ? "rgba(139, 195, 74, 0.35)"
                      : "rgba(139, 195, 74, 0.45)",
                    borderRadius: 20,
                    marginBottom: 16,
                    overflow: "hidden",
                    shadowColor: "#8BC34A",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 10,
                  }}
                >
                  <HStack className="p-4 items-center justify-between">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handlePressProfile(post.userId)}
                      className="flex-row items-center flex-1"
                    >
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: isDark ? "#222" : "#eee",
                          overflow: "hidden",
                          borderWidth: 1,
                          borderColor: "#8BC34A",
                        }}
                      >
                        {post.playerAvatar && post.playerAvatar !== "null" ? (
                          <Image
                            source={{
                              uri: resolveMediaUrl(post.playerAvatar),
                            }}
                            style={{ width: "100%", height: "100%" }}
                          />
                        ) : (
                          <Box className="items-center justify-center flex-1">
                            <Text
                              className="font-bold text-lg"
                              style={{ color: "#8BC34A" }}
                            >
                              {post.playerName
                                ? post.playerName.charAt(0).toUpperCase()
                                : "?"}
                            </Text>
                          </Box>
                        )}
                      </Box>
                      <VStack className="ml-3 flex-1">
                        <Text
                          className="font-bold text-base"
                          style={{ color: isDark ? "#fff" : "#111" }}
                        >
                          {post.playerName || "Unknown Golfer"}
                        </Text>
                        <Text
                          className="text-[10px]"
                          style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                        >
                          {formatPostDate(post.createdAt)}
                        </Text>
                      </VStack>
                    </TouchableOpacity>

                    <View style={{ position: "relative", zIndex: 10 }}>
                      <TouchableOpacity
                        onPress={() =>
                          setActiveOptionsPostId((prev) =>
                            prev === post.id ? null : post.id,
                          )
                        }
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={20}
                          color={isDark ? "#D1D5DB" : "#4B5563"}
                        />
                      </TouchableOpacity>

                      {activeOptionsPostId === post.id && (
                        <View
                          style={{
                            position: "absolute",
                            top: 30,
                            right: 0,
                            backgroundColor: isDark ? "#333" : "#fff",
                            borderRadius: 12,
                            padding: 8,
                            zIndex: 10,
                            elevation: 5,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            minWidth: 110,
                            borderWidth: 1,
                            borderColor: isDark
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.05)",
                          }}
                        >
                          {currentUserId && post.userId === currentUserId ? (
                            <TouchableOpacity
                              onPress={() => handleDeletePost(post.id)}
                              className="flex-row items-center p-2 rounded-lg"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                              }}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#EF4444"
                              />
                              <Text
                                className="ml-2 font-bold text-sm"
                                style={{ color: "#EF4444" }}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => {
                                setActiveOptionsPostId(null);
                                Alert.alert(
                                  "Report Post",
                                  "This post has been flagged for review.",
                                );
                              }}
                              className="flex-row items-center p-2 rounded-lg"
                              style={{
                                backgroundColor: isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "#F3F4F6",
                              }}
                            >
                              <Ionicons
                                name="flag-outline"
                                size={16}
                                color={isDark ? "#D1D5DB" : "#4B5563"}
                              />
                              <Text
                                className="ml-2 font-bold text-sm"
                                style={{
                                  color: isDark ? "#D1D5DB" : "#4B5563",
                                }}
                              >
                                Report
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </HStack>

                  <Box className="px-4 pb-3" style={{ zIndex: 1 }}>
                    {post.caption ? (
                      <Text
                        style={{ color: isDark ? "#E5E7EB" : "#374151" }}
                        className="text-sm mb-3"
                      >
                        {post.caption}
                      </Text>
                    ) : null}
                    {post.imageUrl ? (
                      <Box
                        className="rounded-xl overflow-hidden border"
                        style={{
                          borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                        }}
                      >
                        <PostImage
                          imageUrl={resolveMediaUrl(post.imageUrl)}
                          isDark={isDark}
                          onImagePress={() => {
                            setFullImageUrl(resolveMediaUrl(post.imageUrl));
                            setFullImageModalVisible(true);
                          }}
                        />
                      </Box>
                    ) : null}
                  </Box>

                  <Divider
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.03)",
                    }}
                  />
                  <HStack className="px-4 py-2 items-center">
                    <TouchableOpacity
                      onPress={() => handleLike(post.id)}
                      className="flex-row items-center mr-6 p-1"
                    >
                      <Ionicons
                        name={post.isLikedByMe ? "heart" : "heart-outline"}
                        size={22}
                        color={
                          post.isLikedByMe
                            ? "#EF4444"
                            : isDark
                              ? "#D1D5DB"
                              : "#4B5563"
                        }
                      />
                      <Text
                        className="ml-1 text-xs font-semibold"
                        style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}
                      >
                        {post.likeCount}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center p-1"
                      onPress={() => toggleComments(post.id)}
                    >
                      <Ionicons
                        name={
                          expandedComments[post.id]
                            ? "chatbubble"
                            : "chatbubble-outline"
                        }
                        size={20}
                        color={
                          expandedComments[post.id]
                            ? "#8BC34A"
                            : isDark
                              ? "#D1D5DB"
                              : "#4B5563"
                        }
                      />
                      <Text
                        className="ml-1 text-xs font-semibold"
                        style={{
                          color: expandedComments[post.id]
                            ? "#8BC34A"
                            : isDark
                              ? "#D1D5DB"
                              : "#4B5563",
                        }}
                      >
                        {post.commentCount}
                      </Text>
                    </TouchableOpacity>
                  </HStack>

                  {/* Inline Comments Section */}
                  {expandedComments[post.id] && (
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                        backgroundColor: isDark
                          ? "rgba(0,0,0,0.2)"
                          : "rgba(0,0,0,0.015)",
                        paddingHorizontal: 16,
                        paddingTop: 12,
                        paddingBottom: 14,
                      }}
                    >
                      {/* Comments list */}
                      {post.comments && post.comments.length > 0 ? (
                        <VStack space="sm" className="mb-3">
                          {post.comments.map((comment) => {
                            const commenterName =
                              comment.userName ||
                              comment.playerName ||
                              comment.user ||
                              "User";
                            const commentText =
                              comment.text || comment.comment || "";
                            return (
                              <TouchableOpacity
                                key={comment.id}
                                onPress={() =>
                                  handlePressProfile(comment.userId)
                                }
                                activeOpacity={0.7}
                              >
                                <HStack space="sm" className="items-start mb-2">
                                  <Box
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 16,
                                      backgroundColor: isDark
                                        ? "#333"
                                        : "#E5E7EB",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      overflow: "hidden",
                                      borderWidth: 1.5,
                                      borderColor: "rgba(139,195,74,0.4)",
                                      marginTop: 2,
                                    }}
                                  >
                                    {(comment.playerAvatar &&
                                      comment.playerAvatar !== "null") ||
                                    (comment.profilePictureUrl &&
                                      comment.profilePictureUrl !== "null") ? (
                                      <Image
                                        source={{
                                          uri: resolveMediaUrl(
                                            comment.playerAvatar ||
                                              comment.profilePictureUrl,
                                          ),
                                        }}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      />
                                    ) : (
                                      <Text
                                        className="font-bold text-xs"
                                        style={{ color: "#8BC34A" }}
                                      >
                                        {commenterName.charAt(0).toUpperCase()}
                                      </Text>
                                    )}
                                  </Box>
                                  <VStack
                                    className="flex-1 rounded-xl p-2.5 border"
                                    style={{
                                      backgroundColor: isDark
                                        ? "rgba(255,255,255,0.03)"
                                        : "#F9FAFB",
                                      borderColor: isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    <HStack className="items-center justify-between">
                                      <Text
                                        className="font-bold text-xs"
                                        style={{
                                          color: isDark ? "#fff" : "#111",
                                        }}
                                      >
                                        {commenterName}
                                      </Text>
                                      <Text
                                        className="text-[10px]"
                                        style={{
                                          color: isDark ? "#6B7280" : "#9CA3AF",
                                        }}
                                      >
                                        {formatCommentDate(comment.createdAt)}
                                      </Text>
                                    </HStack>
                                    <Text
                                      className="text-xs mt-1 leading-4"
                                      style={{
                                        color: isDark ? "#D1D5DB" : "#4B5563",
                                      }}
                                    >
                                      {commentText}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </TouchableOpacity>
                            );
                          })}
                        </VStack>
                      ) : (
                        <View
                          style={{
                            paddingVertical: 12,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                          >
                            No comments yet. Be the first to share your thoughts!
                          </Text>
                        </View>
                      )}

                      {/* Comment Input */}
                      <HStack className="items-center mt-1">
                        <Box
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: isDark ? "#222" : "#eee",
                            overflow: "hidden",
                            justifyContent: "center",
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: "#8BC34A",
                            marginRight: 8,
                          }}
                        >
                          {userAvatar && userAvatar !== "null" ? (
                            <Image
                              source={{
                                uri: resolveMediaUrl(userAvatar),
                              }}
                              style={{ width: "100%", height: "100%" }}
                            />
                          ) : (
                            <Text
                              className="font-bold text-xs"
                              style={{ color: "#8BC34A" }}
                            >
                              {userName ? userName.charAt(0).toUpperCase() : "U"}
                            </Text>
                          )}
                        </Box>
                        <TextInput
                          placeholder="Write a comment..."
                          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                          className="flex-1 text-xs h-15 px-3.5 rounded-full border"
                          style={{
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "#FFFFFF",
                            borderColor: isDark
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.08)",
                            color: isDark ? "#fff" : "#111",
                          }}
                          value={commentTexts[post.id] || ""}
                          onChangeText={(val) =>
                            setCommentTexts((prev) => ({
                              ...prev,
                              [post.id]: val,
                            }))
                          }
                          onSubmitEditing={() => handleAddComment(post.id)}
                          returnKeyType="send"
                        />
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={{ marginLeft: 8 }}
                          disabled={
                            submittingComment[post.id] ||
                            !commentTexts[post.id]?.trim()
                          }
                          onPress={() => handleAddComment(post.id)}
                        >
                          <LinearGradient
                            colors={["#8bc34a", "#558b2f"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              alignItems: "center",
                              justifyContent: "center",
                              shadowColor: "#8bc34a",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.35,
                              shadowRadius: 4,
                              elevation: 3,
                              opacity:
                                submittingComment[post.id] ||
                                !commentTexts[post.id]?.trim()
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            {submittingComment[post.id] ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons name="send" size={14} color="white" />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </HStack>
                    </View>
                  )}
                </Box>
              </View>
            ))}
        </View>
      )}

      {/* Full Image Preview Modal */}
      <Modal
        visible={fullImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setFullImageModalVisible(false)}
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              padding: 10,
            }}
          >
            <Ionicons name="close-circle" size={42} color="white" />
          </TouchableOpacity>

          {fullImageUrl && (
            <Image
              source={{ uri: fullImageUrl }}
              style={{ width: "100%", height: "80%" }}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </VStack>
  );
}
