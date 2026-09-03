import { Ionicons } from "@expo/vector-icons";
import { router, Tabs, useFocusEffect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  TouchableOpacity,
  useColorScheme,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile, UserProfile } from "@/api/modules/dashboard.api";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Skeleton } from "@/components/Skeleton";

import { Colors } from "@/constants/theme";

export default function TabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;
      const data = await getUserProfile(Number(userId));
      if (data.profilePictureUrl != null || data.username != null) {
        setProfile(data);
      }
    } catch (error) {
      console.log("Profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <Tabs
      screenOptions={{
        freezeOnBlur: true,
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: isDark ? "#161618" : "#FFFFFF",
        },
        headerTitle: "",
        headerLeftContainerStyle: { paddingLeft: 0, marginLeft: -10 },
        headerLeft: () => (
          <Image
            source={require("@/assets/FreeSwing.png")}
            style={{
              width: 150,
              height: 80,
              marginLeft: -20,
              resizeMode: "contain",
            }}
          />
        ),
        headerRight: () => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginRight: 16,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(drawer)/(user)/(importantUpdates)")}
              style={{
                width: 38,
                height: 38,
                // borderRadius: 19,
                // backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "rgba(139,195,74,0.12)",
                // borderWidth: 1,
                borderColor: "#8BC34A",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="megaphone-outline" size={22} color="#8BC34A" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.getParent()?.dispatch(DrawerActions.openDrawer())
              }
              style={{
                borderRadius: 21,
                overflow: "hidden",
                width: 42,
                height: 42,
              }}
            >
              {loading ? (
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: isDark ? "#333" : "#F5F5F5",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#8BC34A",
                  }}
                >
                  <Ionicons name="person" size={24} color="#8BC34A" />
                </View>
              ) : profile?.profilePictureUrl &&
                profile.profilePictureUrl.trim() !== "" &&
                profile.profilePictureUrl !== "null" &&
                !imageError ? (
                <Image
                  source={{
                    uri: profile.profilePictureUrl.startsWith("http")
                      ? profile.profilePictureUrl
                      : `https://kolve18freeswing.com${profile.profilePictureUrl}`,
                  }}
                  style={{ width: 42, height: 42, borderRadius: 21 }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: isDark ? "#333" : "#C5E1A5",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#8BC34A",
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#fff" : "#2E7D32",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    {profile?.username?.trim()
                      ? profile.username.trim()[0].toUpperCase()
                      : "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ),
        tabBarActiveTintColor: "#8bc34a",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarStyle: {
          backgroundColor: isDark ? "rgba(30,30,30,0.75)" : "#fff",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      {/* DASHBOARD */}
      <Tabs.Screen
        name="dashboard"
        options={{
          headerStyle: {
            backgroundColor: isDark ? "#161618" : "#FFFFFF",
          },
          headerLeft: () => {
            if (!profile) {
              return (
                <View style={{ marginLeft: 20, paddingVertical: 10 }}>
                  <Skeleton
                    isDark={isDark}
                    width={80}
                    height={12}
                    style={{ marginBottom: 8 }}
                    borderRadius={4}
                  />
                  <Skeleton
                    isDark={isDark}
                    width={140}
                    height={28}
                    borderRadius={4}
                  />
                </View>
              );
            }

            return (
              <View style={{ marginLeft: 20, paddingVertical: 10 }}>
                <HStack space="xs" className="items-center">
                  <Text
                    style={{
                      color: isDark ? "#A3A3A3" : "#737373",
                      fontSize: 10,
                      fontWeight: "900",
                      letterSpacing: 2.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Welcome Back
                  </Text>
                  <Text style={{ fontSize: 12 }}>👋</Text>
                </HStack>
                <HStack space="xs" className="items-baseline">
                  <Text
                    style={{
                      color: "#8BC34A",
                      fontSize: 24,
                      fontWeight: "900",
                      letterSpacing: -0.8,
                      marginTop: -2,
                    }}
                  >
                    {profile.username.toUpperCase()}
                  </Text>
                </HStack>
              </View>
            );
          },
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* TOURNAMENTS */}
      <Tabs.Screen
        name="tournaments"
        options={{
          title: "Tournaments",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* NEW ROUND - FAB style */}
      <Tabs.Screen
        name="newRound"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={styles.fabOuter}>
              <View
                style={[
                  styles.fabInner,
                  {
                    backgroundColor: focused ? "#8bc34a" : "#fff",
                  },
                ]}
              >
                <Ionicons
                  name="add"
                  size={32}
                  color={focused ? "#FFF" : "#8bc34a"}
                />
              </View>
            </View>
          ),
        }}
      />

      {/* BOOK GAME */}
      <Tabs.Screen
        name="bookGame/index"
        options={{
          title: "Book Game",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* SHOP */}
      <Tabs.Screen
        name="shop/index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="[id]"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#8bc34a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});
