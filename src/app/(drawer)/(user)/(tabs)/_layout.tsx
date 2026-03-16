import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, useColorScheme, View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

export default function TabLayout() {
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
          backgroundColor: isDark
            ? "rgba(30,30,30,0.75)"
            : "#fff", height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      {/* DASHBOARD */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* TOURNAMENTS */}
      <Tabs.Screen
        name="tournaments/index"
        options={{
          title: "Tournaments",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "trophy" : "trophy-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* NEW ROUND - FAB style */}
      <Tabs.Screen
        name="newRound/index"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={styles.fabOuter}>
              <View style={styles.fabInner}>
                <Ionicons name="add" size={32} color="#fff" />
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
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* SHOP */}
      <Tabs.Screen
        name="shop/index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} size={size} color={color} />
          ),
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
    backgroundColor: "#8bc34a",
    justifyContent: "center",
    alignItems: "center",
  },
});