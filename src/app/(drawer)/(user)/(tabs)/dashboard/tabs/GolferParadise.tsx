import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, useColorScheme, ActivityIndicator, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Divider } from "@/components/divider";
import { Button, ButtonText } from "@/components/button";
import * as ImagePicker from "expo-image-picker";
import https from "@/api/https";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const PostImage = ({ imageUrl, isDark, onImagePress }: { imageUrl: string; isDark: boolean; onImagePress?: () => void }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <View style={{ width: '100%', aspectRatio: 4 / 3, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                <Ionicons name="image-outline" size={32} color={isDark ? "#6B7280" : "#9CA3AF"} />
                <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 8 }}>Image not available</Text>
            </View>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onImagePress}
            style={{ width: '100%', aspectRatio: 4 / 3, position: 'relative' }}
        >
            <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
            {isLoading && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                    <ActivityIndicator color="#8BC34A" />
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function GolferParadise({ searchQuery = "" }: { searchQuery?: string }) {
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
    const [activeOptionsPostId, setActiveOptionsPostId] = useState<number | null>(null);
    const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
    const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
    const [commentModalPostId, setCommentModalPostId] = useState<number | null>(null);
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
            const name = await AsyncStorage.getItem("username");
            if (name) setUserName(name);
            const uidStr = await AsyncStorage.getItem("userId");
            if (uidStr) setCurrentUserId(parseInt(uidStr, 10));
        } catch (e) { }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await https.get("paradise?page=1&pageSize=20");
            setPosts(response.data || []);
        } catch (error) {
            console.error("Fetch Paradise error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
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
            formData.append("Caption", caption.trim());

            if (selectedImage) {
                const uri = selectedImage.uri;
                const filename = selectedImage.fileName || uri.split('/').pop() || "image.jpg";
                const type = selectedImage.mimeType || "image/jpeg";
                formData.append("Images", { uri, name: filename, type } as any);
            }

            await https.post("paradise", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setCaption("");
            setSelectedImage(null);
            fetchPosts();
        } catch (error: any) {
            console.error("Post error:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to create post.");
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
                            setPosts(prev => prev.filter(p => p.id !== postId));
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
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        isLikedByMe: !p.isLikedByMe,
                        likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1
                    };
                }
                return p;
            }));
            await https.post(`paradise/like/${postId}`);
        } catch (error) {
            console.error("Like error:", error);
        }
    };

    const handleAddComment = async (postId: number) => {
        const text = commentTexts[postId];
        if (!text) return;

        try {
            await https.post(`paradise/comment/${postId}`, { text });
            setCommentTexts(prev => ({ ...prev, [postId]: "" }));
            await fetchPosts();
        } catch (error) {
            console.error("Comment error:", error);
        }
    };

    const handlePressProfile = (userId: number) => {
        const path = userRole === 'admin'
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
                    backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.7)",
                    borderColor: "rgba(139, 195, 74, 0.3)",
                    shadowColor: "#000",
                    // shadowOffset: { width: 0, height: 4 },
                    // shadowOpacity: 0.1,
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
                            borderColor: "#8BC34A"
                        }}
                    >
                        {userAvatar && userAvatar !== "null" ? (
                            <Image source={{ uri: userAvatar.startsWith('http') ? userAvatar : `https://kolve18freeswing.com${userAvatar}` }} style={{ width: "100%", height: "100%" }} />
                        ) : (
                            <Text className="font-bold text-xl" style={{ color: "#8BC34A" }}>{userName ? userName.charAt(0).toUpperCase() : "U"}</Text>
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
                                textAlignVertical: 'top',
                                paddingTop: 4
                            }}
                            value={caption}
                            onChangeText={setCaption}
                        />
                        {selectedImage?.uri && (
                            <Box className="mt-2 rounded-xl overflow-hidden relative" style={{ height: 150 }}>
                                <Image source={{ uri: selectedImage.uri }} style={{ width: '100%', height: '100%' }} />
                                <TouchableOpacity
                                    onPress={() => setSelectedImage(null)}
                                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}
                                >
                                    <Ionicons name="close" size={16} color="white" />
                                </TouchableOpacity>
                            </Box>
                        )}
                    </VStack>
                </HStack>
                <Divider className="my-3" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }} />
                <HStack className="justify-between items-center">
                    <TouchableOpacity
                        onPress={handlePickImage}
                        className="flex-row items-center px-4 py-2 rounded-full"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6" }}
                    >
                        <Ionicons name="image-outline" size={20} color="#8BC34A" />
                        <Text className="ml-2 font-bold" style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}>Upload Image</Text>
                    </TouchableOpacity>
                    <Button
                        size="sm"
                        onPress={handlePost}
                        disabled={posting || (!caption && !selectedImage)}
                        className="rounded-full px-6 h-10"
                        style={{ backgroundColor: "#8BC34A", opacity: posting ? 0.6 : 1 }}
                    >
                        {posting ? <ActivityIndicator color="white" size="small" /> : <ButtonText className="font-bold">Post</ButtonText>}
                    </Button>
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
                                        backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.7)",
                                        borderColor: "rgba(139, 195, 74, 0.3)",
                                        marginBottom: 16,
                                        overflow: 'hidden'
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
                                                    borderColor: "#8BC34A"
                                                }}
                                            >
                                                {post.playerAvatar && post.playerAvatar !== "null" ? (
                                                    <Image source={{ uri: post.playerAvatar.startsWith('http') ? post.playerAvatar : `https://kolve18freeswing.com${post.playerAvatar}` }} style={{ width: "100%", height: "100%" }} />
                                                ) : (
                                                    <Box className="items-center justify-center flex-1">
                                                        <Text className="font-bold text-lg" style={{ color: "#8BC34A" }}>{post.playerName ? post.playerName.charAt(0).toUpperCase() : "?"}</Text>
                                                    </Box>
                                                )}
                                            </Box>
                                            <VStack className="ml-3 flex-1">
                                                <Text className="font-bold text-base" style={{ color: isDark ? "#fff" : "#111" }}>{post.playerName || "Unknown Golfer"}</Text>
                                                <Text className="text-[10px]" style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
                                                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""} • {post.createdAt ? new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                                </Text>
                                            </VStack>
                                        </TouchableOpacity>

                                        <View style={{ position: 'relative', zIndex: 10 }}>
                                            <TouchableOpacity onPress={() => setActiveOptionsPostId(prev => prev === post.id ? null : post.id)} style={{ padding: 4 }}>
                                                <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? "#D1D5DB" : "#4B5563"} />
                                            </TouchableOpacity>

                                            {activeOptionsPostId === post.id && (
                                                <View style={{ position: 'absolute', top: 30, right: 0, backgroundColor: isDark ? '#333' : '#fff', borderRadius: 12, padding: 8, zIndex: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, minWidth: 110, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                                            {(currentUserId && post.userId === currentUserId) || post.canDelete ? (
                                                        <TouchableOpacity onPress={() => handleDeletePost(post.id)} className="flex-row items-center p-2 rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                                                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                            <Text className="ml-2 font-bold text-sm" style={{ color: "#EF4444" }}>Delete</Text>
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <TouchableOpacity onPress={() => { setActiveOptionsPostId(null); Alert.alert("Report Post", "This post has been flagged for review."); }} className="flex-row items-center p-2 rounded-lg" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6" }}>
                                                            <Ionicons name="flag-outline" size={16} color={isDark ? "#D1D5DB" : "#4B5563"} />
                                                            <Text className="ml-2 font-bold text-sm" style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}>Report</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </HStack>

                                    <Box className="px-4 pb-3" style={{ zIndex: 1 }}>
                                        {post.caption ? (
                                            <Text style={{ color: isDark ? "#E5E7EB" : "#374151" }} className="text-sm mb-3">
                                                {post.caption}
                                            </Text>
                                        ) : null}
                                        {post.imageUrl ? (
                                            <Box className="rounded-xl overflow-hidden border" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                                                <PostImage
                                                    imageUrl={post.imageUrl.startsWith('http') ? post.imageUrl : `https://kolve18freeswing.com${post.imageUrl}`}
                                                    isDark={isDark}
                                                    onImagePress={() => {
                                                        setFullImageUrl(post.imageUrl!.startsWith("http") ? post.imageUrl! : `https://kolve18freeswing.com${post.imageUrl}`);
                                                        setFullImageModalVisible(true);
                                                    }}
                                                />
                                            </Box>
                                        ) : null}
                                    </Box>

                                    <Divider style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
                                    <HStack className="px-4 py-2 items-center">
                                        <TouchableOpacity
                                            onPress={() => handleLike(post.id)}
                                            className="flex-row items-center mr-6 p-1"
                                        >
                                            <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={22} color={post.isLikedByMe ? "#EF4444" : (isDark ? "#D1D5DB" : "#4B5563")} />
                                            <Text className="ml-1 text-xs font-semibold" style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}>{post.likeCount}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity className="flex-row items-center p-1" onPress={() => setCommentModalPostId(post.id)}>
                                            <Ionicons name="chatbubble-outline" size={20} color={isDark ? "#D1D5DB" : "#4B5563"} />
                                            <Text className="ml-1 text-xs font-semibold" style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}>{post.commentCount}</Text>
                                        </TouchableOpacity>
                                    </HStack>
                                </Box>

                            </View>
                        ))}
                </View>
            )}

            {commentModalPostId && (
                <Modal
                    visible={!!commentModalPostId}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setCommentModalPostId(null)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                    >
                        <Pressable style={{ flex: 1 }} onPress={() => setCommentModalPostId(null)} />

                        <Box style={{ backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%" }}>
                            <HStack className="px-5 py-4 border-b items-center justify-between" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                                <Text className="font-bold text-lg" style={{ color: isDark ? "#fff" : "#111" }}>Comments</Text>
                                <TouchableOpacity onPress={() => setCommentModalPostId(null)} style={{ padding: 4, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6", borderRadius: 12 }}>
                                    <Ionicons name="close" size={20} color={isDark ? "#fff" : "#6b7280"} />
                                </TouchableOpacity>
                            </HStack>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                                {posts.find(p => p.id === commentModalPostId)?.comments?.length === 0 ? (
                                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                        <Ionicons name="chatbubbles-outline" size={48} color={isDark ? "#333" : "#E5E7EB"} />
                                        <Text className="mt-4 font-semibold" style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>No comments yet.</Text>
                                        <Text className="text-sm mt-1" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}>Be the first to share your thoughts!</Text>
                                    </View>
                                ) : (
                                    posts.find(p => p.id === commentModalPostId)?.comments?.map(comment => {
                                        const commenterName = comment.userName || comment.playerName || comment.user || "User";
                                        const commentText = comment.text || comment.comment || "";
                                        return (
                                            <TouchableOpacity
                                                key={comment.id}
                                                onPress={() => {
                                                    setCommentModalPostId(null);
                                                    handlePressProfile(comment.userId);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <HStack space="md" className="mb-4 items-start">
                                                    <Box
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 18,
                                                            backgroundColor: isDark ? "#333" : "#E5E7EB",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            overflow: "hidden",
                                                            borderWidth: 1.5,
                                                            borderColor: "rgba(139,195,74,0.4)"
                                                        }}
                                                    >
                                                        {((comment.playerAvatar && comment.playerAvatar !== "null") || (comment.profilePictureUrl && comment.profilePictureUrl !== "null")) ? (
                                                            <Image
                                                                source={{ uri: (comment.playerAvatar || comment.profilePictureUrl)!.startsWith('http') ? (comment.playerAvatar || comment.profilePictureUrl)! : `https://kolve18freeswing.com${comment.playerAvatar || comment.profilePictureUrl}` }}
                                                                style={{ width: "100%", height: "100%" }}
                                                            />
                                                        ) : (
                                                            <Text className="font-bold text-xs" style={{ color: "#8BC34A" }}>
                                                                {commenterName.charAt(0).toUpperCase()}
                                                            </Text>
                                                        )}
                                                    </Box>
                                                    <VStack className="flex-1 bg-transparent rounded-xl p-3 border" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB", borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                                                        <Text className="font-bold text-xs" style={{ color: isDark ? "#fff" : "#111" }}>{commenterName}</Text>
                                                        <Text className="text-xs mt-1" style={{ color: isDark ? "#D1D5DB" : "#4B5563" }}>{commentText}</Text>
                                                        <Text className="text-[10px] mt-2" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}>{new Date(comment.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</Text>
                                                    </VStack>
                                                </HStack>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>

                            <HStack className="px-4 py-3 pb-8 items-center border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", backgroundColor: isDark ? "#1A1A1A" : "#fff" }}>
                                <TextInput
                                    placeholder="Write a comment..."
                                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                                    className="flex-1 text-sm h-10 px-4 rounded-full"
                                    style={{
                                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6",
                                        color: isDark ? "#fff" : "#111"
                                    }}
                                    value={commentTexts[commentModalPostId] || ""}
                                    onChangeText={(val) => setCommentTexts(prev => ({ ...prev, [commentModalPostId]: val }))}
                                />
                                <TouchableOpacity
                                    className="ml-3 w-10 h-10 items-center justify-center rounded-full"
                                    style={{ backgroundColor: "#8BC34A" }}
                                    onPress={() => {
                                        handleAddComment(commentModalPostId);
                                        // Optional: Wait for refresh or ignore
                                    }}
                                >
                                    <Ionicons name="send" size={16} color="white" />
                                </TouchableOpacity>
                            </HStack>
                        </Box>
                    </KeyboardAvoidingView>
                </Modal>
            )}

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
                            contentFit="contain"
                        />
                    )}
                </View>
            </Modal>
        </VStack>
    );
}
