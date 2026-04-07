import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
  Linking,
  BackHandler
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getUpdates, addUpdate, deleteUpdate, UpdateApi, getUserById } from "@/api/admin/dashboard";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { Skeleton } from "@/components/Skeleton";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function ManageImportantUpdates() {
  const [updates, setUpdates] = useState<UpdateApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imgErrorMap, setImgErrorMap] = useState<{ [key: number]: boolean }>({});
  const [imgLoadingMap, setImgLoadingMap] = useState<{ [key: number]: boolean }>({});

  const [content, setContent] = useState("");
  const [image, setImage] = useState<any>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [filter, setFilter] = useState<"mine" | "others">("mine");
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const horizontalScrollRef = React.useRef<ScrollView>(null);

  const fetchUpdates = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getUpdates();
      const sortedData = [...data].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUpdates(sortedData);
    } catch (err) {
      console.error("Failed to load updates:", err);
      Alert.alert("Error", "Failed to load updates.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      let username = await AsyncStorage.getItem("username");
      const role = await AsyncStorage.getItem("role");
      setUserRole(role);

      if (!username) {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const profile = await getUserById(Number(userId));
          if (profile) {
            username = profile.username;
            if (username) await AsyncStorage.setItem("username", username);
          }
        }
      }

      setCurrentUserName(username);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  };

  const handleBack = () => {
    const isAdmin = userRole?.toLowerCase() === "admin";
    const isSubAdmin = userRole?.toLowerCase().replace(/[^a-z]/g, '') === "subadmin";

    if (isSubAdmin) {
      router.navigate("/(drawer)/(subAdmin)/(tabs)/dashboard");
    } else if (isAdmin) {
      router.navigate("/(drawer)/(admin)/(tabs)/dashboard");
    } else {
      router.back();
    }
  };

  useEffect(() => {
    fetchUpdates();
    fetchCurrentUser();

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });

    return () => backHandler.remove();
  }, [userRole]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUpdates(true);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Permission required to access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handlePostUpdate = async () => {
    if (!content.trim() && !image) {
      Alert.alert("Error", "Please provide a message or an image.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("Content", content);
      if (linkUrl) {
        formData.append("LinkUrl", linkUrl);
      }

      if (image) {
        formData.append("UpdateImage", {
          uri: image.uri,
          name: image.fileName || "update.jpg",
          type: image.mimeType || "image/jpeg",
        } as any);
      }

      await addUpdate(formData);
      Alert.alert("Success", "Update posted successfully!");
      setModalVisible(false);
      resetForm();
      fetchUpdates();
    } catch (error) {
      console.error("Post Update Error:", error);
      Alert.alert("Error", "Failed to post update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Delete Update",
      "Are you sure you want to delete this update?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUpdate(id);
              fetchUpdates();
            } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert("Error", "Failed to delete update.");
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setContent("");
    setImage(null);
    setLinkUrl("");
  };

  const renderHeader = () => (
    <View className="flex-row items-center justify-between mb-6 mt-4 px-4">
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={handleBack}
          className="bg-[#8BC34A] rounded-full p-2 w-10 h-10 items-center justify-center mr-3"
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-black"}`}>
            Important Updates
          </Text>
          <Text className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Admin Control Panel
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="bg-[#8BC34A] rounded-xl px-4 py-2 flex-row items-center"
      >
        <Ionicons name="add" size={18} color="white" />
        <Text className="text-white font-bold ml-1 text-sm">Add Post</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
        <ThemedView style={{ flex: 1, backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)" }}>
          <Watermark />
          {renderHeader()}
          <ScrollView className="px-4">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="mb-4 p-4 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.7)",
                  borderWidth: 1,
                  borderColor: "rgba(139, 195, 74, 0.3)",
                }}
              >
                <Skeleton isDark={isDark} width="80%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton isDark={isDark} width="100%" height={16} style={{ marginBottom: 16 }} />
                <Skeleton isDark={isDark} width="100%" height={150} borderRadius={12} />
              </View>
            ))}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const renderUpdateCard = (update: UpdateApi) => (
    <View
      key={update.id}
      className="mb-6 p-5 rounded-3xl overflow-hidden"
      style={{
        backgroundColor: isDark ? "rgba(31,31,31,0.8)" : "rgba(255,255,255,0.9)",
        borderWidth: 1,
        borderColor: "rgba(139, 195, 74, 0.2)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      }}
    >
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <View className="bg-[#8BC34A]/20 px-3 py-1 rounded-full border border-[#8BC34A]/30 mr-2">
            <Text className="text-[#8BC34A] text-[10px] font-bold">ANNOUNCEMENT</Text>
          </View>
          <Text className="text-[10px] text-gray-500 font-medium">
            {new Date(update.createdAt).toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(update.id)}
          className="p-1"
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {update.content && (
        <Text className={`text-base leading-6 mb-4 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          {update.content}
        </Text>
      )}

      {(update as any).linkUrl && (
        <TouchableOpacity
          onPress={() => Linking.openURL((update as any).linkUrl)}
          className="mb-4 flex-row items-center bg-[#8BC34A]/10 p-3 rounded-xl border border-[#8BC34A]/20"
        >
          <Ionicons name="link-outline" size={18} color="#8BC34A" />
          <Text className="ml-2 text-[#8BC34A] font-semibold text-xs flex-1" numberOfLines={1}>
            {(update as any).linkUrl}
          </Text>
          <Ionicons name="open-outline" size={14} color="#8BC34A" />
        </TouchableOpacity>
      )}

      {update.mediaUrl && (
        <TouchableOpacity
          onPress={() => {
            const finalUrl = update.mediaUrl!.startsWith("http")
              ? update.mediaUrl!
              : `https://kolve18freeswing.com${update.mediaUrl}`;
            setFullImageUrl(finalUrl);
            setFullImageModalVisible(true);
          }}
          activeOpacity={0.9}
          style={{ width: "100%", height: 200, borderRadius: 20, overflow: "hidden", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", justifyContent: "center", alignItems: "center" }}
        >
          {imgLoadingMap[update.id] !== false && (
            <ActivityIndicator size="large" color="#8BC34A" style={{ position: "absolute" }} />
          )}
          {/* <Image
            source={{
              uri:
                !imgErrorMap[update.id]
                  ? update.mediaUrl.startsWith("http")
                    ? update.mediaUrl
                    : `https://kolve18freeswing.com${update.mediaUrl}`
                  // : "https://images.unsplash.com/photo-1535131749006-b7f58c99034b",
                  : undefined,
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onLoadStart={() => setImgLoadingMap(prev => ({ ...prev, [update.id]: true }))}
            onLoadEnd={() => setImgLoadingMap(prev => ({ ...prev, [update.id]: false }))}
            onError={() =>
              setImgErrorMap((prev) => ({
                ...prev,
                [update.id]: true,
              }))
            }
          /> */}
          {imgErrorMap[update.id] ? (
            // 🔴 FALLBACK UI
            <View
              style={{
                width: "100%",
                height: 200,
                borderRadius: 20,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="image-outline" size={40} color="#8BC34A" />
              <Text style={{ marginTop: 6, fontSize: 12, color: isDark ? "#aaa" : "#666" }}>
                Image not available
              </Text>
            </View>
          ) : (
            <Image
              source={{
                uri: update.mediaUrl.startsWith("http")
                  ? update.mediaUrl
                  : `https://kolve18freeswing.com${update.mediaUrl}`,
              }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              onLoadStart={() =>
                setImgLoadingMap((prev) => ({ ...prev, [update.id]: true }))
              }
              onLoadEnd={() =>
                setImgLoadingMap((prev) => ({ ...prev, [update.id]: false }))
              }
              onError={() =>
                setImgErrorMap((prev) => ({
                  ...prev,
                  [update.id]: true,
                }))
              }
            />
          )}
        </TouchableOpacity>
      )}

      <View className="mt-4 pt-4 border-t border-gray-100/10 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2">
            <Ionicons name="person" size={16} color="#666" />
          </View>
          <Text className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Posted by {update.authorName || 'Admin'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
      <ThemedView style={{ flex: 1, backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)" }}>
        <Watermark />
        {renderHeader()}
        {/* Filter Row */}
        <View className="px-4 mb-4 flex-row">
          <TouchableOpacity
            onPress={() => {
              setFilter("mine");
              horizontalScrollRef.current?.scrollTo({ x: 0, animated: true });
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              backgroundColor: filter === "mine" ? "#8BC34A" : (isDark ? "rgba(255,255,255,0.05)" : "#fff"),
              borderRadius: 12,
              alignItems: "center",
              marginRight: 8,
              borderWidth: 1,
              borderColor: filter === "mine" ? "#8BC34A" : (isDark ? "#333" : "#eee"),
            }}
          >
            <Text style={{ color: filter === "mine" ? "#fff" : (isDark ? "#aaa" : "#666"), fontWeight: "bold", fontSize: 13 }}>
              My Updates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setFilter("others");
              horizontalScrollRef.current?.scrollTo({ x: width, animated: true });
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              backgroundColor: filter === "others" ? "#8BC34A" : (isDark ? "rgba(255,255,255,0.05)" : "#fff"),
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: filter === "others" ? "#8BC34A" : (isDark ? "#333" : "#eee"),
            }}
          >
            <Text style={{ color: filter === "others" ? "#fff" : (isDark ? "#aaa" : "#666"), fontWeight: "bold", fontSize: 13 }}>
              Others
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => fetchUpdates(true)}
            style={{
              marginLeft: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "#333" : "#eee",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="sync" size={18} color="#8BC34A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            if (offsetX >= width * 0.5) {
              setFilter("others");
            } else {
              setFilter("mine");
            }
          }}
          contentContainerStyle={{ width: width * 2 }}
        >
          {/* Page 1: My Updates */}
          <ScrollView
            style={{ width: width }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8BC34A" />
            }
          >
            <View className="px-4 pb-20 mt-2">
              {updates
                .filter((u) => {
                  const normalize = (s: string | null | undefined): string => s?.toLowerCase().trim() || "";
                  const current = normalize(currentUserName);
                  const author = normalize(u.authorName);
                  return author === current;
                })
                .length === 0 ? (
                <View className="items-center justify-center mt-20 opacity-50">
                  <Ionicons name="notifications-off-outline" size={64} color={isDark ? "#fff" : "#8BC34A"} />
                  <Text className={`mt-4 text-center ${isDark ? "text-white" : "text-black"}`}>
                    No personal updates yet
                  </Text>
                </View>
              ) : (
                updates
                  .filter((u) => {
                    const normalize = (s: string | null | undefined): string => s?.toLowerCase().trim() || "";
                    const current = normalize(currentUserName);
                    const author = normalize(u.authorName);
                    return author === current;
                  })
                  .map((update) => renderUpdateCard(update))
              )}
            </View>
          </ScrollView>

          {/* Page 2: Others */}
          <ScrollView
            style={{ width: width }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8BC34A" />
            }
          >
            <View className="px-4 pb-20 mt-2">
              {updates
                .filter((u) => {
                  const normalize = (s: string | null | undefined): string => s?.toLowerCase().trim() || "";
                  const current = normalize(currentUserName);
                  const author = normalize(u.authorName);
                  return author !== current;
                })
                .length === 0 ? (
                <View className="items-center justify-center mt-20 opacity-50">
                  <Ionicons name="notifications-off-outline" size={64} color={isDark ? "#fff" : "#8BC34A"} />
                  <Text className={`mt-4 text-center ${isDark ? "text-white" : "text-black"}`}>
                    No community updates yet
                  </Text>
                </View>
              ) : (
                updates
                  .filter((u) => {
                    const normalize = (s: string | null | undefined): string => s?.toLowerCase().trim() || "";
                    const current = normalize(currentUserName);
                    const author = normalize(u.authorName);
                    return author !== current;
                  })
                  .map((update) => renderUpdateCard(update))
              )}
            </View>
          </ScrollView>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Box
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF" }
              ]}
            >
              <VStack space="lg" className="p-6">
                <HStack className="justify-between items-center mb-2">
                  <Text style={[styles.modalTitle, { color: isDark ? "#FFF" : "#000" }]}>
                    New Update
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={28} color={isDark ? "#AAA" : "#666"} />
                  </TouchableOpacity>
                </HStack>

                <VStack space="xs">
                  <Text style={[styles.inputLabel, { color: isDark ? "#CCC" : "#444" }]}>
                    Message Content
                  </Text>
                  <TextInput
                    placeholder="Type your announcement here..."
                    placeholderTextColor={isDark ? "#666" : "#999"}
                    multiline
                    numberOfLines={4}
                    value={content}
                    onChangeText={setContent}
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                        color: isDark ? "#FFF" : "#000",
                        borderColor: isDark ? "#444" : "#DDD"
                      }
                    ]}
                  />
                </VStack>

                <VStack space="xs">
                  <Text style={[styles.inputLabel, { color: isDark ? "#CCC" : "#444" }]}>
                    Attach Media (Optional)
                  </Text>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={[
                      styles.mediaPicker,
                      {
                        backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                        borderColor: isDark ? "#444" : "#DDD"
                      }
                    ]}
                  >
                    {image ? (
                      <View className="items-center">
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                        <Text style={{ color: "#8BC34A", marginTop: 8, fontSize: 12 }}>Change file</Text>
                      </View>
                    ) : (
                      <View className="items-center">
                        <Ionicons name="cloud-upload-outline" size={40} color={isDark ? "#666" : "#999"} />
                        <Text style={{ color: isDark ? "#666" : "#999", marginTop: 4, textAlign: 'center' }}>Supported: Images (JPG/PNG), PDFs, limits apply.</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </VStack>

                <VStack space="xs">
                  <Text style={[styles.inputLabel, { color: isDark ? "#CCC" : "#444" }]}>
                    Or specify Link URL
                  </Text>
                  <TextInput
                    placeholder="https://..."
                    placeholderTextColor={isDark ? "#666" : "#999"}
                    value={linkUrl}
                    onChangeText={setLinkUrl}
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                        color: isDark ? "#FFF" : "#000",
                        borderColor: isDark ? "#444" : "#DDD"
                      }
                    ]}
                  />
                  <Text className="text-[10px] text-gray-400 mt-1">
                    If you don't have a file, you can link to an external resource.
                  </Text>
                </VStack>

                <HStack space="md" className="mt-4 justify-end">
                  <Button
                    variant="outline"
                    onPress={() => setModalVisible(false)}
                    style={{ borderColor: "#8BC34A" }}
                  >
                    <Text style={{ color: "#8BC34A", fontWeight: "600" }}>Close</Text>
                  </Button>
                  <Button
                    className="bg-[#8BC34A] px-6"
                    onPress={handlePostUpdate}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold">Post Update</Text>
                    )}
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </View>
        </Modal>

        {/* Full Image Preview Modal */}
        <Modal
          visible={fullImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullImageModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => setFullImageModalVisible(false)}
              style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 }}
            >
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>

            {fullImageUrl && (
              <Image
                source={{ uri: fullImageUrl }}
                style={{ width: width, height: width * (4 / 3) }}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  textArea: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  mediaPicker: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
});
