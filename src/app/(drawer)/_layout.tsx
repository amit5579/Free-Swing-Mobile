import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken } from "@/utils/storage";
import { getUserProfile, UserProfile, getUpdates } from "@/api/dashboard";
import { Linking } from "react-native";

function CustomDrawerContent({ navigation }: any) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [imageError, setImageError] = useState(false);
  const [unreadUpdates, setUnreadUpdates] = useState(0);
  const logout = async () => {
    await removeToken();
  };
  const fetchProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) return;

      const data = await getUserProfile(Number(userId));
      if (
        data.profilePictureUrl != null ||
        data.username != null ||
        data.handicap
      )
        setProfile(data);
    } catch (error) {
      console.log("Profile error:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const updates = await getUpdates();
      const stored = await AsyncStorage.getItem("seen_updates");
      const seenIds = new Set(stored ? JSON.parse(stored) : []);
      const count = updates.filter(u => !seenIds.has(u.id)).length;
      setUnreadUpdates(count);
    } catch (error) {
      console.log("Unread count error:", error);
    }
  };

  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");

      if (storedRole === "Admin") {
        setIsAdmin(true);
      }
      setRole(storedRole);
    };

    loadRole();
    fetchProfile();
    fetchUnreadCount();

    // Refresh count when drawer might be visible or at intervals
    const interval = setInterval(fetchUnreadCount, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#e8f5e9" },
      ]}
    >
      {/* Profile Section */}
      <View>
        <View style={styles.topSection}>
          <View style={styles.avatarWrapper}>
            {profile?.profilePictureUrl &&
            profile.profilePictureUrl.trim() !== "" &&
            profile.profilePictureUrl !== "null" &&
            !imageError ? (
              <Image
                source={{
                  uri: profile.profilePictureUrl.startsWith("http")
                    ? profile.profilePictureUrl
                    : `https://kolve18freeswing.com${profile.profilePictureUrl}`,
                }}
                style={styles.avatar}
                onError={() => setImageError(true)}
              />
            ) : profile?.username && profile.username.trim() !== "" ? (
              <View style={[styles.avatar, {
                backgroundColor: isDark ? "#333" : "#C5E1A5",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#8BC34A"
              }]}>
                <Text style={{
                  color: isDark ? "#fff" : "#2E7D32",
                  fontSize: 32,
                  fontWeight: "bold"
                }}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: isDark ? "#333" : "#C5E1A5",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#8BC34A",
                  },
                ]}
              >
                <Text
                  style={{
                    color: isDark ? "#fff" : "#2E7D32",
                    fontSize: 32,
                    fontWeight: "bold",
                  }}
                >
                  {profile.username.trim()[0].toUpperCase()}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: "https://i.pravatar.cc/100" }}
                style={styles.avatar}
              />
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{isAdmin ? "Admin" : "User"}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{profile?.username}</Text>
          <Text style={styles.handicap}>
            {isAdmin
              ? "Administrator"
              : `Handicap: ${profile?.handicap || "0"}`}
          </Text>
        </View>

        {/* Drawer Menu */}
        <View style={styles.drawerItems}>
          {/* ADMIN PROFILE */}

          {isAdmin && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(profile)/adminProfile");
                  });
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="shield-outline" size={26} color="#2e7d32" />
                <Text style={styles.drawerText}>Admin Profile</Text>
              </TouchableOpacity>
            </>
          )}
          {/* USER PROFILE */}
          {!isAdmin && (
            <>
              {/* User Profile */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(profile)/userProfile");
                  });
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="person-circle-outline" size={26} color="#2e7d32" />
                <Text style={styles.drawerText}>User Profile</Text>
              </TouchableOpacity>

              {/* Important Updates */}
                <Ionicons
                  name="person-circle-outline"
                  size={26}
                  color="#2e7d32"
                />
                <Text style={styles.drawerText}>User Profile</Text>
              </TouchableOpacity>

              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.closeDrawer();
                    requestAnimationFrame(() => {
                      router.push("/(drawer)/(user)/(startNewRound)");
                    });
                  }}
                  style={styles.drawerItem}
                >
                  <Ionicons
                    name="caret-forward-circle-outline"
                    size={26}
                    color="#2e7d32"
                  />
                  <Text style={styles.drawerText}>Start New Round</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.closeDrawer();
                    requestAnimationFrame(() => {
                      router.push("/(drawer)/(user)/(teeTimeBooking)");
                    });
                  }}
                  style={styles.drawerItem}
                >
                  <Ionicons
                    name="calendar-number-outline"
                    size={26}
                    color="#2e7d32"
                  />
                  <Text style={styles.drawerText}>Tee Time Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.closeDrawer();
                    requestAnimationFrame(() => {
                      router.push("/(drawer)/(user)/(contactAdmin)");
                    });
                  }}
                  style={styles.drawerItem}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={26}
                    color="#2e7d32"
                  />
                  <Text style={styles.drawerText}>Contact Admin</Text>
                </TouchableOpacity>
              </>

              {/* R & A Rules */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(user)/(tabs)/dashboard/importantUpdates");
                    Linking.openURL(
                      "https://www.randa.org/quiz/level/quiz-beginner",
                    );
                  });
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="megaphone-outline" size={26} color="#2e7d32" />
                <View className="flex-row items-center flex-1 justify-between">
                  <Text style={styles.drawerText}>Important Updates</Text>
                  {unreadUpdates > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{unreadUpdates}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* R & A Rules */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    Linking.openURL("https://www.randa.org/quiz/level/quiz-beginner");
                  });
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="book-outline" size={26} color="#2e7d32" />
                <Text style={styles.drawerText}>R & A Rules</Text>
              </TouchableOpacity>
            </>
          )}
                <Ionicons name="book-outline" size={26} color="#2e7d32" />
                <Text style={styles.drawerText}>R & A Rules</Text>
              </TouchableOpacity>
            </>
          )}

          {/* SHOW THESE TWO TABS ALWAYS */}
          {isAdmin && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(admin)/(subAdmins)");
                  });
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="people-outline" size={26} color="#2e7d32" />
                <Text style={styles.drawerText}>Sub Admins</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(admin)/(handicapSetup)");
                  });
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="analytics-outline" size={26} color="#2e7d32" />
                <Text style={styles.drawerText}>Player Handicap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(admin)/(combinedLeaderboards)");
                  });
                }}
                style={styles.drawerItem}
              >
                <Ionicons name="bar-chart-outline" size={26} color="#2e7d32" />
                <Text style={styles.drawerText}>Combined Leaderboards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(drawer)/(admin)/(feedbackInbox)")}
                style={styles.drawerItem}
              >
                <Ionicons
                  name="mail-unread-outline"
                  size={26}
                  color="#2e7d32"
                />
                <Text style={styles.drawerText}>Feedback Inbox</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      {/* Logout */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={[styles.drawerText, { color: "#fff" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function DrawerLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerType: "front",
        drawerStyle: {
          width: 300,
          backgroundColor: isDark ? "#121212" : "#e8f5e9",
        },
      }}
    >
      {/* <Drawer.Screen name="profile" options={{ title: "Profile" }} /> */}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  topSection: {
    alignItems: "center",
    marginTop: 20,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#8bc34a",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  badge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#8bc34a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  userName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#558b2f",
  },
  handicap: {
    fontSize: 14,
    color: "#4caf50",
    marginTop: 4,
  },
  drawerItems: {
    marginTop: 40,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 6,
    backgroundColor: "#8bc34a",
  },
  drawerText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  unreadBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 10,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  logoutContainer: {
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8bc34a",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
});
