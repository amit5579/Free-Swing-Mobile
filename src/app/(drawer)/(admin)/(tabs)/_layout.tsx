import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  TouchableOpacity,
  useColorScheme,
  View,
  StyleSheet,
  Text,
} from "react-native";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile, UserProfile } from "@/api/dashboard";

import { Colors } from "@/constants/theme";

export default function AdminTabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;
        const data = await getUserProfile(Number(userId));
        if (data.profilePictureUrl != null || data.username != null) {
          setProfile(data);
        }
      } catch (error) {
        console.log("Profile error:", error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        // headerTransparent: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerTitle: "",
        headerLeftContainerStyle: { paddingLeft: 0, marginLeft: -10 },
        headerLeft: () => (
          <Image
            source={require("@/assets/FreeSwing.png")}
            style={{ width: 150, height: 80, marginLeft: -20, resizeMode: "contain" }}
          />
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.dispatch(DrawerActions.openDrawer())}
            style={{ marginRight: 20, borderRadius: 21, overflow: "hidden", width: 42, height: 42 }}
          >
            {profile?.profilePictureUrl && profile.profilePictureUrl.trim() !== "" && profile.profilePictureUrl !== "null" && !imageError ? (
              <Image
                source={{ uri: profile.profilePictureUrl.startsWith('http') ? profile.profilePictureUrl : `https://kolve18freeswing.com${profile.profilePictureUrl}` }}
                style={{ width: 42, height: 42, borderRadius: 21 }}
                onError={() => setImageError(true)}
              />
            ) : profile?.username && profile.username.trim() !== "" ? (
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: isDark ? "#333" : "#C5E1A5", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#8BC34A" }}>
                <Text style={{ color: isDark ? "#fff" : "#2E7D32", fontSize: 18, fontWeight: "bold" }}>
                  {profile.username.trim()[0].toUpperCase()}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: "https://i.pravatar.cc/100" }}
                style={{ width: 42, height: 42, borderRadius: 21 }}
              />
            )}
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: "#8bc34a",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarStyle: {
          // backgroundColor: "#ffffff",
          backgroundColor: isDark
            ? "rgba(30,30,30,0.75)"
            : "#fff",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      {/* DASHBOARD */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* MEMBERS */}
      <Tabs.Screen
        name="allMembers/index"
        options={{
          title: "Members",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* CENTERED TOURNAMENT TAB */}
      <Tabs.Screen
        name="tournaments"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={styles.fabOuter}>
              <View style={styles.fabInner}>
                <Ionicons
                  name="trophy"
                  size={32}
                  color={focused ? "#FFD700" : "#ffffff"}
                />
              </View>
            </View>
          ),
        }}
      />

      {/* COURSES */}
      <Tabs.Screen
        name="courses"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "flag" : "flag-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* SHOP */}
      <Tabs.Screen
        name="proShop"
        options={{
          title: "Pro Shop",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} size={size} color={color} />
          ),
        }}
      />


      {/* <Tabs.Screen
        name="playerStatistics"
        options={{
          href: null,
        }}
      /> */}
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
    backgroundColor: "#8bc34a",
    justifyContent: "center",
    alignItems: "center",
  },
});