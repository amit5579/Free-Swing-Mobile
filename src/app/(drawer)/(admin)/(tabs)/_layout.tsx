import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import {
  Image,
  TouchableOpacity,
  useColorScheme,
  View,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

export default function AdminTabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
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
            style={{ marginRight: 30, borderRadius: 20, overflow: "hidden" }}
          >
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              style={{ width: 42, height: 42, borderRadius: 21 }}
            />
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

      <Tabs.Screen
        name="subAdmins"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="handicapSetup"
        options={{
          href: null,
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