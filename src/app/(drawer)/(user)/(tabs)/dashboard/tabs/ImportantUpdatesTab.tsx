import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  useColorScheme,
  Linking,
  Modal,
  Clipboard,
  Share,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { getUpdates, UpdateApi } from "@/api/modules/admin/dashboard.api";
import { Skeleton } from "@/components/Skeleton";
import { resolveMediaUrl } from "@/utils/mediaUtils";
import { parseUtcDate } from "@/utils/dateUtils";

const normalizeUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const openLink = async (url: string) => {
  try {
    const formatted = normalizeUrl(url);
    const canOpen = await Linking.canOpenURL(formatted);
    if (canOpen) {
      await Linking.openURL(formatted);
    } else {
      await Linking.openURL(formatted);
    }
  } catch (error) {
    console.warn("Could not open URL:", url, error);
    Toast.show({
      type: "error",
      text1: "Cannot Open Link",
      text2: "The link could not be opened on your device.",
    });
  }
};

const handleCopyContent = async (
  textToCopy?: string | null,
  isLink = false,
) => {
  if (!textToCopy) return;
  try {
    if (Clipboard && typeof Clipboard.setString === "function") {
      Clipboard.setString(textToCopy);
      Toast.show({
        type: "success",
        text1: isLink ? "Link Copied" : "Copied to Clipboard",
        text2: isLink
          ? "Link copied to clipboard."
          : "Update text copied successfully.",
      });
      return;
    }
  } catch (err) {
    console.log("Clipboard fallback to Share:", err);
  }

  try {
    await Share.share({
      message: textToCopy,
    });
  } catch (err) {
    console.log("Share error:", err);
  }
};

const getCardUrls = (
  content?: string | null,
  explicitLink?: string | null,
): string[] => {
  const urls: string[] = [];
  if (explicitLink && explicitLink.trim()) {
    urls.push(explicitLink.trim());
  }
  if (content) {
    const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const clean = match[0].replace(/[.,!?)]+$/, "").trim();
      if (clean && !urls.includes(clean)) {
        urls.push(clean);
      }
    }
  }
  return urls;
};

const renderFormattedContent = (
  content: string | null | undefined,
  isDark: boolean,
) => {
  if (!content) return null;

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts: { type: "text" | "link"; content: string; url?: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex, match.index),
      });
    }

    const rawUrl = match[0];
    const clean = rawUrl.replace(/[.,!?)]+$/, "");
    const trailing = rawUrl.substring(clean.length);

    parts.push({
      type: "link",
      content: clean,
      url: clean,
    });

    if (trailing) {
      parts.push({
        type: "text",
        content: trailing,
      });
    }

    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.substring(lastIndex),
    });
  }

  return (
    <Text
      selectable={true}
      style={{
        fontSize: 14,
        lineHeight: 22,
        color: isDark ? "#E2E8F0" : "#1E293B",
        marginBottom: 12,
      }}
    >
      {parts.map((part, idx) => {
        if (part.type === "link" && part.url) {
          const targetUrl = part.url;
          return (
            <Text
              key={idx}
              onPress={() => openLink(targetUrl)}
              suppressHighlighting={false}
              style={{
                color: "#8BC34A",
                fontWeight: "600",
                textDecorationLine: "underline",
              }}
            >
              {part.content}
            </Text>
          );
        }
        return <Text key={idx}>{part.content}</Text>;
      })}
    </Text>
  );
};

interface ImportantUpdatesTabProps {
  searchQuery?: string;
  isDark?: boolean;
  refreshing?: boolean;
}

export function ImportantUpdatesTab({
  searchQuery = "",
  isDark: propIsDark,
  refreshing: parentRefreshing,
}: ImportantUpdatesTabProps) {
  const [updates, setUpdates] = useState<UpdateApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrorMap, setImageErrorMap] = useState<{
    [key: number]: boolean;
  }>({});
  const [imageLoadingMap, setImageLoadingMap] = useState<{
    [key: number]: boolean;
  }>({});
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const systemColorScheme = useColorScheme();
  const isDark = propIsDark !== undefined ? propIsDark : systemColorScheme === "dark";

  const fetchUpdates = async (refresh = false) => {
    try {
      if (!refresh && updates.length === 0) setLoading(true);

      const data = await getUpdates();

      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setUpdates(sorted);
    } catch (err) {
      console.log("Error fetching important updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  useEffect(() => {
    if (parentRefreshing) {
      fetchUpdates(true);
    }
  }, [parentRefreshing]);

  const filteredUpdates = updates.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesContent = item.content?.toLowerCase().includes(query) ?? false;
    const matchesAuthor = item.authorName?.toLowerCase().includes(query) ?? false;
    return matchesContent || matchesAuthor;
  });

  if (loading && updates.length === 0) {
    return (
      <View className="w-full">
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
      </View>
    );
  }

  return (
    <View className="w-full">
      {filteredUpdates.length === 0 ? (
        <View className="items-center py-16 opacity-60">
          <Ionicons
            name="notifications-off-outline"
            size={56}
            color="#8BC34A"
          />
          <Text className="mt-4 text-gray-500 font-medium text-sm">
            {searchQuery
              ? "No matching updates found"
              : "No updates available"}
          </Text>
        </View>
      ) : (
        filteredUpdates.map((item) => (
          <View
            key={item.id}
            className="mb-5 p-4 rounded-2xl"
            style={{
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              borderWidth: 1,
              borderColor: "rgba(139,195,74,0.2)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
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
                  <Text
                    selectable={true}
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: isDark ? "#fff" : "#000",
                    }}
                  >
                    {item.authorName || "Admin"}
                  </Text>
                  <Text
                    selectable={true}
                    style={{ fontSize: 11, color: "#888" }}
                  >
                    {parseUtcDate(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* {item.content ? (
                  <TouchableOpacity
                    onPress={() => handleCopyContent(item.content)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark
                        ? "rgba(139, 195, 74, 0.15)"
                        : "rgba(139, 195, 74, 0.12)",
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={12}
                      color="#8BC34A"
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#8BC34A",
                        marginLeft: 4,
                      }}
                    >
                      Copy
                    </Text>
                  </TouchableOpacity>
                ) : null} */}

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="megaphone" size={14} color="#F59E0B" />
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#F59E0B",
                      marginLeft: 4,
                    }}
                  >
                    Priority
                  </Text>
                </View>
              </View>
            </View>

            {item.content
              ? renderFormattedContent(item.content, isDark)
              : null}

            {(() => {
              const cardUrls = getCardUrls(
                item.content,
                (item as any).linkUrl,
              );
              if (cardUrls.length === 0) return null;

              return (
                <View style={{ marginBottom: 12, gap: 8 }}>
                  {cardUrls.map((url, urlIdx) => (
                    <TouchableOpacity
                      key={urlIdx}
                      onPress={() => openLink(url)}
                      onLongPress={() => handleCopyContent(url, true)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isDark
                          ? "rgba(139, 195, 74, 0.12)"
                          : "rgba(139, 195, 74, 0.08)",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "rgba(139, 195, 74, 0.25)",
                      }}
                    >
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: "#8BC34A20",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name="globe-outline"
                          size={16}
                          color="#8BC34A"
                        />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          numberOfLines={1}
                          selectable={true}
                          style={{
                            color: "#8BC34A",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          {url}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: isDark ? "#94A3B8" : "#64748B",
                          }}
                        >
                          Tap to open link (Hold to copy)
                        </Text>
                      </View>
                      <Ionicons
                        name="open-outline"
                        size={18}
                        color="#8BC34A"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}

            {item.mediaUrl &&
              (() => {
                const finalUrl = resolveMediaUrl(item.mediaUrl);

                if (imageErrorMap[item.id]) {
                  return (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(finalUrl)}
                      className="flex-row items-center bg-[#8BC34A]/10 p-3 rounded-xl mb-3 border border-dashed border-[#8BC34A]/30"
                    >
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color="#8BC34A"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-[#8BC34A] font-bold text-sm">
                          Image Attachment Available
                        </Text>
                        <Text className="text-[#8BC34A]/70 text-[10px]">
                          Tap to view online
                        </Text>
                      </View>
                      <Ionicons
                        name="open-outline"
                        size={16}
                        color="#8BC34A"
                      />
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
                    style={{
                      width: "100%",
                      height: 180,
                      borderRadius: 12,
                      overflow: "hidden",
                      position: "relative",
                      marginBottom: 12,
                    }}
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
                      resizeMode="contain"
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
                        }))
                      }}
                    />
                  </TouchableOpacity>
                );
              })()}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="notifications" size={14} color="#8BC34A" />
                <Text
                  style={{ fontSize: 12, color: "#8BC34A", marginLeft: 4 }}
                >
                  Announcement
                </Text>
              </View>

              <Text
                selectable={true}
                style={{ fontSize: 12, color: "#888" }}
              >
                by {item.authorName || "Admin"}
              </Text>
            </View>
          </View>
        ))
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
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

export default ImportantUpdatesTab;
