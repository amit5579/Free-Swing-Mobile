import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getUpdates, UpdateApi } from "@/api/admin/dashboard";
import { useRouter } from "expo-router";
import { Skeleton } from "@/components/Skeleton";

export default function ImportantUpdatesUser() {
  const [updates, setUpdates] = useState<UpdateApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<{ [key: number]: boolean }>({});
  const [imageLoadingMap, setImageLoadingMap] = useState<{ [key: number]: boolean }>({});
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const fetchUpdates = async (refresh = false) => {
    try {
      if (!refresh) setLoading(true);

      const data = await getUpdates();

      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setUpdates(sorted);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 500);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView className="px-4 pt-4">

          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="mb-5 p-4 rounded-2xl"
              style={{
                backgroundColor: isDark ? "#1A1A1A" : "#FFF",
                borderWidth: 1,
                borderColor: "rgba(139,195,74,0.2)",
              }}
            >
              <Skeleton
                isDark={isDark}
                width="40%"
                height={12}
                style={{ marginBottom: 10 }}
              />

              <Skeleton
                isDark={isDark}
                width="90%"
                height={16}
                style={{ marginBottom: 6 }}
              />

              <Skeleton
                isDark={isDark}
                width="70%"
                height={16}
                style={{ marginBottom: 12 }}
              />

              <Skeleton
                isDark={isDark}
                width="100%"
                height={180}
                borderRadius={12}
                style={{ marginBottom: 12 }}
              />

              <Skeleton
                isDark={isDark}
                width="60%"
                height={14}
                borderRadius={8}
              />
            </View>
          ))}

        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#FFF", }}>

      <View className="flex-row items-center px-4 py-3">

        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#8BC34A" />
        </TouchableOpacity>

        <Text
          className={`ml-3 text-2xl font-bold ${isDark ? "text-white" : "text-black"
            }`}
        >
          Important Updates
        </Text>

      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUpdates(true);
            }}
            tintColor="#8BC34A"
          />
        }
      >
        <View className="px-4 pb-10">

          {updates.length === 0 ? (
            <View className="items-center mt-20 opacity-60">
              <Ionicons name="notifications-off-outline" size={60} color="#8BC34A" />
              <Text className="mt-4 text-gray-500">
                No updates available
              </Text>
            </View>
          ) : (
            updates.map((item) => (
              <View
                key={item.id}
                className="mb-5 p-4 rounded-2xl"
                style={{
                  backgroundColor: isDark ? "#1A1A1A" : "#FFF",
                  borderWidth: 1,
                  borderColor: "rgba(139,195,74,0.2)",
                }}
              >

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>

                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#8BC34A20",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 8,
                      }}
                    >
                      <Ionicons name="person" size={18} color="#8BC34A" />
                    </View>

                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "bold", color: isDark ? "#fff" : "#000" }}>
                        {item.authorName || "Admin"}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#888" }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="megaphone" size={14} color="#F59E0B" />
                    <Text style={{ fontSize: 11, color: "#F59E0B", marginLeft: 4 }}>
                      Priority
                    </Text>
                  </View>
                </View>

                {item.content && (
                  <Text
                    className={`mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}
                  >
                    {item.content}
                  </Text>
                )}

                {(item as any).linkUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL((item as any).linkUrl)}
                    className="flex-row items-center bg-[#8BC34A]/10 p-2 rounded-lg mb-3"
                  >
                    <Ionicons name="link-outline" size={16} color="#8BC34A" />
                    <Text
                      numberOfLines={1}
                      className="ml-2 text-[#8BC34A] text-xs flex-1"
                    >
                      {(item as any).linkUrl}
                    </Text>
                  </TouchableOpacity>
                )}

                {item.mediaUrl && (
                  (() => {
                    const finalUrl = item.mediaUrl.startsWith("http")
                      ? item.mediaUrl
                      : `https://kolve18freeswing.com${item.mediaUrl}`;

                    if (imageErrorMap[item.id]) {
                      return (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(finalUrl)}
                          className="flex-row items-center bg-[#8BC34A]/10 p-3 rounded-xl mb-3 border border-dashed border-[#8BC34A]/30"
                        >
                          <Ionicons name="image-outline" size={20} color="#8BC34A" />
                          <View className="ml-3 flex-1">
                            <Text className="text-[#8BC34A] font-bold text-sm">Image Attachment Available</Text>
                            <Text className="text-[#8BC34A]/70 text-[10px]">Tap to view online</Text>
                          </View>
                          <Ionicons name="open-outline" size={16} color="#8BC34A" />
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setFullImageUrl(finalUrl);
                          setFullImageModalVisible(true);
                        }}
                        activeOpacity={0.9}
                        style={{ width: "100%", height: 180, borderRadius: 12, overflow: "hidden", position: "relative", marginBottom: 12 }}
                      >
                        {imageLoadingMap[item.id] !== false && (
                          <View
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                              zIndex: 1,
                            }}
                          >
                            <ActivityIndicator size="small" color="#8BC34A" />
                          </View>
                        )}
                        <Image
                          source={{ uri: finalUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                          onLoad={() =>
                            setImageLoadingMap((prev) => ({
                              ...prev,
                              [item.id]: false,
                            }))
                          }
                          onError={() => {
                            setImageErrorMap((prev) => ({
                              ...prev,
                              [item.id]: true,
                            }));
                            setImageLoadingMap((prev) => ({
                              ...prev,
                              [item.id]: false,
                            }));
                          }}
                        />
                      </TouchableOpacity>
                    );
                  })()
                )}

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="notifications" size={14} color="#8BC34A" />
                    <Text style={{ fontSize: 12, color: "#8BC34A", marginLeft: 4 }}>
                      Announcement
                    </Text>
                  </View>

                  <Text style={{ fontSize: 12, color: "#888" }}>
                    by {item.authorName || "Admin"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Full Image Preview Modal */}
      <Modal
        visible={fullImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setFullImageModalVisible(false)}
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 }}
          >
            <Ionicons name="close-circle" size={42} color="white" />
          </TouchableOpacity>

          {fullImageUrl && (
            <Image
              source={{ uri: fullImageUrl }}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}