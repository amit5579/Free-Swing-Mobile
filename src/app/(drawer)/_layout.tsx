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

function CustomDrawerContent() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      setRole(storedRole);
    };

    loadRole();
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#e8f5e9" },
      ]}
    >
      {/* Profile Section */}
      <View style={styles.topSection}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.avatar}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{role === "admin" ? "Admin" : "User"}</Text>
          </View>
        </View>

        <Text style={styles.userName}>John Doe</Text>
        <Text style={styles.handicap}>
          {role === "admin" ? "Administrator" : "Handicap: 5"}
        </Text>
      </View>

      {/* Drawer Menu */}
      <View style={styles.drawerItems}>
        {/* ADMIN PROFILE */}
        <TouchableOpacity
          onPress={() => router.push("/(drawer)/(profile)/adminProfile")}
          style={styles.drawerItem}
        >
          <Ionicons name="shield-outline" size={26} color="#2e7d32" />
          <Text style={styles.drawerText}>Admin Profile</Text>
        </TouchableOpacity>

        {/* USER PROFILE */}
        <TouchableOpacity
          onPress={() => router.push("/(drawer)/(profile)/userProfile")}
          style={styles.drawerItem}
        >
          <Ionicons name="person-circle-outline" size={26} color="#2e7d32" />
          <Text style={styles.drawerText}>User Profile</Text>
        </TouchableOpacity>

        {/* SHOW THESE TWO TABS ALWAYS */}
        <TouchableOpacity
          onPress={() => router.replace("/(drawer)/(admin)/(tabs)/subAdmins")}
          style={styles.drawerItem}
        >
          <Ionicons name="people-outline" size={26} color="#2e7d32" />
          <Text style={styles.drawerText}>Sub Admins</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(drawer)/(admin)/(tabs)/handicapSetup")}
          style={styles.drawerItem}
        >
          <Ionicons name="analytics-outline" size={26} color="#2e7d32" />
          <Text style={styles.drawerText}>Player Handicap</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.removeItem("role");
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
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerStyle: {
          width: 300,
          backgroundColor: isDark ? "#121212" : "#e8f5e9",
        },
      }}
    >
      <Drawer.Screen name="profile" options={{ title: "Profile" }} />
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