import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useColorScheme, useThemeControls } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken } from "@/utils/storage";
import { getUserProfile, UserProfile } from "@/api/modules/dashboard.api";
import { Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

function CustomDrawerContent({ navigation }: any) {
  const colorScheme = useColorScheme();
  const { toggleColorScheme } = useThemeControls();
  const isDark = colorScheme === "dark";

  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSubAdmin, setIsSubAdmin] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [imageError, setImageError] = useState(false);
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

  const loadRole = async () => {
    const storedRole = await AsyncStorage.getItem("role");
    const normalizedRole =
      storedRole?.toLowerCase().replace(/[^a-z]/g, "") ?? "";

    if (normalizedRole === "admin") {
      setIsAdmin(true);
    } else if (normalizedRole === "subadmin") {
      setIsSubAdmin(true);
    }
    setRole(storedRole);
  };

  useEffect(() => {
    loadRole();
    fetchProfile();
  }, [fetchProfile, loadRole]);

  useFocusEffect(
    React.useCallback(() => {
      loadRole();
      fetchProfile();
    }, []),
  );

  return (
    <LinearGradient
      colors={isDark ? ["#121212", "#1a1a1a"] : ["#F1F8E9", "#DCEDC8"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topSection}>
          <LinearGradient
            colors={["#8BC34A", "#558b2f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
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
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {profile?.username?.trim()
                      ? profile.username.trim()[0].toUpperCase()
                      : "U"}
                  </Text>
                </View>
              )}
              {/* <LinearGradient
                colors={["#FDD835", "#FBC02D"]}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>
                  {isAdmin ? "Admin" : isSubAdmin ? "Sub Admin" : "User"}
                </Text>
              </LinearGradient> */}
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.userName}>
                {profile?.username || "Guest User"}
              </Text>
              <Text style={styles.userRole}>
                {isAdmin
                  ? "Administrator"
                  : isSubAdmin
                    ? "Sub Administrator"
                    : `Handicap: ${profile?.handicap || "0"}`}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.drawerItemsContainer}>
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
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-outline" size={22} color="#8bc34a" />
                </View>
                <Text style={styles.drawerText}>Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />
            </>
          )}

          {isSubAdmin && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(profile)/subAdminProfile");
                  });
                }}
                style={styles.drawerItem}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(subAdmin)/(contactAdmin)");
                  });
                }}
                style={styles.drawerItem}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Contact Admin</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />
            </>
          )}

          {!isAdmin && !isSubAdmin && (
            <>
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
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />

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
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="calendar-number-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Tee Time Booking</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />
            </>
          )}

          {!isAdmin && !isSubAdmin && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(user)/(subscription)");
                  });
                }}
                style={styles.drawerItem}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="diamond-outline" size={22} color="#8bc34a" />
                </View>
                <Text style={styles.drawerText}>Subscription</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />

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
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Contact Admin</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    Linking.openURL(
                      "https://www.randa.org/quiz/level/quiz-beginner",
                    );
                  });
                }}
                style={styles.drawerItem}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="book-outline" size={22} color="#8bc34a" />
                </View>
                <Text style={styles.drawerText}>R & A Rules</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />
            </>
          )}

          {/* {!isAdmin && (
            <>
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
                <View style={styles.iconContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#8bc34a" />
                </View>
                <Text style={styles.drawerText}>Contact Admin</Text>
                <Ionicons name="chevron-forward" size={18} color="#8bc34a" style={styles.chevron} />
              </TouchableOpacity>
              <View
  style={[
    styles.divider,
    {
      backgroundColor: isDark ? "#fff" : "#000",
      opacity: isDark ? 0.2 : 0.08,
    },
  ]}
/>
            </>
          )} */}

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
                <View style={styles.iconContainer}>
                  <Ionicons name="people-outline" size={22} color="#8bc34a" />
                </View>
                <Text style={styles.drawerText}>Sub Admins</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />

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
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="analytics-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Player Handicap</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />

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
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Leaderboards</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={() => {
                  navigation.closeDrawer();
                  requestAnimationFrame(() => {
                    router.push("/(drawer)/(admin)/(feedbackInbox)");
                  });
                }}
                style={styles.drawerItem}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="mail-unread-outline"
                    size={22}
                    color="#8bc34a"
                  />
                </View>
                <Text style={styles.drawerText}>Feedback Inbox</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8bc34a"
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark ? "#fff" : "#000",
                    opacity: isDark ? 0.2 : 0.08,
                  },
                ]}
              />
            </>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setTimeout(() => {
                toggleColorScheme();
              }, 0);
            }}
            style={styles.drawerItem}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={isDark ? "sunny-outline" : "moon-outline"}
                size={22}
                color="#8bc34a"
              />
            </View>
            <Text style={styles.drawerText}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#8bc34a"
              style={styles.chevron}
            />
          </TouchableOpacity>
          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark ? "#fff" : "#000",
                opacity: isDark ? 0.2 : 0.08,
              },
            ]}
          />
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerType: "front",
        drawerStyle: {
          width: 300,
          backgroundColor: isDark ? "#121212" : "#e8f5e9",
          borderLeftWidth: 2,
          borderLeftColor: "#8BC34A",
          borderTopLeftRadius: 32,
          borderBottomLeftRadius: 32,
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
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    overflow: "hidden",
  },
  topSection: {
    padding: 16,
    marginTop: 10,
    
  },
  headerCard: {
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  badge: {
    position: "absolute",
    bottom: -5,
    right: -12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  userRole: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    fontWeight: "500",
  },
  drawerItemsContainer: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  drawerText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#8bc34a",
  },
  chevron: {
    opacity: 0.5,
  },
  divider: {
    height: 1.5,
    marginHorizontal: 4,
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(46, 125, 50, 0.05)",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8bc34a",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
