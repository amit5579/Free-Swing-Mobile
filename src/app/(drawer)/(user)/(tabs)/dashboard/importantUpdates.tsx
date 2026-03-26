import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUpdates, UpdateItem } from "@/api/dashboard";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { Skeleton } from "@/components/Skeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function ImportantUpdates() {
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const fetchUpdates = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const data = await getUpdates();
            setUpdates(data);
            
            // Load seen IDs
            const stored = await AsyncStorage.getItem("seen_updates");
            if (stored) {
                setSeenIds(new Set(JSON.parse(stored)));
            }
        } catch (err) {
            setError("Failed to load updates.");
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    const markAllAsRead = async () => {
        const allIds = updates.map(u => u.id);
        const newSeenIds = new Set([...Array.from(seenIds), ...allIds]);
        setSeenIds(newSeenIds);
        await AsyncStorage.setItem("seen_updates", JSON.stringify(Array.from(newSeenIds)));
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchUpdates(true);
    };

    const isNewlyUpdate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        return diffInHours < 48; // New if within 48 hours
    };

    const unreadCount = updates.filter(u => !seenIds.has(u.id)).length;

    const renderHeader = () => (
        <View className="flex-row items-center justify-between mb-6 mt-4 px-4">
            <View className="flex-row items-center">
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="bg-[#8BC34A] rounded-full p-2 w-10 h-10 items-center justify-center mr-3"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View>
                    <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                        Important Updates
                    </Text>
                    <View className="flex-row items-center">
                        <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Latest announcements
                        </Text>
                        {unreadCount > 0 && (
                            <View className="ml-2 bg-red-500 px-1.5 py-0.5 rounded-md">
                                <Text className="text-[10px] text-white font-bold">{unreadCount} Unread</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            <TouchableOpacity 
                onPress={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
            >
                {refreshing ? (
                    <ActivityIndicator size="small" color="#8BC34A" />
                ) : (
                    <Ionicons name="sync" size={24} color="#8BC34A" />
                )}
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
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
                            <Skeleton isDark={isDark} width="100%" height={16} style={{ marginBottom: 4 }} />
                            <Skeleton isDark={isDark} width="90%" height={16} style={{ marginBottom: 16 }} />
                            <Skeleton isDark={isDark} width="100%" height={150} borderRadius={12} />
                        </View>
                    ))}
                </ScrollView>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={{ flex: 1, backgroundColor: isDark ? "transparent" : "rgba(255, 255, 255, 0.7)" }}>
            <Watermark />
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderHeader()}

                <View className="px-4 pb-20">
                    {unreadCount > 0 && (
                        <TouchableOpacity 
                            onPress={markAllAsRead}
                            className="mb-4 flex-row items-center justify-center py-2 rounded-xl bg-[#8BC34A]/10 border border-[#8BC34A]/20"
                        >
                            <Ionicons name="mail-open-outline" size={16} color="#8BC34A" />
                            <Text className="ml-2 text-[#8BC34A] font-semibold text-xs">Mark all as read</Text>
                        </TouchableOpacity>
                    )}

                    {updates.length === 0 ? (
                        <View className="items-center justify-center mt-20 opacity-50">
                            <Ionicons name="notifications-off-outline" size={64} color={isDark ? "#fff" : "#8BC34A"} />
                            <Text className={`mt-4 text-center ${isDark ? "text-white" : "text-black"}`}>
                                No updates at the moment
                            </Text>
                        </View>
                    ) : (
                        updates.map((update) => {
                            const isNew = isNewlyUpdate(update.createdAt);
                            const isRead = seenIds.has(update.id);
                            
                            return (
                                <TouchableOpacity 
                                    key={update.id} 
                                    activeOpacity={0.9}
                                    onPress={async () => {
                                        if (!isRead) {
                                            const newSeenIds = new Set([...Array.from(seenIds), update.id]);
                                            setSeenIds(newSeenIds);
                                            await AsyncStorage.setItem("seen_updates", JSON.stringify(Array.from(newSeenIds)));
                                        }
                                    }}
                                    className="mb-6 p-5 rounded-3xl overflow-hidden"
                                    style={{
                                        backgroundColor: isDark ? "rgba(31,31,31,0.8)" : "rgba(255,255,255,0.9)",
                                        borderWidth: 1,
                                        borderColor: isRead ? "rgba(139, 195, 74, 0.2)" : "rgba(139, 195, 74, 0.5)",
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 10,
                                        // elevation: 3,
                                    }}
                                >
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-row items-center">
                                            <View className="bg-[#8BC34A]/20 px-3 py-1 rounded-full border border-[#8BC34A]/30 mr-2">
                                                <Text className="text-[#8BC34A] text-[10px] font-bold">ANNOUNCEMENT</Text>
                                            </View>
                                            {!isRead && (
                                                <View className="bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                                                    <Text className="text-blue-500 text-[10px] font-bold">UNREAD</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="flex-row items-center">
                                            {isNew && (
                                                <View className="bg-red-500 px-2 py-0.5 rounded-md mr-2">
                                                    <Text className="text-white text-[10px] font-bold">NEW</Text>
                                                </View>
                                            )}
                                            <Text className="text-[10px] text-gray-500 font-medium">
                                                {new Date(update.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>

                                    {update.content && (
                                        <Text className={`text-base leading-6 mb-4 ${isDark ? "text-gray-200" : "text-gray-800"} ${!isRead ? "font-semibold" : "font-normal"}`}>
                                            {update.content}
                                        </Text>
                                    )}

                                    {update.mediaUrl && (
                                        <Image 
                                            source={{ uri: update.mediaUrl.startsWith('http') ? update.mediaUrl : `https://kolve18freeswing.com${update.mediaUrl}` }}
                                            style={{ width: '100%', height: 200, borderRadius: 20 }}
                                            resizeMode="cover"
                                        />
                                    )}

                                    <View className="mt-4 pt-4 border-t border-gray-100/10 flex-row items-center justify-between">
                                        <View className="flex-row items-center">
                                            <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2">
                                                <Text className="text-xs font-bold">{update.authorName?.[0] || 'A'}</Text>
                                            </View>
                                            <Text className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                Posted by {update.authorName || 'Administrator'}
                                            </Text>
                                        </View>
                                        {isRead && (
                                            <View className="flex-row items-center opacity-50">
                                                <Ionicons name="checkmark-done" size={14} color="#8BC34A" />
                                                <Text className="text-[10px] ml-1 text-gray-500">Read</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}
