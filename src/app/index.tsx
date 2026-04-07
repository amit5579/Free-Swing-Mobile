import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, Image, Text, ImageBackground, StatusBar, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const [storedRole, token] = await Promise.all([
          AsyncStorage.getItem("role"),
          AsyncStorage.getItem("token")
        ]);

        if (!token || !storedRole) {
          router.replace("/(auth)/login");
          return;
        }

        const lowerRole = storedRole.toLowerCase().replace(/[^a-z]/g, '');
        if (lowerRole === "admin") {
          router.replace("/(drawer)/(admin)/(tabs)/dashboard");
        } else if (lowerRole === "subadmin") {
          router.replace("/(drawer)/(subAdmin)/(tabs)/dashboard" as any);
        } else {
          router.replace("/(drawer)/(user)/(tabs)/dashboard");
        }
      } catch (err) {
        console.log("Error reading auth state:", err);
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require("../../assets/golf-bgg.jpg")}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Image
              source={require("../../assets/FreeSwing.png")}
              style={{
                width: 140,
                height: 140,
                marginBottom: 20,
                borderRadius: 20,
              }}
              resizeMode="contain"
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 36,
                fontWeight: "bold",
                letterSpacing: 2,
                textShadowColor: "rgba(0, 0, 0, 0.75)",
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 10,
              }}
            >
              FREE SWING
            </Text>
            <View
              style={{
                width: 50,
                height: 4,
                backgroundColor: "#8bc34a",
                marginTop: 10,
                borderRadius: 2,
              }}
            />
            <Text
              style={{
                color: "#e0f2d9",
                fontSize: 16,
                marginTop: 15,
                fontWeight: "500",
              }}
            >
              The Ultimate Golf Companion
            </Text>
          </View>

          <View style={{ position: "absolute", bottom: 50 }}>
            <ActivityIndicator size="large" color="#8bc34a" />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}


// import { Redirect } from 'expo-router';
// import React from 'react';

// export default function HomeScreen() {
//   return <Redirect href="/(drawer)/(admin)/(tabs)/dashboard" />;
// }